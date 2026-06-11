import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockGetDashboardBands = vi.fn()
const mockCreateBandForUser = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/server/bands/dashboard', () => ({
  getDashboardBands: mockGetDashboardBands,
}))

vi.mock('@/server/bands/create-band', () => ({
  createBandForUser: mockCreateBandForUser,
}))

let GET: typeof import('./route').GET
let POST: typeof import('./route').POST

function createSupabaseMock(user: {id: string; email?: string | null} | null = {id: 'user-1', email: 'demo@example.com'}) {
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

describe('GET /api/dashboard/bands', () => {
  it('returns 401 when there is no authenticated session', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock(null))

    const response = await GET()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      message: 'Authentication required.',
    })
  })

  it('returns dashboard data for the authenticated user', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockGetDashboardBands.mockResolvedValue({
      memberships: [],
      pendingInvites: [],
      loadError: false,
    })

    const response = await GET()

    expect(mockGetDashboardBands).toHaveBeenCalledWith('user-1', 'demo@example.com')
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      memberships: [],
      pendingInvites: [],
      loadError: false,
    })
  })

  it('creates a new band through the POST endpoint', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockCreateBandForUser.mockResolvedValue({
      band: {
        id: 'band-1',
        name: 'Demo Band',
        slug: 'demo-band-1234abcd',
        status: 'draft',
      },
    })

    const response = await POST(
      new Request('http://localhost/api/dashboard/bands', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: 'Demo Band'}),
      })
    )

    expect(mockCreateBandForUser).toHaveBeenCalledWith('user-1', 'Demo Band')
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      band: {
        id: 'band-1',
        name: 'Demo Band',
        slug: 'demo-band-1234abcd',
        status: 'draft',
      },
      editorHref: '/dashboard/bands/band-1',
    })
  })
})
