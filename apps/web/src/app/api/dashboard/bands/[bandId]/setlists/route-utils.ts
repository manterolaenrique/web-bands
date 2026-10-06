import {NextResponse} from 'next/server'

import {isSupabaseConfigured} from '@/lib/env'
import {createClient} from '@/lib/supabase/server'
import {BandServiceError} from '@/server/bands/service-error'

export function mapSetlistsServiceError(error: BandServiceError) {
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

export async function requireSetlistsUser() {
  if (!isSupabaseConfigured()) {
    return {
      response: NextResponse.json({message: 'Supabase is not configured.'}, {status: 503}),
      user: null,
    }
  }

  const supabase = await createClient()
  const {
    data: {user},
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      response: NextResponse.json({message: 'Authentication required.'}, {status: 401}),
      user: null,
    }
  }

  return {response: null, user}
}
