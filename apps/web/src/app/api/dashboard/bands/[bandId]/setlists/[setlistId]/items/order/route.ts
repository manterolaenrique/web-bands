import {NextRequest} from 'next/server'

import {resolveRequestContext} from '@/lib/server/request-context'
import {reorderBandSetlistItems} from '@/server/bands/setlists'
import {BandServiceError} from '@/server/bands/service-error'

import {mapSetlistsServiceError, requireSetlistsUser} from '../../../route-utils'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    bandId: string
    setlistId: string
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

  const {bandId, setlistId} = await context.params

  try {
    const payload = await reorderBandSetlistItems(
      auth.user.id,
      bandId,
      setlistId,
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
