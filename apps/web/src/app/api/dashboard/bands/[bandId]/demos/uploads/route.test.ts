import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {BandServiceError} from '@/server/bands/service-error'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockCreateBandTrackUpload = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/server/demos/tracks', () => ({
  createBandTrackUpload: mockCreateBandTrackUpload,
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

describe('POST /api/dashboard/bands/[bandId]/demos/uploads', () => {
  it('creates a signed upload target for authenticated users', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockCreateBandTrackUpload.mockResolvedValue({
      ok: true,
      upload: {
        trackId: 'track-1',
        storagePath: 'band-1/track-1/demo.wav',
        token: 'signed-token-1',
      },
    })

    const response = await POST(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/demos/uploads', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          fileName: 'demo.wav',
          mimeType: 'audio/wav',
          fileSizeBytes: 1024,
        }),
      }),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )

    expect(mockCreateBandTrackUpload).toHaveBeenCalledWith(
      'user-1',
      'band-1',
      expect.objectContaining({fileName: 'demo.wav'})
    )
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      upload: {
        trackId: 'track-1',
        storagePath: 'band-1/track-1/demo.wav',
        token: 'signed-token-1',
      },
    })
  })

  it('maps service errors into JSON responses', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockCreateBandTrackUpload.mockRejectedValue(
      new BandServiceError('Only MP3, WAV, M4A and OGG files are allowed.', 400)
    )

    const response = await POST(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/demos/uploads', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          fileName: 'demo.txt',
          mimeType: 'text/plain',
          fileSizeBytes: 50,
        }),
      }),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      message: 'Only MP3, WAV, M4A and OGG files are allowed.',
    })
  })
})
