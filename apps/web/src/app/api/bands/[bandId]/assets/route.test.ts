import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import type {SupabaseBand} from '@/types/band'

const mockRevalidatePath = vi.fn()
const mockCanEditBand = vi.fn()
const mockGetMembershipRole = vi.fn()
const mockIsSupabaseConfigured = vi.fn()
const mockShouldUpdateBandDocumentId = vi.fn()
const mockUploadBandImage = vi.fn()
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
  shouldUpdateBandDocumentId: mockShouldUpdateBandDocumentId,
}))

vi.mock('@/lib/sanity/mutations', () => ({
  isBandImageField: (value: string | null) =>
    ['logo', 'logoFavicon', 'heroImage', 'aboutImage'].includes(value || ''),
  isBandArrayImageCollection: (value: string | null) =>
    ['about.integrantes', 'timelineSection.events'].includes(value || ''),
  isBandArrayImageField: (collection: string, value: string | null) =>
    (collection === 'about.integrantes' && value === 'foto') ||
    (collection === 'timelineSection.events' && value === 'image'),
  uploadBandImage: mockUploadBandImage,
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
    assetUpload: {
      bucket: 'bands.asset_upload',
      maxAttempts: 10,
      windowSeconds: 300,
    },
  },
  consumeRateLimit: mockConsumeRateLimit,
  getRateLimitHeaders: (result: {retryAfterSeconds: number}) => ({
    'Retry-After': String(result.retryAfterSeconds),
  }),
}))

let POST: typeof import('./route').POST

function createBandRow(overrides: Partial<SupabaseBand> = {}): SupabaseBand {
  return {
    id: 'band-1',
    slug: 'demo-band',
    name: 'Demo Band',
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
      updateEq,
    },
  }
}

function createImageFormData({
  field = 'logo',
  collection,
  itemKey,
  imageField,
  file = new File([new Uint8Array([1, 2, 3])], 'logo.jpg', {type: 'image/jpeg'}),
}: {
  field?: string
  collection?: string
  itemKey?: string
  imageField?: string
  file?: File
} = {}) {
  const formData = new FormData()
  if (collection) {
    formData.set('collection', collection)
  } else {
    formData.set('field', field)
  }
  if (itemKey) {
    formData.set('itemKey', itemKey)
  }
  if (imageField) {
    formData.set('imageField', imageField)
  }
  formData.set('file', file)
  return formData
}

function createRequest(formData: FormData) {
  return new NextRequest('http://localhost/api/bands/band-1/assets', {
    method: 'POST',
    body: formData,
  })
}

async function readJson(response: Response) {
  return response.json()
}

beforeAll(async () => {
  ;({POST} = await import('./route'))
})

beforeEach(() => {
  vi.clearAllMocks()
  mockIsSupabaseConfigured.mockReturnValue(true)
  mockGetMembershipRole.mockResolvedValue('owner')
  mockCanEditBand.mockReturnValue(true)
  mockShouldUpdateBandDocumentId.mockReturnValue(false)
  mockConsumeRateLimit.mockResolvedValue({
    allowed: true,
    keyHash: 'asset-upload-key',
    remaining: 9,
    resetAt: null,
    retryAfterSeconds: 0,
  })
  mockWriteAuditLog.mockResolvedValue(true)
})

describe('POST /api/bands/[bandId]/assets', () => {
  it('returns 401 when there is no authenticated session', async () => {
    const supabase = createSupabaseMock({user: null})
    mockCreateClient.mockResolvedValue(supabase)

    const response = await POST(createRequest(createImageFormData()), {
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

    const response = await POST(createRequest(createImageFormData()), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(response.status).toBe(403)
    await expect(readJson(response)).resolves.toEqual({
      message: 'You do not have permission to edit this band.',
    })
  })

  it('returns 400 when the image field is invalid', async () => {
    const supabase = createSupabaseMock()
    mockCreateClient.mockResolvedValue(supabase)

    const response = await POST(createRequest(createImageFormData({field: 'posterImage'})), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(response.status).toBe(400)
    await expect(readJson(response)).resolves.toEqual({
      message: 'Invalid image field.',
    })
  })

  it('returns 400 when the collection image target is invalid', async () => {
    const supabase = createSupabaseMock()
    mockCreateClient.mockResolvedValue(supabase)

    const response = await POST(
      createRequest(
        createImageFormData({
          collection: 'about.integrantes',
          itemKey: 'member-1',
          imageField: 'poster',
        })
      ),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )

    expect(response.status).toBe(400)
    await expect(readJson(response)).resolves.toEqual({
      message: 'Invalid image field.',
    })
  })

  it('returns 400 when the uploaded file type is not supported', async () => {
    const supabase = createSupabaseMock()
    mockCreateClient.mockResolvedValue(supabase)

    const response = await POST(
      createRequest(
        createImageFormData({
          file: new File([new Uint8Array([1, 2, 3])], 'logo.svg', {type: 'image/svg+xml'}),
        })
      ),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )

    expect(response.status).toBe(400)
    await expect(readJson(response)).resolves.toEqual({
      message: 'Only JPG, PNG and WebP images are allowed.',
    })
  })

  it('returns 429 when the asset upload rate limit is exceeded', async () => {
    const supabase = createSupabaseMock()
    mockCreateClient.mockResolvedValue(supabase)
    mockConsumeRateLimit.mockResolvedValue({
      allowed: false,
      keyHash: 'blocked-asset-upload',
      remaining: 0,
      resetAt: '2099-01-01T00:05:00.000Z',
      retryAfterSeconds: 300,
    })

    const response = await POST(createRequest(createImageFormData()), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('300')
    await expect(readJson(response)).resolves.toEqual({
      message: 'Too many image uploads right now. Try again in a few minutes.',
      retryAfterSeconds: 300,
    })
    expect(mockUploadBandImage).not.toHaveBeenCalled()
  })

  it('returns 400 when the uploaded file is larger than 5MB', async () => {
    const supabase = createSupabaseMock()
    mockCreateClient.mockResolvedValue(supabase)

    const response = await POST(
      createRequest(
        createImageFormData({
          file: new File([new Uint8Array(6 * 1024 * 1024)], 'hero.webp', {type: 'image/webp'}),
        })
      ),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )

    expect(response.status).toBe(400)
    await expect(readJson(response)).resolves.toEqual({
      message: 'Image must be 5MB or smaller.',
    })
  })

  it('returns 404 when the band does not exist', async () => {
    const supabase = createSupabaseMock({bandRow: null})
    mockCreateClient.mockResolvedValue(supabase)

    const response = await POST(createRequest(createImageFormData()), {
      params: Promise.resolve({bandId: 'band-1'}),
    })

    expect(response.status).toBe(404)
    await expect(readJson(response)).resolves.toEqual({
      message: 'Band not found.',
    })
  })

  it('returns 200 after a valid image upload', async () => {
    const supabase = createSupabaseMock()
    mockCreateClient.mockResolvedValue(supabase)
    mockUploadBandImage.mockResolvedValue({
      asset: {
        _id: 'image-asset-1',
      },
      documentId: 'banda-band-1',
      fieldPath: 'logo',
    })

    const response = await POST(createRequest(createImageFormData()), {
      params: Promise.resolve({bandId: 'band-1'}),
    })
    const body = await readJson(response)

    expect(response.status).toBe(200)
    expect(mockUploadBandImage).toHaveBeenCalledWith(
      expect.objectContaining({
        band: expect.objectContaining({
          id: 'band-1',
          slug: 'demo-band',
        }),
        target: {
          kind: 'field',
          field: 'logo',
        },
        userId: 'user-1',
      })
    )
    expect(body).toEqual({
      ok: true,
      image: {
        field: 'logo',
        collection: undefined,
        itemKey: undefined,
        imageField: undefined,
        fieldPath: 'logo',
        assetId: 'image-asset-1',
      },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/bandas/demo-band')
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'band.asset_uploaded',
        actorUserId: 'user-1',
        bandId: 'band-1',
        targetId: 'image-asset-1',
        targetType: 'sanity_asset',
      })
    )
  })

  it('returns 200 after a valid collection image upload', async () => {
    const supabase = createSupabaseMock()
    mockCreateClient.mockResolvedValue(supabase)
    mockUploadBandImage.mockResolvedValue({
      asset: {
        _id: 'image-asset-2',
      },
      documentId: 'banda-band-1',
      fieldPath: 'about.integrantes[_key=="member-1"].foto',
    })

    const response = await POST(
      createRequest(
        createImageFormData({
          collection: 'about.integrantes',
          itemKey: 'member-1',
          imageField: 'foto',
        })
      ),
      {
        params: Promise.resolve({bandId: 'band-1'}),
      }
    )
    const body = await readJson(response)

    expect(response.status).toBe(200)
    expect(mockUploadBandImage).toHaveBeenCalledWith(
      expect.objectContaining({
        target: {
          kind: 'array',
          collection: 'about.integrantes',
          itemKey: 'member-1',
          imageField: 'foto',
        },
      })
    )
    expect(body).toEqual({
      ok: true,
      image: {
        field: undefined,
        collection: 'about.integrantes',
        itemKey: 'member-1',
        imageField: 'foto',
        fieldPath: 'about.integrantes[_key=="member-1"].foto',
        assetId: 'image-asset-2',
      },
    })
  })
})
