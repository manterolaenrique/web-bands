import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockWriteAuditLog = vi.fn()
const mockLogServerError = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/server/request-context', () => ({
  resolveRequestContext: vi.fn(() => ({
    ip: '127.0.0.1',
    requestId: 'req-1',
    userAgent: 'Vitest',
  })),
}))

vi.mock('@/lib/server/audit', () => ({
  writeAuditLog: mockWriteAuditLog,
}))

vi.mock('@/lib/server/log', () => ({
  logServerError: mockLogServerError,
}))

let GET: typeof import('./route').GET

beforeAll(async () => {
  ;({GET} = await import('./route'))
})

beforeEach(() => {
  vi.clearAllMocks()
  mockIsSupabaseConfigured.mockReturnValue(true)
  mockWriteAuditLog.mockResolvedValue(true)
})

describe('GET /auth/callback', () => {
  it('exchanges the code and redirects to a safe internal return path', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({error: null}),
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-1',
            },
          },
        }),
      },
    })

    const response = await GET(
      new NextRequest('http://localhost:3000/auth/callback?code=demo-code&next=/invite/demo-token')
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/invite/demo-token')
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.login.succeeded',
        actorUserId: 'user-1',
      })
    )
  })

  it('redirects to login with a readable message when Google access is cancelled', async () => {
    const response = await GET(
      new NextRequest(
        'http://localhost:3000/auth/callback?error=access_denied&next=/invite/demo-token'
      )
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/login?message=google-auth-cancelled&next=%2Finvite%2Fdemo-token'
    )
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.login.failed',
        targetId: 'google',
        targetType: 'oauth_provider',
      })
    )
  })

  it('falls back to login when the OAuth exchange fails', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          error: {
            message: 'OAuth exchange failed',
          },
        }),
      },
    })

    const response = await GET(
      new NextRequest('http://localhost:3000/auth/callback?code=demo-code&next=/dashboard')
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/login?message=google-auth-failed'
    )
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.login.failed',
        targetId: 'google',
      })
    )
  })
})
