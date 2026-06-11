import {beforeEach, describe, expect, it, vi} from 'vitest'

const mockCreateClient = vi.fn()
const mockCreateAdminClient = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mockCreateAdminClient,
}))

describe('getDashboardBands', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns mapped memberships and invite counts', async () => {
    const membershipOrder = vi.fn().mockResolvedValue({
      data: [
        {
          role: 'owner',
          bands: {
            id: 'band-1',
            name: 'Demo Band',
            slug: 'demo-band',
            status: 'published',
            sanity_document_id: 'banda-band-1',
            updated_at: '2026-06-05T00:00:00.000Z',
          },
        },
      ],
      error: null,
    })

    mockCreateClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: membershipOrder,
          })),
        })),
      })),
    })

    mockCreateAdminClient.mockResolvedValue({
      from: vi.fn(),
    })

    const {getDashboardBands} = await import('./dashboard')
    const result = await getDashboardBands('user-1')

    expect(result.loadError).toBe(false)
    expect(result.memberships).toEqual([
      {
        role: 'owner',
        band: {
          id: 'band-1',
          name: 'Demo Band',
          slug: 'demo-band',
          status: 'published',
          sanity_document_id: 'banda-band-1',
          updated_at: '2026-06-05T00:00:00.000Z',
        },
        publicBandHref: '/bandas/demo-band',
      },
    ])
    expect(result.pendingInvites).toEqual([])
  })
})
