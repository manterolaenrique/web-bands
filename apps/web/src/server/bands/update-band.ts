import type {BandUpdateInput} from '@web-bands/bands-domain'

import {revalidatePath} from 'next/cache'

import {canEditBand, getMembershipRole} from '@/lib/auth/permissions'
import {bandUpdateSchema, getValidationErrors} from '@/lib/bands/validation'
import {resolveBandDocumentId} from '@/lib/sanity/document-id'
import {upsertBandDocument} from '@/lib/sanity/mutations'
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

export async function updateBand(
  userId: string,
  bandId: string,
  rawBody: unknown,
  requestContext: RequestContext
) {
  const supabase = await createClient()
  const role = await getMembershipRole(supabase, bandId, userId)

  if (!canEditBand(role)) {
    throw new BandServiceError('You do not have permission to edit this band.', 403)
  }

  const rateLimitResult = await consumeRateLimit(RATE_LIMIT_POLICIES.bandWrite, [userId, bandId])

  if (!rateLimitResult.allowed) {
    logServerWarning('rate_limit.blocked', {
      action: 'bands.patch',
      bandId,
      bucket: RATE_LIMIT_POLICIES.bandWrite.bucket,
      keyHash: rateLimitResult.keyHash,
      requestId: requestContext.requestId,
      retryAfterSeconds: rateLimitResult.retryAfterSeconds,
      userId,
    })

    throw new BandServiceError('Too many band updates right now. Try again in a few minutes.', 429, {
      retryAfterSeconds: rateLimitResult.retryAfterSeconds,
      headers: getRateLimitHeaders(rateLimitResult),
    })
  }

  const parsed = bandUpdateSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw new BandServiceError('Invalid band payload.', 400, {
      errors: getValidationErrors(parsed.error),
    })
  }

  const {data: bandRow, error: bandError} = await supabase
    .from('bands')
    .select('id, slug, name, sanity_document_id, status, created_by, created_at, updated_at')
    .eq('id', bandId)
    .maybeSingle()

  if (bandError || !bandRow) {
    if (bandError) {
      logServerError('bands.patch.band_lookup_failed', bandError, {
        bandId,
        userId,
      })
    }

    throw new BandServiceError('Band not found.', 404)
  }

  const typedBandRow = bandRow as SupabaseBand
  const oldSlug = typedBandRow.slug
  const documentId = resolveBandDocumentId(typedBandRow)
  const syncedAt = new Date().toISOString()

  try {
    await upsertBandDocument(documentId, typedBandRow.id, parsed.data as BandUpdateInput, userId, syncedAt)
  } catch (error) {
    logServerError('bands.patch.sanity_upsert_failed', error, {
      bandId,
      userId,
      documentId,
    })

    throw new BandServiceError(
      error instanceof Error && error.message.includes('SANITY_API_WRITE_TOKEN')
        ? 'Sanity write token is not configured server-side.'
        : 'Sanity could not save the band document.',
      503
    )
  }

  const {error: updateError} = await supabase
    .from('bands')
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      status: parsed.data.status,
      sanity_document_id: documentId,
      updated_at: syncedAt,
    })
    .eq('id', typedBandRow.id)

  if (updateError) {
    logServerError('bands.patch.supabase_update_failed', updateError, {
      bandId,
      userId,
      documentId,
    })

    throw new BandServiceError('Sanity was saved, but Supabase metadata could not be updated.', 500)
  }

  revalidatePath('/')
  revalidatePath(`/bandas/${parsed.data.slug}`)
  if (oldSlug !== parsed.data.slug) {
    revalidatePath(`/bandas/${oldSlug}`)
  }

  await writeAuditLog({
    action: 'band.updated',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      documentId,
      requestId: requestContext.requestId,
      slug: parsed.data.slug,
      status: parsed.data.status,
    },
    targetId: typedBandRow.id,
    targetType: 'band',
    userAgent: requestContext.userAgent,
  })

  return {
    ok: true,
    band: {
      id: typedBandRow.id,
      slug: parsed.data.slug,
      sanityDocumentId: documentId,
      syncedAt,
    },
  }
}
