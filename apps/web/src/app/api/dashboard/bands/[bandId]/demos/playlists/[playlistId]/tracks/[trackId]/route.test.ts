import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {BandServiceError} from '@/server/bands/service-error'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockRemoveTrackFromPlaylist = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/server/request-context', () => ({
  resolveRequestContext: vi.fn(() => ({
    ip: '127.0.0.1',
    requestId: 'req-playlist-track-delete-1',
    userAgent: 'Vitest',
  })),
}))

vi.mock('@/server/demos/playlists', () => ({
  removeTrackFromPlaylist: mockRemoveTrackFromPlaylist,
}))

let DELETE: typeof import('./route').DELETE

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
  ;({DELETE} = await import('./route'))
})

beforeEach(() => {
  vi.clearAllMocks()
  mockIsSupabaseConfigured.mockReturnValue(true)
})

describe('DELETE /api/dashboard/bands/[bandId]/demos/playlists/[playlistId]/tracks/[trackId]', () => {
  it('maps locked playlist errors into JSON responses', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockRemoveTrackFromPlaylist.mockRejectedValue(
      new BandServiceError('La playlist General se administra automaticamente.', 403)
    )

    const response = await DELETE(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/demos/playlists/playlist-general/tracks/track-1', {
        method: 'DELETE',
      }),
      {
        params: Promise.resolve({bandId: 'band-1', playlistId: 'playlist-general', trackId: 'track-1'}),
      }
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      message: 'La playlist General se administra automaticamente.',
    })
  })
})
