const DEFAULT_SANITY_PROJECT_ID = 'vyjsvcoh'
const DEFAULT_SANITY_DATASET = 'production'
const DEFAULT_SANITY_API_VERSION = '2026-03-01'

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const sanityEnv = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || DEFAULT_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || DEFAULT_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || DEFAULT_SANITY_API_VERSION,
}

export const supabaseEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  secretKey: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
}

export function isSupabaseConfigured() {
  return Boolean(supabaseEnv.url && supabaseEnv.publishableKey)
}

export function isSupabaseAdminConfigured() {
  return Boolean(supabaseEnv.url && supabaseEnv.secretKey)
}

export function assertSupabasePublicConfig() {
  if (!supabaseEnv.url || !supabaseEnv.publishableKey) {
    throw new Error(
      'Missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    )
  }

  return {
    url: supabaseEnv.url,
    publishableKey: supabaseEnv.publishableKey,
  }
}

export function getSanityWriteToken() {
  return process.env.SANITY_API_WRITE_TOKEN
}
