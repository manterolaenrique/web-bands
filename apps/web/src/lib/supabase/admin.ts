import {createClient as createSupabaseClient} from '@supabase/supabase-js'

import {supabaseEnv} from '@/lib/env'

export function createAdminClient() {
  if (!supabaseEnv.url || !supabaseEnv.secretKey) {
    throw new Error('Missing Supabase admin config. Set SUPABASE_SECRET_KEY server-side only.')
  }

  return createSupabaseClient(supabaseEnv.url, supabaseEnv.secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
