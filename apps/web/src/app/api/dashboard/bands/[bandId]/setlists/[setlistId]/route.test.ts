import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockGetBandSetlistEditorPayload = vi.fn()
const mockUpdateBandSetlist = vi.fn()
const mockDeleteBandSetlist = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/server/bands/setlists', () => ({
  getBandSetlistEditorPayload: mockGetBandSetlistEditorPayload,
  updateBandSetlist: mockUpdateBandSetlist,
  deleteBandSetlist: mockDeleteBandSetlist,
}))

let GET: typeof import('./route').GET
let PATCH: typeof import('./route').PATCH
let DELETE: typeof import('./route').DELETE

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
  ;({GET, PATCH, DELETE} = await import('./route'))
})

beforeEach(() => {
  vi.clearAllMocks()
  mockIsSupabaseConfigured.mockReturnValue(true)
})

describe('GET /api/dashboard/bands/[bandId]/setlists/[setlistId]', () => {
  it('returns 404 when the setlist detail is not available', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockGetBandSetlistEditorPayload.mockResolvedValue(null)

    const response = await GET(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/setlists/setlist-1'),
      {
        params: Promise.resolve({bandId: 'band-1', setlistId: 'setlist-1'}),
      }
    )

    expect(response.status).toBe(404)
  })
})

describe('PATCH /api/dashboard/bands/[bandId]/setlists/[setlistId]', () => {
  it('updates the setlist through the service layer', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockUpdateBandSetlist.mockResolvedValue({
      ok: true,
      setlist: {id: 'setlist-1'},
    })

    const response = await PATCH(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/setlists/setlist-1', {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          showDate: '2026-08-20',
          venueName: 'Groove',
          printFontPreset: 'editorial',
          printAllCaps: true,
        }),
      }),
      {
        params: Promise.resolve({bandId: 'band-1', setlistId: 'setlist-1'}),
      }
    )

    expect(mockUpdateBandSetlist).toHaveBeenCalledWith(
      'user-1',
      'band-1',
      'setlist-1',
      expect.objectContaining({venueName: 'Groove', printFontPreset: 'editorial', printAllCaps: true}),
      expect.objectContaining({ip: null})
    )
    expect(response.status).toBe(200)
  })
})

describe('DELETE /api/dashboard/bands/[bandId]/setlists/[setlistId]', () => {
  it('deletes the setlist through the service layer', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockDeleteBandSetlist.mockResolvedValue({ok: true})

    const response = await DELETE(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/setlists/setlist-1', {
        method: 'DELETE',
      }),
      {
        params: Promise.resolve({bandId: 'band-1', setlistId: 'setlist-1'}),
      }
    )

    expect(mockDeleteBandSetlist).toHaveBeenCalledWith(
      'user-1',
      'band-1',
      'setlist-1',
      expect.objectContaining({ip: null})
    )
    expect(response.status).toBe(200)
  })
})
