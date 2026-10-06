import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockGetBandPressKitPayload = vi.fn()
const mockUpdateBandPressKit = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/server/bands/press-kit', () => ({
  getBandPressKitPayload: mockGetBandPressKitPayload,
  updateBandPressKit: mockUpdateBandPressKit,
}))

let GET: typeof import('./route').GET
let PATCH: typeof import('./route').PATCH

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
  ;({GET, PATCH} = await import('./route'))
})

beforeEach(() => {
  vi.clearAllMocks()
  mockIsSupabaseConfigured.mockReturnValue(true)
})

describe('GET /api/dashboard/bands/[bandId]/press-kit', () => {
  it('returns 404 when the press kit payload is not available', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockGetBandPressKitPayload.mockResolvedValue(null)

    const response = await GET(new NextRequest('http://localhost/api/dashboard/bands/band-1/press-kit'), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      message: 'Band not found.',
    })
  })

  it('returns the private press kit payload for authenticated editors', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockGetBandPressKitPayload.mockResolvedValue({
      band: {id: 'band-1', name: 'Demo Band', slug: 'demo-band', status: 'published'},
      role: 'editor',
      canEdit: true,
      canManage: false,
      publicBandHref: '/bandas/demo-band',
      initialServerSavedAt: '2026-08-17T10:00:00.000Z',
      internalKit: {keyLinks: []},
      assets: [],
    })

    const response = await GET(new NextRequest('http://localhost/api/dashboard/bands/band-1/press-kit'), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(mockGetBandPressKitPayload).toHaveBeenCalledWith('user-1', 'band-1')
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        role: 'editor',
        band: {id: 'band-1', name: 'Demo Band', slug: 'demo-band', status: 'published'},
      })
    )
  })
})

describe('PATCH /api/dashboard/bands/[bandId]/press-kit', () => {
  it('delegates press kit updates to the service layer', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockUpdateBandPressKit.mockResolvedValue({
      ok: true,
      band: {
        id: 'band-1',
        slug: 'demo-band',
        sanityDocumentId: 'doc-1',
        syncedAt: '2026-08-17T11:00:00.000Z',
      },
    })

    const response = await PATCH(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/press-kit', {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          bioShort: 'Bio privada',
          keyLinks: [],
        }),
      }),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )

    expect(mockUpdateBandPressKit).toHaveBeenCalledWith(
      'user-1',
      'band-1',
      expect.objectContaining({bioShort: 'Bio privada'}),
      expect.objectContaining({ip: null})
    )
    expect(response.status).toBe(200)
  })
})
