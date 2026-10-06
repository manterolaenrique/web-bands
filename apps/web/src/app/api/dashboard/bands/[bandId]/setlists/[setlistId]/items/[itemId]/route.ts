import {NextRequest} from 'next/server'

import {resolveRequestContext} from '@/lib/server/request-context'
import {deleteBandSetlistItem, updateBandSetlistItem} from '@/server/bands/setlists'
import {BandServiceError} from '@/server/bands/service-error'

import {mapSetlistsServiceError, requireSetlistsUser} from '../../../route-utils'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    bandId: string
    setlistId: string
    itemId: string
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

  const {bandId, setlistId, itemId} = await context.params

  try {
    const payload = await updateBandSetlistItem(
      auth.user.id,
      bandId,
      setlistId,
      itemId,
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

  const {bandId, setlistId, itemId} = await context.params

  try {
    const payload = await deleteBandSetlistItem(
      auth.user.id,
      bandId,
      setlistId,
      itemId,
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
