import {NextResponse, type NextRequest} from 'next/server'

import {isSupabaseConfigured} from '@/lib/env'
import {resolveRequestContext} from '@/lib/server/request-context'
import {createClient} from '@/lib/supabase/server'
import {BandServiceError} from '@/server/bands/service-error'
import {getBandTrack, updateBandTrack, deleteBandTrack} from '@/server/demos/tracks'

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

async function requireAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: {user},
  } = await supabase.auth.getUser()

  return user
}

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({message: 'Supabase is not configured.'}, {status: 503})
  }

  const user = await requireAuthenticatedUser()
  if (!user) {
    return NextResponse.json({message: 'Authentication required.'}, {status: 401})
  }

  const {bandId, trackId} = await context.params

  try {
    const payload = await getBandTrack(user.id, bandId, trackId)
    if (!payload) {
      return NextResponse.json({message: 'Track not found.'}, {status: 404})
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

  const user = await requireAuthenticatedUser()
  if (!user) {
    return NextResponse.json({message: 'Authentication required.'}, {status: 401})
  }

  const {bandId, trackId} = await context.params
  const requestContext = resolveRequestContext(request.headers)
  const body = await request.json().catch(() => null)

  try {
    const payload = await updateBandTrack(user.id, bandId, trackId, body, requestContext)
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

  const user = await requireAuthenticatedUser()
  if (!user) {
    return NextResponse.json({message: 'Authentication required.'}, {status: 401})
  }

  const {bandId, trackId} = await context.params
  const requestContext = resolveRequestContext(request.headers)

  try {
    const payload = await deleteBandTrack(user.id, bandId, trackId, requestContext)
    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof BandServiceError) {
      return mapServiceError(error)
    }

    throw error
  }
}
