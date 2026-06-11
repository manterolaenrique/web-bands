import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {BandServiceError} from '@/server/bands/service-error'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockUploadBandAsset = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/server/request-context', () => ({
  resolveRequestContext: vi.fn(() => ({
    ip: '127.0.0.1',
    requestId: 'req-1',
    userAgent: 'Vitest',
  })),
}))

vi.mock('@/lib/sanity/mutations', () => ({
  isBandImageField: (value: string | null) => ['logo', 'heroImage'].includes(value || ''),
  isBandArrayImageCollection: (value: string | null) => ['about.integrantes'].includes(value || ''),
  isBandArrayImageField: (collection: string, value: string | null) =>
    collection === 'about.integrantes' && value === 'foto',
}))

vi.mock('@/server/bands/upload-band-asset', () => ({
  uploadBandAsset: mockUploadBandAsset,
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

function createRequest(formData: FormData) {
  return new NextRequest('http://localhost/api/bands/band-1/assets', {
    method: 'POST',
    body: formData,
  })
}

beforeAll(async () => {
  ;({POST} = await import('./route'))
})

beforeEach(() => {
  vi.clearAllMocks()
  mockIsSupabaseConfigured.mockReturnValue(true)
})

describe('POST /api/bands/[bandId]/assets', () => {
  it('returns 401 when there is no authenticated session', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock(null))
    const formData = new FormData()
    formData.set('field', 'logo')

    const response = await POST(createRequest(formData), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      message: 'Authentication required.',
    })
  })

  it('delegates to uploadBandAsset and returns the payload', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockUploadBandAsset.mockResolvedValue({
      ok: true,
      image: {
        assetId: 'image-1',
        url: 'https://cdn.sanity.io/demo.png',
      },
    })

    const formData = new FormData()
    formData.set('field', 'logo')
    formData.set('file', new File(['demo'], 'logo.png', {type: 'image/png'}))

    const response = await POST(createRequest(formData), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(mockUploadBandAsset).toHaveBeenCalledWith(
      'user-1',
      'band-1',
      {kind: 'field', field: 'logo'},
      expect.any(File),
      expect.objectContaining({requestId: 'req-1'})
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      image: {
        assetId: 'image-1',
        url: 'https://cdn.sanity.io/demo.png',
      },
    })
  })

  it('maps service errors into JSON responses', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockUploadBandAsset.mockRejectedValue(
      new BandServiceError('Image must be 5MB or smaller.', 400)
    )

    const formData = new FormData()
    formData.set('field', 'logo')

    const response = await POST(createRequest(formData), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      message: 'Image must be 5MB or smaller.',
    })
  })
})
