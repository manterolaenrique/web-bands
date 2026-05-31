'use client'

import {createBrowserClient} from '@supabase/ssr'

import {assertSupabasePublicConfig} from '@/lib/env'

export function createClient() {
  const {url, publishableKey} = assertSupabasePublicConfig()

  return createBrowserClient(url, publishableKey)
}
