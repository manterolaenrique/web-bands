import {NextResponse, type NextRequest} from 'next/server'

import {isSupabaseConfigured} from '@/lib/env'
import {resolveRequestContext} from '@/lib/server/request-context'
import {createClient} from '@/lib/supabase/server'
import {BandServiceError} from '@/server/bands/service-error'
import {deleteBandPlaylist, getBandPlaylist, updateBandPlaylist} from '@/server/demos/playlists'

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

async function readPlaylistPayload(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('multipart/form-data')) {
    return request.formData()
  }

  return request.json().catch(() => null)
}

export async function GET(_request: NextRequest, context: RouteContext) {
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

  try {
    const payload = await getBandPlaylist(user.id, bandId, playlistId)
    if (!payload) {
      return NextResponse.json({message: 'Playlist not found.'}, {status: 404})
    }

    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof BandServiceError) {
      return mapServiceError(error)
    }

    throw error
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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
  const body = await readPlaylistPayload(request)
  const requestContext = resolveRequestContext(request.headers)

  try {
    const payload = await updateBandPlaylist(user.id, bandId, playlistId, body, requestContext)
    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof BandServiceError) {
      return mapServiceError(error)
    }

    throw error
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
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
  const requestContext = resolveRequestContext(request.headers)

  try {
    const payload = await deleteBandPlaylist(user.id, bandId, playlistId, requestContext)
    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof BandServiceError) {
      return mapServiceError(error)
    }

    throw error
  }
}
