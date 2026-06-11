import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockGetBandEditorPayload = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/server/bands/editor-payload', () => ({
  getBandEditorPayload: mockGetBandEditorPayload,
}))

let GET: typeof import('./route').GET

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
  ;({GET} = await import('./route'))
})

beforeEach(() => {
  vi.clearAllMocks()
  mockIsSupabaseConfigured.mockReturnValue(true)
})

describe('GET /api/dashboard/bands/[bandId]', () => {
  it('returns 401 when there is no authenticated session', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock(null))

    const response = await GET(new Request('http://localhost'), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      message: 'Authentication required.',
    })
  })

  it('returns 404 when the payload is not available', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockGetBandEditorPayload.mockResolvedValue(null)

    const response = await GET(new Request('http://localhost'), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      message: 'Band not found.',
    })
  })

  it('returns the editor payload when access is valid', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockGetBandEditorPayload.mockResolvedValue({
      role: 'owner',
      canEdit: true,
      canManage: true,
      band: {id: 'band-1', name: 'Demo Band'},
    })

    const response = await GET(new Request('http://localhost'), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(mockGetBandEditorPayload).toHaveBeenCalledWith('user-1', 'band-1')
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      role: 'owner',
      canEdit: true,
      canManage: true,
      band: {id: 'band-1', name: 'Demo Band'},
    })
  })
})
