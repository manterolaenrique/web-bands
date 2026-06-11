import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {BandServiceError} from '@/server/bands/service-error'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockGetBandTrackAccess = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/server/demos/tracks', () => ({
  getBandTrackAccess: mockGetBandTrackAccess,
}))

let POST: typeof import('./route').POST

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
  ;({POST} = await import('./route'))
})

beforeEach(() => {
  vi.clearAllMocks()
  mockIsSupabaseConfigured.mockReturnValue(true)
})

describe('POST /api/dashboard/bands/[bandId]/demos/[trackId]/access', () => {
  it('returns 401 without an authenticated session', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock(null))

    const response = await POST(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/demos/track-1/access', {
        method: 'POST',
        body: JSON.stringify({mode: 'stream'}),
        headers: {'Content-Type': 'application/json'},
      }),
      {
        params: Promise.resolve({bandId: 'band-1', trackId: 'track-1'}),
      }
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      message: 'Authentication required.',
    })
  })

  it('returns 400 for invalid payloads', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())

    const response = await POST(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/demos/track-1/access', {
        method: 'POST',
        body: JSON.stringify({mode: 'invalid'}),
        headers: {'Content-Type': 'application/json'},
      }),
      {
        params: Promise.resolve({bandId: 'band-1', trackId: 'track-1'}),
      }
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      message: 'Invalid access payload.',
    })
  })

  it('delegates to the track access service', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockGetBandTrackAccess.mockResolvedValue({
      ok: true,
      access: {
        url: 'https://signed-url.test/audio.mp3',
        expiresInSeconds: 600,
        fileName: 'demo.mp3',
        mode: 'stream',
      },
    })

    const response = await POST(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/demos/track-1/access', {
        method: 'POST',
        body: JSON.stringify({mode: 'stream'}),
        headers: {'Content-Type': 'application/json'},
      }),
      {
        params: Promise.resolve({bandId: 'band-1', trackId: 'track-1'}),
      }
    )

    expect(mockGetBandTrackAccess).toHaveBeenCalledWith('user-1', 'band-1', 'track-1', {
      mode: 'stream',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      access: {
        url: 'https://signed-url.test/audio.mp3',
        expiresInSeconds: 600,
        fileName: 'demo.mp3',
        mode: 'stream',
      },
    })
  })

  it('maps service errors into JSON responses', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockGetBandTrackAccess.mockRejectedValue(
      new BandServiceError('This demo is not downloadable for your role.', 403)
    )

    const response = await POST(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/demos/track-1/access', {
        method: 'POST',
        body: JSON.stringify({mode: 'download'}),
        headers: {'Content-Type': 'application/json'},
      }),
      {
        params: Promise.resolve({bandId: 'band-1', trackId: 'track-1'}),
      }
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      message: 'This demo is not downloadable for your role.',
    })
  })
})
