import {isSupabaseAdminConfigured} from '@/lib/env'
import {createAdminClient} from '@/lib/supabase/admin'
import {hashIdentityParts} from '@/lib/server/identity'
import {logServerError} from '@/lib/server/log'

export type RateLimitPolicy = {
  bucket: string
  maxAttempts: number
  windowSeconds: number
}

export type RateLimitResult = {
  allowed: boolean
  keyHash: string
  remaining: number
  resetAt: string | null
  retryAfterSeconds: number
}

type ConsumeRateLimitRow = {
  allowed: boolean
  remaining: number
  reset_at: string | null
  retry_after_seconds: number
}

export const RATE_LIMIT_POLICIES = {
  login: {
    bucket: 'auth.login',
    maxAttempts: 5,
    windowSeconds: 300,
  },
  bandWrite: {
    bucket: 'bands.update',
    maxAttempts: 20,
    windowSeconds: 300,
  },
  assetUpload: {
    bucket: 'bands.asset_upload',
    maxAttempts: 10,
    windowSeconds: 300,
  },
  demosUpload: {
    bucket: 'bands.demos_upload',
    maxAttempts: 12,
    windowSeconds: 300,
  },
  demosWrite: {
    bucket: 'bands.demos_write',
    maxAttempts: 30,
    windowSeconds: 300,
  },
  teamActions: {
    bucket: 'bands.team_actions',
    maxAttempts: 20,
    windowSeconds: 300,
  },
} satisfies Record<string, RateLimitPolicy>

function buildAllowedResult(keyHash: string, policy: RateLimitPolicy): RateLimitResult {
  return {
    allowed: true,
    keyHash,
    remaining: policy.maxAttempts,
    resetAt: null,
    retryAfterSeconds: 0,
  }
}

export function getRateLimitHeaders(result: Pick<RateLimitResult, 'retryAfterSeconds'>) {
  return {
    'Retry-After': String(Math.max(result.retryAfterSeconds, 1)),
  }
}

export async function consumeRateLimit(policy: RateLimitPolicy, keyParts: Array<string | null | undefined>) {
  const keyHash = hashIdentityParts([policy.bucket, ...keyParts])

  if (!isSupabaseAdminConfigured()) {
    return buildAllowedResult(keyHash, policy)
  }

  try {
    const admin = createAdminClient()
    const {data, error} = await admin.rpc('consume_rate_limit', {
      rate_bucket: policy.bucket,
      rate_key_hash: keyHash,
      max_attempts: policy.maxAttempts,
      window_seconds: policy.windowSeconds,
    })

    if (error) {
      throw error
    }

    const row = (Array.isArray(data) ? data[0] : data) as ConsumeRateLimitRow | null

    if (!row) {
      return buildAllowedResult(keyHash, policy)
    }

    return {
      allowed: row.allowed,
      keyHash,
      remaining: row.remaining,
      resetAt: row.reset_at,
      retryAfterSeconds: row.retry_after_seconds,
    } satisfies RateLimitResult
  } catch (error) {
    logServerError('rate_limit.consume_failed', error, {
      bucket: policy.bucket,
      keyHash,
    })

    return buildAllowedResult(keyHash, policy)
  }
}
