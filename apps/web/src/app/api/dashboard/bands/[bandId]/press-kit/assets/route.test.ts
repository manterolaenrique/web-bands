import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockListBandPrivateAssets = vi.fn()
const mockCompleteBandPrivateAssetUpload = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/server/bands/press-kit', () => ({
  listBandPrivateAssets: mockListBandPrivateAssets,
  completeBandPrivateAssetUpload: mockCompleteBandPrivateAssetUpload,
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

describe('GET /api/dashboard/bands/[bandId]/press-kit/assets', () => {
  it('returns the private asset list for the band', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockListBandPrivateAssets.mockResolvedValue([
      {
        id: 'asset-1',
        bandId: 'band-1',
        kind: 'logo',
        label: 'Logo principal',
      },
    ])

    const response = await GET(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/press-kit/assets'),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )

    expect(mockListBandPrivateAssets).toHaveBeenCalledWith('user-1', 'band-1')
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      assets: [
        {
          id: 'asset-1',
          bandId: 'band-1',
          kind: 'logo',
          label: 'Logo principal',
        },
      ],
    })
  })
})

describe('POST /api/dashboard/bands/[bandId]/press-kit/assets', () => {
  it('finalizes an uploaded press kit asset', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockCompleteBandPrivateAssetUpload.mockResolvedValue({
      ok: true,
      asset: {
        id: 'asset-1',
        bandId: 'band-1',
        kind: 'logo',
        label: 'Logo principal',
      },
    })

    const response = await POST(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/press-kit/assets', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          kind: 'logo',
          label: 'Logo principal',
          upload: {
            assetId: 'asset-1',
            storagePath: 'band-1/asset-1/logo.png',
            originalFileName: 'logo.png',
            mimeType: 'image/png',
            fileSizeBytes: 1024,
          },
        }),
      }),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )

    expect(mockCompleteBandPrivateAssetUpload).toHaveBeenCalledWith(
      'user-1',
      'band-1',
      expect.objectContaining({label: 'Logo principal'}),
      expect.objectContaining({ip: null})
    )
    expect(response.status).toBe(201)
  })
})
