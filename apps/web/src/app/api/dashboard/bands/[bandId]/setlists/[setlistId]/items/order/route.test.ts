import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockReorderBandSetlistItems = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/server/bands/setlists', () => ({
  reorderBandSetlistItems: mockReorderBandSetlistItems,
}))

let PATCH: typeof import('./route').PATCH

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
  ;({PATCH} = await import('./route'))
})

beforeEach(() => {
  vi.clearAllMocks()
  mockIsSupabaseConfigured.mockReturnValue(true)
})

describe('PATCH /api/dashboard/bands/[bandId]/setlists/[setlistId]/items/order', () => {
  it('reorders setlist items through the service layer', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockReorderBandSetlistItems.mockResolvedValue({ok: true})

    const response = await PATCH(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/setlists/setlist-1/items/order', {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          orderedItemIds: ['item-1', 'item-2'],
        }),
      }),
      {
        params: Promise.resolve({bandId: 'band-1', setlistId: 'setlist-1'}),
      }
    )

    expect(mockReorderBandSetlistItems).toHaveBeenCalledWith(
      'user-1',
      'band-1',
      'setlist-1',
      expect.objectContaining({orderedItemIds: ['item-1', 'item-2']}),
      expect.objectContaining({ip: null})
    )
    expect(response.status).toBe(200)
  })
})
