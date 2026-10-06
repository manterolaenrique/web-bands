import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockGetBandSetlistsHubPayload = vi.fn()
const mockCreateBandSongLibraryItem = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/server/bands/setlists', () => ({
  getBandSetlistsHubPayload: mockGetBandSetlistsHubPayload,
  createBandSongLibraryItem: mockCreateBandSongLibraryItem,
}))

let GET: typeof import('./route').GET
let POST: typeof import('./route').POST

function createSupabaseMock(user: {id: string} | null = {id: 'user-1'}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {user},
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

describe('GET /api/dashboard/bands/[bandId]/setlists/library', () => {
  it('returns the song library subset from the hub payload', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockGetBandSetlistsHubPayload.mockResolvedValue({
      songs: [{id: 'song-1', title: 'Intro oscura'}],
    })

    const response = await GET(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/setlists/library'),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      songs: [{id: 'song-1', title: 'Intro oscura'}],
    })
  })
})

describe('POST /api/dashboard/bands/[bandId]/setlists/library', () => {
  it('creates a library song through the service layer', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockCreateBandSongLibraryItem.mockResolvedValue({
      ok: true,
      song: {id: 'song-1', title: 'Nuevo tema'},
    })

    const response = await POST(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/setlists/library', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          title: 'Nuevo tema',
        }),
      }),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )

    expect(mockCreateBandSongLibraryItem).toHaveBeenCalledWith(
      'user-1',
      'band-1',
      expect.objectContaining({title: 'Nuevo tema'}),
      expect.objectContaining({ip: null})
    )
    expect(response.status).toBe(201)
  })
})
