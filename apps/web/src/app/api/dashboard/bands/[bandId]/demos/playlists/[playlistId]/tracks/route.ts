import {NextResponse, type NextRequest} from 'next/server'

import {isSupabaseConfigured} from '@/lib/env'
import {resolveRequestContext} from '@/lib/server/request-context'
import {createClient} from '@/lib/supabase/server'
import {BandServiceError} from '@/server/bands/service-error'
import {addTrackToPlaylist} from '@/server/demos/playlists'

type RouteContext = {
  params: Promise<{
    bandId: string
    playlistId: string
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

  const {bandId, playlistId} = await context.params
  const body = (await request.json().catch(() => null)) as {trackId?: string} | null
  const trackId = typeof body?.trackId === 'string' ? body.trackId : ''
  const requestContext = resolveRequestContext(request.headers)

  try {
    const payload = await addTrackToPlaylist(user.id, bandId, playlistId, trackId, requestContext)
    return NextResponse.json(payload, {status: 201})
  } catch (error) {
    if (error instanceof BandServiceError) {
      return mapServiceError(error)
    }

    throw error
  }
}
