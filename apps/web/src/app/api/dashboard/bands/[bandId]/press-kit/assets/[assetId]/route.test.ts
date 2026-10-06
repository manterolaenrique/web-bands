import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockDeleteBandPrivateAsset = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/server/bands/press-kit', () => ({
  deleteBandPrivateAsset: mockDeleteBandPrivateAsset,
}))

let DELETE: typeof import('./route').DELETE

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
  ;({DELETE} = await import('./route'))
})

beforeEach(() => {
  vi.clearAllMocks()
  mockIsSupabaseConfigured.mockReturnValue(true)
})

describe('DELETE /api/dashboard/bands/[bandId]/press-kit/assets/[assetId]', () => {
  it('deletes a private asset for the band', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockDeleteBandPrivateAsset.mockResolvedValue({ok: true})

    const response = await DELETE(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/press-kit/assets/asset-1', {
        method: 'DELETE',
      }),
      {
        params: Promise.resolve({bandId: 'band-1', assetId: 'asset-1'}),
      }
    )

    expect(mockDeleteBandPrivateAsset).toHaveBeenCalledWith(
      'user-1',
      'band-1',
      'asset-1',
      expect.objectContaining({ip: null})
    )
    expect(response.status).toBe(200)
  })
})
