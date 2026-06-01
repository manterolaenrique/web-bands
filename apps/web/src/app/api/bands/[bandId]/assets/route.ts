import {revalidatePath} from 'next/cache'
import {NextResponse, type NextRequest} from 'next/server'

import {canEditBand, getMembershipRole} from '@/lib/auth/permissions'
import {isSupabaseConfigured} from '@/lib/env'
import {shouldUpdateBandDocumentId} from '@/lib/sanity/document-id'
import {getSanityImageUrl} from '@/lib/sanity/image'
import {
  isBandArrayImageCollection,
  isBandArrayImageField,
  isBandImageField,
  uploadBandImage,
} from '@/lib/sanity/mutations'
import {writeAuditLog} from '@/lib/server/audit'
import {logServerError, logServerWarning} from '@/lib/server/log'
import {resolveRequestContext} from '@/lib/server/request-context'
import {consumeRateLimit, getRateLimitHeaders, RATE_LIMIT_POLICIES} from '@/lib/server/rate-limit'
import {createClient} from '@/lib/supabase/server'
import type {SupabaseBand} from '@/types/band'
import {createSanityImageRef} from '@/lib/bands/validation'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function resolveUploadTarget(formData: FormData | null) {
  const field = formData?.get('field')
  if (typeof field === 'string' && isBandImageField(field)) {
    return {
      kind: 'field' as const,
      field,
    }
  }

  const collection = formData?.get('collection')
  const itemKey = formData?.get('itemKey')
  const imageField = formData?.get('imageField')

  if (
    typeof collection === 'string' &&
    isBandArrayImageCollection(collection) &&
    typeof itemKey === 'string' &&
    itemKey.trim().length > 0 &&
    typeof imageField === 'string' &&
    isBandArrayImageField(collection, imageField)
  ) {
    return {
      kind: 'array' as const,
      collection,
      itemKey: itemKey.trim(),
      imageField,
    }
  }

  return null
}

type RouteContext = {
  params: Promise<{
    bandId: string
  }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({message: 'Supabase is not configured.'}, {status: 503})
  }

  const {bandId} = await context.params
  const requestContext = resolveRequestContext(request.headers)
  const supabase = await createClient()
  const {
    data: {user},
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({message: 'Authentication required.'}, {status: 401})
  }

  const role = await getMembershipRole(supabase, bandId, user.id)

  if (!canEditBand(role)) {
    return NextResponse.json({message: 'You do not have permission to edit this band.'}, {status: 403})
  }

  const rateLimitResult = await consumeRateLimit(RATE_LIMIT_POLICIES.assetUpload, [user.id, bandId])

  if (!rateLimitResult.allowed) {
    logServerWarning('rate_limit.blocked', {
      action: 'bands.assets.upload',
      bandId,
      bucket: RATE_LIMIT_POLICIES.assetUpload.bucket,
      keyHash: rateLimitResult.keyHash,
      requestId: requestContext.requestId,
      retryAfterSeconds: rateLimitResult.retryAfterSeconds,
      userId: user.id,
    })

    return NextResponse.json(
      {
        message: 'Too many image uploads right now. Try again in a few minutes.',
        retryAfterSeconds: rateLimitResult.retryAfterSeconds,
      },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    )
  }

  const formData = await request.formData().catch(() => null)
  const target = resolveUploadTarget(formData)
  const file = formData?.get('file')

  if (!target) {
    return NextResponse.json({message: 'Invalid image field.'}, {status: 400})
  }

  if (!(file instanceof File)) {
    return NextResponse.json({message: 'Image file is required.'}, {status: 400})
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({message: 'Only JPG, PNG and WebP images are allowed.'}, {status: 400})
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({message: 'Image must be 5MB or smaller.'}, {status: 400})
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
        userId: user.id,
      })
    }

    return NextResponse.json({message: 'Band not found.'}, {status: 404})
  }

  const typedBandRow = bandRow as SupabaseBand
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const {asset, documentId, fieldPath} = await uploadBandImage({
      band: typedBandRow,
      target,
      file: buffer,
      userId: user.id,
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
          userId: user.id,
          documentId,
          target: JSON.stringify(target),
        })

        return NextResponse.json(
          {message: 'Image was uploaded, but Supabase metadata could not be updated.'},
          {status: 500}
        )
      }
    }

    revalidatePath('/')
    revalidatePath(`/bandas/${typedBandRow.slug}`)

    await writeAuditLog({
      action: 'band.asset_uploaded',
      actorUserId: user.id,
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

    return NextResponse.json({
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
    })
  } catch (error) {
    logServerError('bands.assets.sanity_upload_failed', error, {
      bandId,
      userId: user.id,
      target: JSON.stringify(target),
    })

    return NextResponse.json(
      {
        message:
          error instanceof Error && error.message.includes('SANITY_API_WRITE_TOKEN')
            ? 'Sanity write token is not configured server-side.'
            : 'Sanity could not upload the image.',
      },
      {status: 503}
    )
  }
}
