import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {BandServiceError} from '@/server/bands/service-error'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockCreateBandPrivateAssetUpload = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/server/bands/press-kit', () => ({
  createBandPrivateAssetUpload: mockCreateBandPrivateAssetUpload,
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

describe('POST /api/dashboard/bands/[bandId]/press-kit/uploads', () => {
  it('creates a signed upload target for press kit assets', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockCreateBandPrivateAssetUpload.mockResolvedValue({
      ok: true,
      upload: {
        assetId: 'asset-1',
        storagePath: 'band-1/asset-1/logo.png',
        token: 'signed-token-1',
      },
    })

    const response = await POST(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/press-kit/uploads', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          kind: 'logo',
          label: 'Logo principal',
          fileName: 'logo.png',
          mimeType: 'image/png',
          fileSizeBytes: 1024,
        }),
      }),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )

    expect(mockCreateBandPrivateAssetUpload).toHaveBeenCalledWith(
      'user-1',
      'band-1',
      expect.objectContaining({label: 'Logo principal'})
    )
    expect(response.status).toBe(201)
  })

  it('maps service errors into JSON responses', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockCreateBandPrivateAssetUpload.mockRejectedValue(
      new BandServiceError('Only PNG logos are allowed in the press kit.', 400)
    )

    const response = await POST(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/press-kit/uploads', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          kind: 'logo',
          label: 'Logo principal',
          fileName: 'logo.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 1024,
        }),
      }),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      message: 'Only PNG logos are allowed in the press kit.',
    })
  })
})
