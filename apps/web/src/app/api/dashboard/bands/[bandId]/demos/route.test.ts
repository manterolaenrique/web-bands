import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {BandServiceError} from '@/server/bands/service-error'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockGetBandDemosHome = vi.fn()
const mockUploadBandTrack = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/server/request-context', () => ({
  resolveRequestContext: vi.fn(() => ({
    ip: '127.0.0.1',
    requestId: 'req-demo-1',
    userAgent: 'Vitest',
  })),
}))

vi.mock('@/server/demos/home', () => ({
  getBandDemosHome: mockGetBandDemosHome,
}))

vi.mock('@/server/demos/tracks', () => ({
  uploadBandTrack: mockUploadBandTrack,
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

describe('GET /api/dashboard/bands/[bandId]/demos', () => {
  it('returns 401 when there is no authenticated session', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock(null))

    const response = await GET(new NextRequest('http://localhost/api/dashboard/bands/band-1/demos'), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      message: 'Authentication required.',
    })
  })

  it('returns demos home payload when access is valid', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockGetBandDemosHome.mockResolvedValue({
      band: {id: 'band-1', name: 'Demo Band', slug: 'demo-band', status: 'draft'},
      role: 'owner',
      canEdit: true,
      query: '',
      featuredTrack: null,
      recentTracks: [],
      playlists: [],
      totalTracks: 0,
      totalPlaylists: 0,
    })

    const response = await GET(new NextRequest('http://localhost/api/dashboard/bands/band-1/demos'), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(mockGetBandDemosHome).toHaveBeenCalledWith('user-1', 'band-1', null)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      band: {id: 'band-1', name: 'Demo Band', slug: 'demo-band', status: 'draft'},
      role: 'owner',
      canEdit: true,
      query: '',
      featuredTrack: null,
      recentTracks: [],
      playlists: [],
      totalTracks: 0,
      totalPlaylists: 0,
    })
  })
})

describe('POST /api/dashboard/bands/[bandId]/demos', () => {
  it('delegates uploads to the demos track service', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockUploadBandTrack.mockResolvedValue({
      ok: true,
      track: {id: 'track-1', title: 'Sobre Ruinas'},
    })

    const formData = new FormData()
    formData.set('title', 'Sobre Ruinas')
    formData.set('trackType', 'demo')
    formData.set('trackStatus', 'nuevo')
    formData.set('isDownloadable', 'true')
    formData.set('file', new File(['demo'], 'demo.mp3', {type: 'audio/mpeg'}))

    const response = await POST(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/demos', {
        method: 'POST',
        body: formData,
      }),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )

    expect(mockUploadBandTrack).toHaveBeenCalledWith(
      'user-1',
      'band-1',
      expect.any(FormData),
      expect.objectContaining({requestId: 'req-demo-1'})
    )
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      track: {id: 'track-1', title: 'Sobre Ruinas'},
    })
  })

  it('maps service errors into JSON responses', async () => {
    mockCreateClient.mockResolvedValue(createSupabaseMock())
    mockUploadBandTrack.mockRejectedValue(
      new BandServiceError('Audio must be 50MB or smaller.', 400)
    )

    const formData = new FormData()
    formData.set('file', new File(['demo'], 'demo.mp3', {type: 'audio/mpeg'}))

    const response = await POST(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/demos', {
        method: 'POST',
        body: formData,
      }),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      message: 'Audio must be 50MB or smaller.',
    })
  })
})
