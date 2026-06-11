import {NextResponse, type NextRequest} from 'next/server'

import {trackAccessSchema} from '@web-bands/bands-domain'
import {ZodError} from 'zod'

import {isSupabaseConfigured} from '@/lib/env'
import {createClient} from '@/lib/supabase/server'
import {BandServiceError} from '@/server/bands/service-error'
import {getBandTrackAccess} from '@/server/demos/tracks'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    bandId: string
    trackId: string
  }>
}

function mapServiceError(error: BandServiceError) {
  const details =
    typeof error.details === 'object' && error.details ? {...(error.details as Record<string, unknown>)} : {}
  const headers = 'headers' in details ? (details.headers as HeadersInit | undefined) : undefined
  delete details.headers

  return NextResponse.json(
    {
      message: error.message,
      ...details,
    },
    {status: error.status, headers}
  )
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({message: 'Supabase is not configured.'}, {status: 503})
  }

  const supabase = await createClient()
  const {
    data: {user},
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({message: 'Authentication required.'}, {status: 401})
  }

  const {bandId, trackId} = await context.params
  const body = await request.json().catch(() => null)

  try {
    const input = trackAccessSchema.parse(body)
    const payload = await getBandTrackAccess(user.id, bandId, trackId, input)
    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({message: 'Invalid access payload.'}, {status: 400})
    }

    if (error instanceof BandServiceError) {
      return mapServiceError(error)
    }

    throw error
  }
}
