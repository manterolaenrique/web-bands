import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {BandServiceError} from '@/server/bands/service-error'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockGetBandPlaylist = vi.fn()
const mockUpdateBandPlaylist = vi.fn()
const mockDeleteBandPlaylist = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/server/request-context', () => ({
  resolveRequestContext: vi.fn(() => ({
    ip: '127.0.0.1',
    requestId: 'req-playlist-detail-1',
    userAgent: 'Vitest',
  })),
}))

vi.mock('@/server/demos/playlists', () => ({
  getBandPlaylist: mockGetBandPlaylist,
  updateBandPlaylist: mockUpdateBandPlaylist,
  deleteBandPlaylist: mockDeleteBandPlaylist,
}))

let GET: typeof import('./route').GET
let PATCH: typeof import('./route').PATCH
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
  ;({GET, PATCH, DELETE} = await import('./route'))
})

beforeEach(() => {
  vi.clearAllMocks()
  mockIsSupabaseConfigured.mockReturnValue(true)
})

describe('GET /api/dashboard/bands/[bandId]/demos/playlists/[playlistId]', () => {
  it('returns the playlist detail payload', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockGetBandPlaylist.mockResolvedValue({
      id: 'playlist-general',
      title: 'General',
      tracks: [],
      isLocked: true,
    })

    const response = await GET(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/demos/playlists/playlist-general'),
      {
        params: Promise.resolve({bandId: 'band-1', playlistId: 'playlist-general'}),
      }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      id: 'playlist-general',
      title: 'General',
      tracks: [],
      isLocked: true,
    })
  })
})

describe('locked playlist mutations', () => {
  it('maps PATCH service errors into JSON responses', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockUpdateBandPlaylist.mockRejectedValue(
      new BandServiceError('La playlist General se administra automaticamente.', 403)
    )

    const response = await PATCH(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/demos/playlists/playlist-general', {
        method: 'PATCH',
        body: JSON.stringify({title: 'General'}),
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

  it('maps DELETE service errors into JSON responses', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockDeleteBandPlaylist.mockRejectedValue(
      new BandServiceError('La playlist General se administra automaticamente.', 403)
    )

    const response = await DELETE(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/demos/playlists/playlist-general', {
        method: 'DELETE',
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
