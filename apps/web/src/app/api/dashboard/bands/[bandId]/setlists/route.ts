import {NextRequest, NextResponse} from 'next/server'

import {resolveRequestContext} from '@/lib/server/request-context'
import {createBandSetlist, getBandSetlistsHubPayload} from '@/server/bands/setlists'
import {BandServiceError} from '@/server/bands/service-error'

import {mapSetlistsServiceError, requireSetlistsUser} from './route-utils'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    bandId: string
  }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireSetlistsUser()
  if (auth.response || !auth.user) {
    return auth.response
  }

  const {bandId} = await context.params

  try {
    const payload = await getBandSetlistsHubPayload(auth.user.id, bandId)
    if (!payload) {
      return NextResponse.json({message: 'Band not found.'}, {status: 404})
    }

    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof BandServiceError) {
      return mapSetlistsServiceError(error)
    }

    throw error
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireSetlistsUser()
  if (auth.response || !auth.user) {
    return auth.response
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({message: 'Request body is required.'}, {status: 400})
  }

  const {bandId} = await context.params

  try {
    const payload = await createBandSetlist(auth.user.id, bandId, body, resolveRequestContext(request.headers))
    return NextResponse.json(payload, {status: 201})
  } catch (error) {
    if (error instanceof BandServiceError) {
      return mapSetlistsServiceError(error)
    }

    throw error
  }
}
