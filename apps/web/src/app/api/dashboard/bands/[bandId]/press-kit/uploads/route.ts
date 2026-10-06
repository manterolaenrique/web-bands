import {NextResponse, type NextRequest} from 'next/server'

import {isSupabaseConfigured} from '@/lib/env'
import {createClient} from '@/lib/supabase/server'
import {createBandPrivateAssetUpload} from '@/server/bands/press-kit'
import {BandServiceError} from '@/server/bands/service-error'

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

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({message: 'Supabase is not configured.'}, {status: 503})
  }

  const user = await requireAuthenticatedUser()
  if (!user) {
    return NextResponse.json({message: 'Authentication required.'}, {status: 401})
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({message: 'Request body is required.'}, {status: 400})
  }

  const {bandId} = await context.params

  try {
    const payload = await createBandPrivateAssetUpload(user.id, bandId, body)
    return NextResponse.json(payload, {status: 201})
  } catch (error) {
    if (error instanceof BandServiceError) {
      return mapServiceError(error)
    }

    throw error
  }
}
