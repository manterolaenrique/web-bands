import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockGetBandSetlistPrintPayload = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/server/bands/setlists', () => ({
  getBandSetlistPrintPayload: mockGetBandSetlistPrintPayload,
}))

let GET: typeof import('./route').GET

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
  ;({GET} = await import('./route'))
})

beforeEach(() => {
  vi.clearAllMocks()
  mockIsSupabaseConfigured.mockReturnValue(true)
})

describe('GET /api/dashboard/bands/[bandId]/setlists/[setlistId]/print', () => {
  it('returns the print payload for a private setlist', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockGetBandSetlistPrintPayload.mockResolvedValue({
      role: 'editor',
      band: {id: 'band-1', name: 'Demo Band', slug: 'demo-band', status: 'published'},
      setlist: {id: 'setlist-1', items: [], printFontPreset: 'modern', printAllCaps: false},
      logo: null,
    })

    const response = await GET(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/setlists/setlist-1/print'),
      {
        params: Promise.resolve({bandId: 'band-1', setlistId: 'setlist-1'}),
      }
    )

    expect(mockGetBandSetlistPrintPayload).toHaveBeenCalledWith('user-1', 'band-1', 'setlist-1')
    expect(response.status).toBe(200)
  })
})
