import {NextResponse} from 'next/server'

import {isSupabaseConfigured} from '@/lib/env'
import {createClient} from '@/lib/supabase/server'
import {createBandForUser} from '@/server/bands/create-band'
import {getDashboardBands} from '@/server/bands/dashboard'
import {BandServiceError} from '@/server/bands/service-error'

export async function GET() {
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

  const data = await getDashboardBands(user.id, user.email)
  return NextResponse.json(data)
}

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => null)) as {name?: string} | null

  try {
    const result = await createBandForUser(user.id, String(body?.name || ''))

    return NextResponse.json(
      {
        ok: true,
        band: result.band,
        editorHref: `/dashboard/bands/${result.band.id}`,
      },
      {status: 201}
    )
  } catch (error) {
    if (error instanceof BandServiceError) {
      const details =
        typeof error.details === 'object' && error.details
          ? {...(error.details as Record<string, unknown>)}
          : {}

      return NextResponse.json(
        {
          message: error.message,
          ...details,
        },
        {status: error.status}
      )
    }

    throw error
  }
}
