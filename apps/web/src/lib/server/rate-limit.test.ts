import {beforeEach, describe, expect, it, vi} from 'vitest'

const {mockCreateAdminClient, mockIsSupabaseAdminConfigured, mockLogServerError} = vi.hoisted(() => ({
  mockCreateAdminClient: vi.fn(),
  mockIsSupabaseAdminConfigured: vi.fn(),
  mockLogServerError: vi.fn(),
}))

vi.mock('@/lib/env', () => ({
  isSupabaseAdminConfigured: mockIsSupabaseAdminConfigured,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mockCreateAdminClient,
}))

vi.mock('@/lib/server/log', () => ({
  logServerError: mockLogServerError,
}))

import {consumeRateLimit, RATE_LIMIT_POLICIES} from './rate-limit'

describe('rate limit helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsSupabaseAdminConfigured.mockReturnValue(true)
  })

  it('maps the rpc result to a normalized rate limit response', async () => {
    mockCreateAdminClient.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            allowed: false,
            remaining: 0,
            reset_at: '2099-01-01T00:05:00.000Z',
            retry_after_seconds: 300,
          },
        ],
        error: null,
      }),
    })

    const result = await consumeRateLimit(RATE_LIMIT_POLICIES.login, ['127.0.0.1', 'demo@example.com'])

    expect(result).toMatchObject({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 300,
      resetAt: '2099-01-01T00:05:00.000Z',
    })
    expect(result.keyHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('fails open and logs when the rpc call fails', async () => {
    mockCreateAdminClient.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('rpc failed'),
      }),
    })

    const result = await consumeRateLimit(RATE_LIMIT_POLICIES.login, ['127.0.0.1', 'demo@example.com'])

    expect(result.allowed).toBe(true)
    expect(mockLogServerError).toHaveBeenCalledWith(
      'rate_limit.consume_failed',
      expect.any(Error),
      expect.objectContaining({
        bucket: 'auth.login',
      })
    )
  })
})
