import {redirect} from 'next/navigation'

import {isSupabaseConfigured} from '@/lib/env'
import {createClient} from '@/lib/supabase/server'

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return null
  }

  const supabase = await createClient()
  const {
    data: {user},
  } = await supabase.auth.getUser()

  return user
}

export async function requireUser() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return user
}
