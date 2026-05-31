import {beforeEach, describe, expect, it, vi} from 'vitest'

const {
  mockRedirect,
  mockIsSupabaseConfigured,
  mockCreateClient,
  mockGetServerActionRequestContext,
  mockConsumeRateLimit,
  mockWriteAuditLog,
} = vi.hoisted(() => ({
  mockRedirect: vi.fn((location: string) => {
    throw new Error(`NEXT_REDIRECT:${location}`)
  }),
  mockIsSupabaseConfigured: vi.fn(),
  mockCreateClient: vi.fn(),
  mockGetServerActionRequestContext: vi.fn(),
  mockConsumeRateLimit: vi.fn(),
  mockWriteAuditLog: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
  siteUrl: 'https://web-bands-v2.vercel.app',
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/server/request-context', () => ({
  getServerActionRequestContext: mockGetServerActionRequestContext,
}))

vi.mock('@/lib/server/rate-limit', () => ({
  RATE_LIMIT_POLICIES: {
    login: {
      bucket: 'auth.login',
      maxAttempts: 5,
      windowSeconds: 300,
    },
  },
  consumeRateLimit: mockConsumeRateLimit,
}))

vi.mock('@/lib/server/audit', () => ({
  writeAuditLog: mockWriteAuditLog,
}))

import {signIn, signUp} from './actions'
import {signInWithGoogle} from './actions'

function createFormData(values: Record<string, string>) {
  const formData = new FormData()

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value)
  }

  return formData
}

describe('login actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsSupabaseConfigured.mockReturnValue(true)
    mockGetServerActionRequestContext.mockResolvedValue({
      ip: '127.0.0.1',
      requestId: 'req-1',
      userAgent: 'Vitest',
    })
    mockConsumeRateLimit.mockResolvedValue({
      allowed: true,
      keyHash: 'rate-limit-key',
      remaining: 4,
      resetAt: null,
      retryAfterSeconds: 0,
    })
    mockWriteAuditLog.mockResolvedValue(true)
  })

  it('redirects to a safe internal path after sign in', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-1',
            },
          },
          error: null,
        }),
      },
    })

    await expect(
      signIn(
        createFormData({
          email: 'demo@example.com',
          password: 'password123',
          returnTo: '/invite/demo-token',
        })
      )
    ).rejects.toThrow('NEXT_REDIRECT:/invite/demo-token')
  })

  it('falls back to /dashboard when returnTo is external', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-1',
            },
          },
          error: null,
        }),
      },
    })

    await expect(
      signIn(
        createFormData({
          email: 'demo@example.com',
          password: 'password123',
          returnTo: 'https://evil.example',
        })
      )
    ).rejects.toThrow('NEXT_REDIRECT:/dashboard')
  })

  it('redirects with a readable message when the login rate limit is exceeded', async () => {
    mockConsumeRateLimit.mockResolvedValue({
      allowed: false,
      keyHash: 'blocked-key',
      remaining: 0,
      resetAt: '2099-01-01T00:05:00.000Z',
      retryAfterSeconds: 300,
    })

    await expect(
      signIn(
        createFormData({
          email: 'demo@example.com',
          password: 'password123',
        })
      )
    ).rejects.toThrow('NEXT_REDIRECT:/login?message=login-rate-limited')
  })

  it('starts the Google OAuth flow and preserves the safe return path', async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({
      data: {
        url: 'https://dpdavyanumzzrymxdxhy.supabase.co/auth/v1/authorize?provider=google',
      },
      error: null,
    })

    mockCreateClient.mockResolvedValue({
      auth: {
        signInWithOAuth,
      },
    })

    await expect(
      signInWithGoogle(
        createFormData({
          returnTo: '/invite/demo-token',
        })
      )
    ).rejects.toThrow(
      'NEXT_REDIRECT:https://dpdavyanumzzrymxdxhy.supabase.co/auth/v1/authorize?provider=google'
    )

    expect(signInWithOAuth).toHaveBeenCalledWith({
      options: {
        redirectTo: 'https://web-bands-v2.vercel.app/auth/callback?next=%2Finvite%2Fdemo-token',
      },
      provider: 'google',
    })
  })

  it('falls back to a readable auth message when Google OAuth is unavailable', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        signInWithOAuth: vi.fn().mockResolvedValue({
          data: {
            url: null,
          },
          error: {
            message: 'Provider is not enabled',
          },
        }),
      },
    })

    await expect(
      signInWithGoogle(
        createFormData({
          returnTo: '/invite/demo-token',
        })
      )
    ).rejects.toThrow(
      'NEXT_REDIRECT:/login?message=google-auth-unavailable&next=%2Finvite%2Fdemo-token'
    )
  })

  it('preserves the invite return path through sign up confirmation', async () => {
    const signUpWithPassword = vi.fn().mockResolvedValue({error: null})
    mockCreateClient.mockResolvedValue({
      auth: {
        signUp: signUpWithPassword,
      },
    })

    await expect(
      signUp(
        createFormData({
          email: 'demo@example.com',
          password: 'password123',
          returnTo: '/invite/demo-token',
        })
      )
    ).rejects.toThrow('NEXT_REDIRECT:/login?message=signup-confirm-email&next=%2Finvite%2Fdemo-token')

    expect(signUpWithPassword).toHaveBeenCalledWith({
      email: 'demo@example.com',
      password: 'password123',
      options: {
        emailRedirectTo: 'https://web-bands-v2.vercel.app/auth/callback?next=%2Finvite%2Fdemo-token',
      },
    })
  })
})
