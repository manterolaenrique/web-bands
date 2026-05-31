import {revalidatePath} from 'next/cache'
import {NextResponse, type NextRequest} from 'next/server'

import {canEditBand, getMembershipRole} from '@/lib/auth/permissions'
import {bandUpdateSchema, getValidationErrors} from '@/lib/bands/validation'
import {isSupabaseConfigured} from '@/lib/env'
import {resolveBandDocumentId} from '@/lib/sanity/document-id'
import {upsertBandDocument} from '@/lib/sanity/mutations'
import {writeAuditLog} from '@/lib/server/audit'
import {logServerError, logServerWarning} from '@/lib/server/log'
import {resolveRequestContext} from '@/lib/server/request-context'
import {consumeRateLimit, getRateLimitHeaders, RATE_LIMIT_POLICIES} from '@/lib/server/rate-limit'
import {createClient} from '@/lib/supabase/server'
import type {SupabaseBand} from '@/types/band'

type RouteContext = {
  params: Promise<{
    bandId: string
  }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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

  const rateLimitResult = await consumeRateLimit(RATE_LIMIT_POLICIES.bandWrite, [user.id, bandId])

  if (!rateLimitResult.allowed) {
    logServerWarning('rate_limit.blocked', {
      action: 'bands.patch',
      bandId,
      bucket: RATE_LIMIT_POLICIES.bandWrite.bucket,
      keyHash: rateLimitResult.keyHash,
      requestId: requestContext.requestId,
      retryAfterSeconds: rateLimitResult.retryAfterSeconds,
      userId: user.id,
    })

    return NextResponse.json(
      {
        message: 'Too many band updates right now. Try again in a few minutes.',
        retryAfterSeconds: rateLimitResult.retryAfterSeconds,
      },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    )
  }

  const rawBody = await request.json().catch(() => null)
  const parsed = bandUpdateSchema.safeParse(rawBody)

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: 'Invalid band payload.',
        errors: getValidationErrors(parsed.error),
      },
      {status: 400}
    )
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
        userId: user.id,
      })
    }

    return NextResponse.json({message: 'Band not found.'}, {status: 404})
  }

  const typedBandRow = bandRow as SupabaseBand
  const oldSlug = typedBandRow.slug
  const documentId = resolveBandDocumentId(typedBandRow)

  try {
    await upsertBandDocument(documentId, typedBandRow.id, parsed.data, user.id)
  } catch (error) {
    logServerError('bands.patch.sanity_upsert_failed', error, {
      bandId,
      userId: user.id,
      documentId,
    })

    return NextResponse.json(
      {
        message:
          error instanceof Error && error.message.includes('SANITY_API_WRITE_TOKEN')
            ? 'Sanity write token is not configured server-side.'
            : 'Sanity could not save the band document.',
      },
      {status: 503}
    )
  }

  const {error: updateError} = await supabase
    .from('bands')
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      status: parsed.data.status,
      sanity_document_id: documentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', typedBandRow.id)

  if (updateError) {
    logServerError('bands.patch.supabase_update_failed', updateError, {
      bandId,
      userId: user.id,
      documentId,
    })

    return NextResponse.json(
      {
        message: 'Sanity was saved, but Supabase metadata could not be updated.',
      },
      {status: 500}
    )
  }

  revalidatePath('/')
  revalidatePath(`/bandas/${parsed.data.slug}`)
  if (oldSlug !== parsed.data.slug) {
    revalidatePath(`/bandas/${oldSlug}`)
  }

  await writeAuditLog({
    action: 'band.updated',
    actorUserId: user.id,
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

  return NextResponse.json({
    ok: true,
    band: {
      id: typedBandRow.id,
      slug: parsed.data.slug,
      sanityDocumentId: documentId,
    },
  })
}
