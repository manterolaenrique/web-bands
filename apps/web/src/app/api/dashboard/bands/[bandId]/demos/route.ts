import {NextResponse, type NextRequest} from 'next/server'

import {isSupabaseConfigured} from '@/lib/env'
import {resolveRequestContext} from '@/lib/server/request-context'
import {createClient} from '@/lib/supabase/server'
import {BandServiceError} from '@/server/bands/service-error'
import {getBandDemosHome} from '@/server/demos/home'
import {uploadBandTrack} from '@/server/demos/tracks'

export const runtime = 'nodejs'

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

async function requireAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: {user},
  } = await supabase.auth.getUser()

  return user
}

export async function GET(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({message: 'Supabase is not configured.'}, {status: 503})
  }

  const user = await requireAuthenticatedUser()
  if (!user) {
    return NextResponse.json({message: 'Authentication required.'}, {status: 401})
  }

  const {bandId} = await context.params
  const query = request.nextUrl.searchParams.get('q')

  try {
    const payload = await getBandDemosHome(user.id, bandId, query)
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

  const user = await requireAuthenticatedUser()
  if (!user) {
    return NextResponse.json({message: 'Authentication required.'}, {status: 401})
  }

  const {bandId} = await context.params
  const requestContext = resolveRequestContext(request.headers)
  const formData = await request.formData().catch(() => null)

  if (!formData) {
    return NextResponse.json({message: 'Form data is required.'}, {status: 400})
  }

  try {
    const payload = await uploadBandTrack(user.id, bandId, formData, requestContext)
    return NextResponse.json(payload, {status: 201})
  } catch (error) {
    if (error instanceof BandServiceError) {
      return mapServiceError(error)
    }

    throw error
  }
}
