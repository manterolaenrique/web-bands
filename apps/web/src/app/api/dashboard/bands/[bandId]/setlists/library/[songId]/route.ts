import {NextRequest} from 'next/server'

import {resolveRequestContext} from '@/lib/server/request-context'
import {deleteBandSongLibraryItem, updateBandSongLibraryItem} from '@/server/bands/setlists'
import {BandServiceError} from '@/server/bands/service-error'

import {mapSetlistsServiceError, requireSetlistsUser} from '../../route-utils'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    bandId: string
    songId: string
  }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireSetlistsUser()
  if (auth.response || !auth.user) {
    return auth.response
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return Response.json({message: 'Request body is required.'}, {status: 400})
  }

  const {bandId, songId} = await context.params

  try {
    const payload = await updateBandSongLibraryItem(
      auth.user.id,
      bandId,
      songId,
      body,
      resolveRequestContext(request.headers)
    )
    return Response.json(payload)
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

  const {bandId, songId} = await context.params

  try {
    const payload = await deleteBandSongLibraryItem(
      auth.user.id,
      bandId,
      songId,
      resolveRequestContext(request.headers)
    )
    return Response.json(payload)
  } catch (error) {
    if (error instanceof BandServiceError) {
      return mapSetlistsServiceError(error)
    }

    throw error
  }
}
