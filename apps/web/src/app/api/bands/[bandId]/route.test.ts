import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {BandServiceError} from '@/server/bands/service-error'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockUpdateBand = vi.fn()

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

vi.mock('@/server/bands/update-band', () => ({
  updateBand: mockUpdateBand,
}))

let PATCH: typeof import('./route').PATCH

function createRequest(body: unknown) {
  return new NextRequest('http://localhost/api/bands/band-1', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

function createSupabaseMock(user: {id: string} | null = {id: 'user-1'}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user,
        },
      }),
    },
  }
}

beforeAll(async () => {
  ;({PATCH} = await import('./route'))
})

beforeEach(() => {
  vi.clearAllMocks()
  mockIsSupabaseConfigured.mockReturnValue(true)
})

describe('PATCH /api/bands/[bandId]', () => {
  it('returns 401 when there is no authenticated session', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock(null))

    const response = await PATCH(createRequest({name: 'Demo'}), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      message: 'Authentication required.',
    })
  })

  it('delegates to updateBand and returns the payload', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockUpdateBand.mockResolvedValue({
      ok: true,
      band: {
        id: 'band-1',
        slug: 'demo-band',
        sanityDocumentId: 'banda-band-1',
      },
    })

    const response = await PATCH(createRequest({name: 'Demo'}), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(mockUpdateBand).toHaveBeenCalledWith(
      'user-1',
      'band-1',
      {name: 'Demo'},
      expect.objectContaining({requestId: 'req-1'})
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      band: {
        id: 'band-1',
        slug: 'demo-band',
        sanityDocumentId: 'banda-band-1',
      },
    })
  })

  it('maps service errors into JSON responses', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockUpdateBand.mockRejectedValue(
      new BandServiceError('Too many band updates right now. Try again in a few minutes.', 429, {
        retryAfterSeconds: 300,
        headers: {'Retry-After': '300'},
      })
    )

    const response = await PATCH(createRequest({name: 'Demo'}), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('300')
    await expect(response.json()).resolves.toEqual({
      message: 'Too many band updates right now. Try again in a few minutes.',
      retryAfterSeconds: 300,
    })
  })
})
