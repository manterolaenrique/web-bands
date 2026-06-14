import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {BandServiceError} from '@/server/bands/service-error'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockGetBandPlaylists = vi.fn()
const mockCreateBandPlaylist = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/server/request-context', () => ({
  resolveRequestContext: vi.fn(() => ({
    ip: '127.0.0.1',
    requestId: 'req-playlist-1',
    userAgent: 'Vitest',
  })),
}))

vi.mock('@/server/demos/playlists', () => ({
  getBandPlaylists: mockGetBandPlaylists,
  createBandPlaylist: mockCreateBandPlaylist,
}))

let GET: typeof import('./route').GET
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
  ;({GET, POST} = await import('./route'))
})

beforeEach(() => {
  vi.clearAllMocks()
  mockIsSupabaseConfigured.mockReturnValue(true)
})

describe('GET /api/dashboard/bands/[bandId]/demos/playlists', () => {
  it('returns 401 without an authenticated session', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock(null))

    const response = await GET(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/demos/playlists'),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      message: 'Authentication required.',
    })
  })

  it('returns playlist payload when access is valid', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockGetBandPlaylists.mockResolvedValue({
      band: {id: 'band-1', name: 'Demo Band', slug: 'demo-band', status: 'draft'},
      role: 'owner',
      canEdit: true,
      query: '',
      playlists: [
        {
          id: 'playlist-general',
          title: 'General',
          systemKey: 'general',
          isLocked: true,
        },
      ],
    })

    const response = await GET(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/demos/playlists'),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )

    expect(mockGetBandPlaylists).toHaveBeenCalledWith('user-1', 'band-1', null)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      band: {id: 'band-1', name: 'Demo Band', slug: 'demo-band', status: 'draft'},
      role: 'owner',
      canEdit: true,
      query: '',
      playlists: [
        {
          id: 'playlist-general',
          title: 'General',
          systemKey: 'general',
          isLocked: true,
        },
      ],
    })
  })
})

describe('POST /api/dashboard/bands/[bandId]/demos/playlists', () => {
  it('delegates playlist creation to the service', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockCreateBandPlaylist.mockResolvedValue({
      ok: true,
      playlist: {
        id: 'playlist-1',
        title: 'Ensayo jueves',
      },
    })

    const response = await POST(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/demos/playlists', {
        method: 'POST',
        body: JSON.stringify({title: 'Ensayo jueves', description: 'Set interno'}),
        headers: {'Content-Type': 'application/json'},
      }),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )

    expect(mockCreateBandPlaylist).toHaveBeenCalledWith(
      'user-1',
      'band-1',
      {title: 'Ensayo jueves', description: 'Set interno'},
      expect.objectContaining({requestId: 'req-playlist-1'})
    )
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      playlist: {
        id: 'playlist-1',
        title: 'Ensayo jueves',
      },
    })
  })

  it('maps service errors into JSON responses', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockCreateBandPlaylist.mockRejectedValue(
      new BandServiceError('Invalid playlist metadata.', 400, {
        errors: [{path: 'title', message: 'Too short'}],
      })
    )

    const response = await POST(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/demos/playlists', {
        method: 'POST',
        body: JSON.stringify({title: ''}),
        headers: {'Content-Type': 'application/json'},
      }),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      message: 'Invalid playlist metadata.',
      errors: [{path: 'title', message: 'Too short'}],
    })
  })
})
