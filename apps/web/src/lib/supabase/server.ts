import {createServerClient} from '@supabase/ssr'
import {cookies} from 'next/headers'

import {assertSupabasePublicConfig} from '@/lib/env'

export async function createClient() {
  const {url, publishableKey} = assertSupabasePublicConfig()
  const cookieStore = await cookies()

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({name, value, options}) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot set cookies. Route Handlers, Server Actions
          // and the proxy can, so this is expected in read-only render paths.
        }
      },
    },
  })
}
