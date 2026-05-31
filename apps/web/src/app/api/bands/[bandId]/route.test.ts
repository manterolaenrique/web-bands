import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import type {SupabaseBand} from '@/types/band'

const mockRevalidatePath = vi.fn()
const mockCanEditBand = vi.fn()
const mockGetMembershipRole = vi.fn()
const mockIsSupabaseConfigured = vi.fn()
const mockResolveBandDocumentId = vi.fn()
const mockUpsertBandDocument = vi.fn()
const mockCreateClient = vi.fn()
const mockLogServerError = vi.fn()
const mockWriteAuditLog = vi.fn()
const mockConsumeRateLimit = vi.fn()

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}))

vi.mock('@/lib/auth/permissions', () => ({
  canEditBand: mockCanEditBand,
  getMembershipRole: mockGetMembershipRole,
}))

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/sanity/document-id', () => ({
  resolveBandDocumentId: mockResolveBandDocumentId,
}))

vi.mock('@/lib/sanity/mutations', () => ({
  upsertBandDocument: mockUpsertBandDocument,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/server/log', () => ({
  logServerError: mockLogServerError,
  logServerWarning: vi.fn(),
}))

vi.mock('@/lib/server/audit', () => ({
  writeAuditLog: mockWriteAuditLog,
}))

vi.mock('@/lib/server/request-context', () => ({
  resolveRequestContext: vi.fn(() => ({
    ip: '127.0.0.1',
    requestId: 'req-1',
    userAgent: 'Vitest',
  })),
}))

vi.mock('@/lib/server/rate-limit', () => ({
  RATE_LIMIT_POLICIES: {
    bandWrite: {
      bucket: 'bands.update',
      maxAttempts: 20,
      windowSeconds: 300,
    },
  },
  consumeRateLimit: mockConsumeRateLimit,
  getRateLimitHeaders: (result: {retryAfterSeconds: number}) => ({
    'Retry-After': String(result.retryAfterSeconds),
  }),
}))

let PATCH: typeof import('./route').PATCH

const validPayload = {
  name: 'Demo Band',
  slug: 'demo-band',
  genre: 'Rock',
  status: 'published',
  colors: {
    primary: '#111827',
    secondary: '#6b7280',
    secondaryLight: '',
    accent: '',
  },
  hero: {
    title: 'Demo Band',
    subtitle: 'Rock desde Buenos Aires',
    description: 'Una banda preparada para la V2.',
  },
  about: {
    title: 'Quienes Somos',
    content: 'Una historia con suficiente contenido para pasar la validacion.',
    integrantes: [
      {
        _key: 'member-1',
        nombre: 'Ana',
        instrumento: 'Voz',
      },
    ],
  },
  timelineSection: {
    enabled: true,
    titulo: 'Nuestra historia',
    descripcion: 'Los hitos mas importantes.',
    events: [
      {
        _key: 'event-1',
        name: 'Primer show',
        date: '2024-01-15',
        importance: 'principal',
        descripcion: 'Una noche clave.',
        link: 'https://example.com/show',
        icon: '🎤',
      },
    ],
  },
  contact: {
    email: 'hola@example.com',
    phone: '+54 11 5555 5555',
    location: 'Buenos Aires',
    instagram: '',
    youtube: '',
    facebook: '',
    spotify: '',
    tiktok: '',
  },
  escuchanos: {
    titulo: 'Escuchanos',
    descripcion: 'Videos y playlists.',
    youtube: {
      habilitado: true,
      titulo: 'YouTube',
      videos: [
        {
          _key: 'video-1',
          titulo: 'Live',
          url: 'https://www.youtube.com/watch?v=demo123',
          descripcion: 'Live session',
        },
      ],
    },
    spotify: {
      habilitado: true,
      titulo: 'Spotify',
      perfil_url: 'https://open.spotify.com/artist/demo',
      playlists: [
        {
          _key: 'playlist-1',
          titulo: 'Favoritas',
          url: 'https://open.spotify.com/playlist/demo',
          descripcion: 'Seleccion curada',
        },
      ],
    },
  },
  seo: {
    title: 'Demo Band',
    description: 'Demo Band en Web Bands.',
  },
}

function createBandRow(overrides: Partial<SupabaseBand> = {}): SupabaseBand {
  return {
    id: 'band-1',
    slug: 'old-demo-band',
    name: 'Old Demo Band',
    sanity_document_id: null,
    status: 'draft',
    created_by: 'user-1',
    created_at: '2026-05-24T00:00:00.000Z',
    updated_at: '2026-05-24T00:00:00.000Z',
    ...overrides,
  }
}

function createSupabaseMock({
  user = {id: 'user-1'},
  bandRow = createBandRow(),
  bandError = null,
  updateError = null,
}: {
  user?: {id: string} | null
  bandRow?: SupabaseBand | null
  bandError?: unknown
  updateError?: unknown
} = {}) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: bandRow,
    error: bandError,
  })
  const selectEq = vi.fn(() => ({
    maybeSingle,
  }))
  const select = vi.fn(() => ({
    eq: selectEq,
  }))
  const updateEq = vi.fn().mockResolvedValue({
    error: updateError,
  })
  const update = vi.fn(() => ({
    eq: updateEq,
  }))
  const from = vi.fn(() => ({
    select,
    update,
  }))

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user,
        },
      }),
    },
    from,
    spies: {
      maybeSingle,
      select,
      update,
      updateEq,
    },
  }
}

function createRequest(body: unknown) {
  return new NextRequest('http://localhost/api/bands/band-1', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

async function readJson(response: Response) {
  return response.json()
}

beforeAll(async () => {
  ;({PATCH} = await import('./route'))
})

beforeEach(() => {
  vi.clearAllMocks()
  mockIsSupabaseConfigured.mockReturnValue(true)
  mockGetMembershipRole.mockResolvedValue('owner')
  mockCanEditBand.mockReturnValue(true)
  mockResolveBandDocumentId.mockReturnValue('banda-band-1')
  mockConsumeRateLimit.mockResolvedValue({
    allowed: true,
    keyHash: 'band-write-key',
    remaining: 19,
    resetAt: null,
    retryAfterSeconds: 0,
  })
  mockWriteAuditLog.mockResolvedValue(true)
})

describe('PATCH /api/bands/[bandId]', () => {
  it('returns 401 when there is no authenticated session', async () => {
    const supabase = createSupabaseMock({user: null})
    mockCreateClient.mockResolvedValue(supabase)

    const response = await PATCH(createRequest(validPayload), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(response.status).toBe(401)
    await expect(readJson(response)).resolves.toEqual({
      message: 'Authentication required.',
    })
  })

  it('returns 403 when the membership cannot edit the band', async () => {
    const supabase = createSupabaseMock()
    mockCreateClient.mockResolvedValue(supabase)
    mockGetMembershipRole.mockResolvedValue('viewer')
    mockCanEditBand.mockReturnValue(false)

    const response = await PATCH(createRequest(validPayload), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(response.status).toBe(403)
    await expect(readJson(response)).resolves.toEqual({
      message: 'You do not have permission to edit this band.',
    })
  })

  it('returns 400 with validation issues for an invalid payload', async () => {
    const supabase = createSupabaseMock()
    mockCreateClient.mockResolvedValue(supabase)

    const response = await PATCH(
      createRequest({
        ...validPayload,
        slug: 'bad slug',
        hero: {
          ...validPayload.hero,
          title: '',
        },
        timelineSection: {
          ...validPayload.timelineSection,
          events: [
            {
              ...validPayload.timelineSection.events[0],
              date: 'not-a-date',
            },
          ],
        },
      }),
      {
      params: Promise.resolve({bandId: 'band-1'}),
      }
    )
    const body = await readJson(response)

    expect(response.status).toBe(400)
    expect(body.message).toBe('Invalid band payload.')
    expect(body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({path: 'slug'}),
          expect.objectContaining({path: 'hero.title'}),
          expect.objectContaining({path: 'timelineSection.events.0.date'}),
        ])
      )
    expect(mockUpsertBandDocument).not.toHaveBeenCalled()
  })

  it('returns 429 when the write rate limit is exceeded', async () => {
    const supabase = createSupabaseMock()
    mockCreateClient.mockResolvedValue(supabase)
    mockConsumeRateLimit.mockResolvedValue({
      allowed: false,
      keyHash: 'blocked-band-write',
      remaining: 0,
      resetAt: '2099-01-01T00:05:00.000Z',
      retryAfterSeconds: 300,
    })

    const response = await PATCH(createRequest(validPayload), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('300')
    await expect(readJson(response)).resolves.toEqual({
      message: 'Too many band updates right now. Try again in a few minutes.',
      retryAfterSeconds: 300,
    })
    expect(mockUpsertBandDocument).not.toHaveBeenCalled()
  })

  it('returns 404 when the band does not exist', async () => {
    const supabase = createSupabaseMock({bandRow: null})
    mockCreateClient.mockResolvedValue(supabase)

    const response = await PATCH(createRequest(validPayload), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(response.status).toBe(404)
    await expect(readJson(response)).resolves.toEqual({
      message: 'Band not found.',
    })
  })

  it('returns 200 and revalidates the old and new public routes after a valid save', async () => {
    const supabase = createSupabaseMock()
    mockCreateClient.mockResolvedValue(supabase)
    mockUpsertBandDocument.mockResolvedValue({ok: true})

    const response = await PATCH(createRequest(validPayload), {
      params: Promise.resolve({bandId: 'band-1'}),
    })
    const body = await readJson(response)

    expect(response.status).toBe(200)
    expect(mockUpsertBandDocument).toHaveBeenCalledWith(
      'banda-band-1',
      'band-1',
      expect.objectContaining({
        name: 'Demo Band',
        slug: 'demo-band',
        status: 'published',
      }),
      'user-1'
    )
    expect(body).toEqual({
      ok: true,
      band: {
        id: 'band-1',
        slug: 'demo-band',
        sanityDocumentId: 'banda-band-1',
      },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/bandas/demo-band')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/bandas/old-demo-band')
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'band.updated',
        actorUserId: 'user-1',
        bandId: 'band-1',
        targetId: 'band-1',
        targetType: 'band',
      })
    )
  })
})
