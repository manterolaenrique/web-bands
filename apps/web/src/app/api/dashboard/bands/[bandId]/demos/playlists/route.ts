import {NextResponse, type NextRequest} from 'next/server'

import {isSupabaseConfigured} from '@/lib/env'
import {resolveRequestContext} from '@/lib/server/request-context'
import {createClient} from '@/lib/supabase/server'
import {BandServiceError} from '@/server/bands/service-error'
import {createBandPlaylist, getBandPlaylists} from '@/server/demos/playlists'

type RouteContext = {
  params: Promise<{
    bandId: string
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

export async function GET(request: NextRequest, context: RouteContext) {
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

  const {bandId} = await context.params
  const query = request.nextUrl.searchParams.get('q')

  try {
    const payload = await getBandPlaylists(user.id, bandId, query)
    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof BandServiceError) {
      return mapServiceError(error)
    }

    throw error
  }
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

  const {bandId} = await context.params
  const body = await readPlaylistPayload(request)
  const requestContext = resolveRequestContext(request.headers)

  try {
    const payload = await createBandPlaylist(user.id, bandId, body, requestContext)
    return NextResponse.json(payload, {status: 201})
  } catch (error) {
    if (error instanceof BandServiceError) {
      return mapServiceError(error)
    }

    throw error
  }
}
