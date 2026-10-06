import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockCreateBandPrivateAssetShareLink = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/server/bands/press-kit', () => ({
  createBandPrivateAssetShareLink: mockCreateBandPrivateAssetShareLink,
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

describe('POST /api/dashboard/bands/[bandId]/press-kit/assets/[assetId]/share', () => {
  it('creates a temporary signed share link', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockCreateBandPrivateAssetShareLink.mockResolvedValue({
      ok: true,
      share: {
        url: 'https://signed.example/logo.png',
        expiresInSeconds: 604800,
        preset: '7d',
        fileName: 'demo-band_logo.png',
      },
    })

    const response = await POST(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/press-kit/assets/asset-1/share', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({preset: '7d'}),
      }),
      {
        params: Promise.resolve({bandId: 'band-1', assetId: 'asset-1'}),
      }
    )

    expect(mockCreateBandPrivateAssetShareLink).toHaveBeenCalledWith(
      'user-1',
      'band-1',
      'asset-1',
      {preset: '7d'},
      expect.objectContaining({ip: null})
    )
    expect(response.status).toBe(200)
  })
})
