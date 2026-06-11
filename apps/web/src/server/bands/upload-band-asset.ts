import {revalidatePath} from 'next/cache'

import {canEditBand, getMembershipRole} from '@/lib/auth/permissions'
import {createSanityImageRef} from '@/lib/bands/validation'
import {shouldUpdateBandDocumentId} from '@/lib/sanity/document-id'
import {getSanityImageUrl} from '@/lib/sanity/image'
import {uploadBandImage, type BandImageTarget} from '@/lib/sanity/mutations'
import {writeAuditLog} from '@/lib/server/audit'
import {logServerError, logServerWarning} from '@/lib/server/log'
import {consumeRateLimit, getRateLimitHeaders, RATE_LIMIT_POLICIES} from '@/lib/server/rate-limit'
import {createClient} from '@/lib/supabase/server'
import type {SupabaseBand} from '@/types/band'
import {BandServiceError} from './service-error'

type RequestContext = {
  ip: string | null
  requestId: string | null
  userAgent: string | null
}

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function uploadBandAsset(
  userId: string,
  bandId: string,
  target: BandImageTarget | null,
  file: File | null,
  requestContext: RequestContext
) {
  const supabase = await createClient()
  const role = await getMembershipRole(supabase, bandId, userId)

  if (!canEditBand(role)) {
    throw new BandServiceError('You do not have permission to edit this band.', 403)
  }

  const rateLimitResult = await consumeRateLimit(RATE_LIMIT_POLICIES.assetUpload, [userId, bandId])

  if (!rateLimitResult.allowed) {
    logServerWarning('rate_limit.blocked', {
      action: 'bands.assets.upload',
      bandId,
      bucket: RATE_LIMIT_POLICIES.assetUpload.bucket,
      keyHash: rateLimitResult.keyHash,
      requestId: requestContext.requestId,
      retryAfterSeconds: rateLimitResult.retryAfterSeconds,
      userId,
    })

    throw new BandServiceError('Too many image uploads right now. Try again in a few minutes.', 429, {
      retryAfterSeconds: rateLimitResult.retryAfterSeconds,
      headers: getRateLimitHeaders(rateLimitResult),
    })
  }

  if (!target) {
    throw new BandServiceError('Invalid image field.', 400)
  }

  if (!(file instanceof File)) {
    throw new BandServiceError('Image file is required.', 400)
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new BandServiceError('Only JPG, PNG and WebP images are allowed.', 400)
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new BandServiceError('Image must be 5MB or smaller.', 400)
  }

  const {data: bandRow, error: bandError} = await supabase
    .from('bands')
    .select('id, slug, name, sanity_document_id, status, created_by, created_at, updated_at')
    .eq('id', bandId)
    .maybeSingle()

  if (bandError || !bandRow) {
    if (bandError) {
      logServerError('bands.assets.band_lookup_failed', bandError, {
        bandId,
        userId,
      })
    }

    throw new BandServiceError('Band not found.', 404)
  }

  const typedBandRow = bandRow as SupabaseBand
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const {asset, documentId, fieldPath} = await uploadBandImage({
      band: typedBandRow,
      target,
      file: buffer,
      userId,
    })

    if (shouldUpdateBandDocumentId(typedBandRow, documentId)) {
      const {error: updateError} = await supabase
        .from('bands')
        .update({
          sanity_document_id: documentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', typedBandRow.id)

      if (updateError) {
        logServerError('bands.assets.supabase_update_failed', updateError, {
          bandId,
          userId,
          documentId,
          target: JSON.stringify(target),
        })

        throw new BandServiceError('Image was uploaded, but Supabase metadata could not be updated.', 500)
      }
    }

    revalidatePath('/')
    revalidatePath(`/bandas/${typedBandRow.slug}`)

    await writeAuditLog({
      action: 'band.asset_uploaded',
      actorUserId: userId,
      bandId,
      ip: requestContext.ip,
      metadata: {
        assetId: asset._id,
        fieldPath,
        mimeType: file.type,
        requestId: requestContext.requestId,
        size: file.size,
        targetKind: target.kind,
      },
      targetId: asset._id,
      targetType: 'sanity_asset',
      userAgent: requestContext.userAgent,
    })

    return {
      ok: true,
      image: {
        field: target.kind === 'field' ? target.field : undefined,
        collection: target.kind === 'array' ? target.collection : undefined,
        itemKey: target.kind === 'array' ? target.itemKey : undefined,
        imageField: target.kind === 'array' ? target.imageField : undefined,
        fieldPath,
        assetId: asset._id,
        url: getSanityImageUrl(createSanityImageRef(asset._id), {width: 640, height: 640, fit: 'max'}),
      },
    }
  } catch (error) {
    if (error instanceof BandServiceError) {
      throw error
    }

    logServerError('bands.assets.sanity_upload_failed', error, {
      bandId,
      userId,
      target: JSON.stringify(target),
    })

    throw new BandServiceError(
      error instanceof Error && error.message.includes('SANITY_API_WRITE_TOKEN')
        ? 'Sanity write token is not configured server-side.'
        : 'Sanity could not upload the image.',
      503
    )
  }
}
