import {NextRequest, NextResponse} from 'next/server'

import {resolveRequestContext} from '@/lib/server/request-context'
import {
  deleteBandSetlist,
  getBandSetlistEditorPayload,
  updateBandSetlist,
} from '@/server/bands/setlists'
import {BandServiceError} from '@/server/bands/service-error'

import {mapSetlistsServiceError, requireSetlistsUser} from '../route-utils'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    bandId: string
    setlistId: string
  }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireSetlistsUser()
  if (auth.response || !auth.user) {
    return auth.response
  }

  const {bandId, setlistId} = await context.params

  try {
    const payload = await getBandSetlistEditorPayload(auth.user.id, bandId, setlistId)
    if (!payload) {
      return NextResponse.json({message: 'Setlist not found.'}, {status: 404})
    }

    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof BandServiceError) {
      return mapSetlistsServiceError(error)
    }

    throw error
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireSetlistsUser()
  if (auth.response || !auth.user) {
    return auth.response
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({message: 'Request body is required.'}, {status: 400})
  }

  const {bandId, setlistId} = await context.params

  try {
    const payload = await updateBandSetlist(
      auth.user.id,
      bandId,
      setlistId,
      body,
      resolveRequestContext(request.headers)
    )
    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof BandServiceError) {
      return mapSetlistsServiceError(error)
    }

    throw error
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireSetlistsUser()
  if (auth.response || !auth.user) {
    return auth.response
  }

  const {bandId, setlistId} = await context.params

  try {
    const payload = await deleteBandSetlist(
      auth.user.id,
      bandId,
      setlistId,
      resolveRequestContext(request.headers)
    )
    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof BandServiceError) {
      return mapSetlistsServiceError(error)
    }

    throw error
  }
}
