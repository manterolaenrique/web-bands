import {NextRequest, NextResponse} from 'next/server'

import {getBandSetlistPrintPayload} from '@/server/bands/setlists'
import {BandServiceError} from '@/server/bands/service-error'

import {mapSetlistsServiceError, requireSetlistsUser} from '../../route-utils'

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
    const payload = await getBandSetlistPrintPayload(auth.user.id, bandId, setlistId)
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
