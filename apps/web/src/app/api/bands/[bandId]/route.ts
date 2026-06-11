import {NextResponse, type NextRequest} from 'next/server'

import {isSupabaseConfigured} from '@/lib/env'
import {resolveRequestContext} from '@/lib/server/request-context'
import {createClient} from '@/lib/supabase/server'
import {BandServiceError} from '@/server/bands/service-error'
import {updateBand} from '@/server/bands/update-band'

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
  const rawBody = await request.json().catch(() => null)

  try {
    const payload = await updateBand(user.id, bandId, rawBody, requestContext)
    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof BandServiceError) {
      const details = typeof error.details === 'object' && error.details ? {...(error.details as Record<string, unknown>)} : {}
      const headers = 'headers' in details ? (details.headers as HeadersInit | undefined) : undefined
      delete details.headers
      const body = {
        message: error.message,
        ...details,
      }

      return NextResponse.json(body, {status: error.status, headers})
    }

    throw error
  }
}
