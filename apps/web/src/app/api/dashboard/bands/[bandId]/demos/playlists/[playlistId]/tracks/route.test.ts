import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {BandServiceError} from '@/server/bands/service-error'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockAddTrackToPlaylist = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/server/request-context', () => ({
  resolveRequestContext: vi.fn(() => ({
    ip: '127.0.0.1',
    requestId: 'req-playlist-track-1',
    userAgent: 'Vitest',
  })),
}))

vi.mock('@/server/demos/playlists', () => ({
  addTrackToPlaylist: mockAddTrackToPlaylist,
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

describe('POST /api/dashboard/bands/[bandId]/demos/playlists/[playlistId]/tracks', () => {
  it('maps locked playlist errors into JSON responses', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockAddTrackToPlaylist.mockRejectedValue(
      new BandServiceError('La playlist General se administra automaticamente.', 403)
    )

    const response = await POST(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/demos/playlists/playlist-general/tracks', {
        method: 'POST',
        body: JSON.stringify({trackId: 'track-1'}),
        headers: {'Content-Type': 'application/json'},
      }),
      {
        params: Promise.resolve({bandId: 'band-1', playlistId: 'playlist-general'}),
      }
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      message: 'La playlist General se administra automaticamente.',
    })
  })
})
