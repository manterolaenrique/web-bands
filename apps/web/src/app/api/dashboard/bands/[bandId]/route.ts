import {NextResponse} from 'next/server'

import {isSupabaseConfigured} from '@/lib/env'
import {createClient} from '@/lib/supabase/server'
import {getBandEditorPayload} from '@/server/bands/editor-payload'

type RouteContext = {
  params: Promise<{
    bandId: string
  }>
}

export async function GET(_request: Request, context: RouteContext) {
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

  const {bandId} = await context.params
  const payload = await getBandEditorPayload(user.id, bandId)

  if (!payload) {
    return NextResponse.json({message: 'Band not found.'}, {status: 404})
  }

  return NextResponse.json(payload)
}
