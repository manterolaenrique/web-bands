import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockGetBandSetlistsHubPayload = vi.fn()
const mockCreateBandSetlist = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/server/bands/setlists', () => ({
  getBandSetlistsHubPayload: mockGetBandSetlistsHubPayload,
  createBandSetlist: mockCreateBandSetlist,
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

describe('GET /api/dashboard/bands/[bandId]/setlists', () => {
  it('returns 404 when the setlists payload is not available', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockGetBandSetlistsHubPayload.mockResolvedValue(null)

    const response = await GET(new NextRequest('http://localhost/api/dashboard/bands/band-1/setlists'), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      message: 'Band not found.',
    })
  })

  it('returns the setlists hub payload for editors', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockGetBandSetlistsHubPayload.mockResolvedValue({
      role: 'editor',
      band: {id: 'band-1', name: 'Demo Band', slug: 'demo-band', status: 'published'},
      canEdit: true,
      canManage: false,
      publicBandHref: '/bandas/demo-band',
      initialServerSavedAt: '2026-08-17T10:00:00.000Z',
      songs: [],
      setlists: [],
      availableLogos: [],
      showPrefills: [],
    })

    const response = await GET(new NextRequest('http://localhost/api/dashboard/bands/band-1/setlists'), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(mockGetBandSetlistsHubPayload).toHaveBeenCalledWith('user-1', 'band-1')
    expect(response.status).toBe(200)
  })
})

describe('POST /api/dashboard/bands/[bandId]/setlists', () => {
  it('delegates setlist creation to the service layer', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockCreateBandSetlist.mockResolvedValue({
      ok: true,
      setlist: {
        id: 'setlist-1',
        bandId: 'band-1',
        showDate: '2026-08-20',
        venueName: 'Groove',
        printFontPreset: 'modern',
        printAllCaps: false,
        itemCount: 0,
      },
    })

    const response = await POST(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/setlists', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          showDate: '2026-08-20',
          venueName: 'Groove',
          printFontPreset: 'stage',
          printAllCaps: true,
        }),
      }),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )

    expect(mockCreateBandSetlist).toHaveBeenCalledWith(
      'user-1',
      'band-1',
      expect.objectContaining({venueName: 'Groove', printFontPreset: 'stage', printAllCaps: true}),
      expect.objectContaining({ip: null})
    )
    expect(response.status).toBe(201)
  })
})
