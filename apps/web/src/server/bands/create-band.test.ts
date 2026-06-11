import {beforeEach, describe, expect, it, vi} from 'vitest'

const mockCreateClient = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

describe('createBandForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates the band and owner membership', async () => {
    const insertMembership = vi.fn().mockResolvedValue({error: null})
    const insertBand = vi.fn().mockResolvedValue({
      data: {
        id: 'band-1',
        name: 'Demo Band',
        slug: 'demo-band-1234abcd',
        status: 'draft',
      },
      error: null,
    })

    const from = vi.fn((table: string) => {
      if (table === 'bands') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: insertBand,
            })),
          })),
        }
      }

      if (table === 'band_memberships') {
        return {
          insert: insertMembership,
        }
      }

      throw new Error(`Unexpected table ${table}`)
    })

    mockCreateClient.mockResolvedValue({from})

    const {createBandForUser} = await import('./create-band')
    const result = await createBandForUser('user-1', 'Demo Band')

    expect(result).toEqual({
      band: {
        id: 'band-1',
        name: 'Demo Band',
        slug: 'demo-band-1234abcd',
        status: 'draft',
      },
    })
    expect(insertMembership).toHaveBeenCalledWith({
      band_id: 'band-1',
      user_id: 'user-1',
      role: 'owner',
    })
  })

  it('rejects short names before touching the database', async () => {
    const {createBandForUser} = await import('./create-band')

    await expect(createBandForUser('user-1', 'A')).rejects.toMatchObject({
      name: 'BandServiceError',
      status: 400,
      details: {code: 'band-name-invalid'},
    })
    expect(mockCreateClient).not.toHaveBeenCalled()
  })
})
