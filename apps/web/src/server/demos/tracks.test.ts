import {beforeEach, describe, expect, it, vi} from 'vitest'

const mockCreateClient = vi.fn()
const mockWriteAuditLog = vi.fn()
const mockConsumeRateLimit = vi.fn()
const mockGetBandDemosAccess = vi.fn()
const mockRequireDemosEditor = vi.fn()
const mockRequireDemosAdminClient = vi.fn()
const mockEnsureGeneralPlaylist = vi.fn()
const mockRevalidatePath = vi.fn()
const mockStorageFrom = vi.fn()

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/server/audit', () => ({
  writeAuditLog: mockWriteAuditLog,
}))

vi.mock('@/lib/server/rate-limit', () => ({
  consumeRateLimit: mockConsumeRateLimit,
  getRateLimitHeaders: vi.fn(() => ({})),
  RATE_LIMIT_POLICIES: {
    demosUpload: 'demos-upload',
    demosWrite: 'demos-write',
  },
}))

vi.mock('./shared', async () => {
  const actual = await vi.importActual<typeof import('./shared')>('./shared')

  return {
    ...actual,
    getBandDemosAccess: mockGetBandDemosAccess,
    requireDemosEditor: mockRequireDemosEditor,
    requireDemosAdminClient: mockRequireDemosAdminClient,
    ensureGeneralPlaylist: mockEnsureGeneralPlaylist,
  }
})

function createDatabaseMock(playlistTrackInserts: Array<{playlist_id: string; track_id: string; sort_order: number}>) {
  return {
    from: vi.fn((table: string) => {
      if (table === 'band_audio_playlists') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {id: '123e4567-e89b-12d3-a456-426614174000', system_key: null},
                  error: null,
                }),
              })),
            })),
          })),
        }
      }

      if (table === 'band_audio_tracks') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'track-1',
                  band_id: 'band-1',
                  title: 'Demo nueva',
                  description: null,
                  related_song_title: null,
                  storage_bucket: 'band-demos',
                  storage_path: 'band-1/track-1/demo-nueva.wav',
                  original_file_name: 'demo-nueva.wav',
                  mime_type: 'audio/wav',
                  file_size_bytes: 128,
                  duration_seconds: 1,
                  track_type: 'demo',
                  track_status: 'nuevo',
                  uploaded_by: 'user-1',
                  is_downloadable: true,
                  created_at: '2026-06-12T10:00:00.000Z',
                  updated_at: '2026-06-12T10:00:00.000Z',
                },
                error: null,
              }),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({error: null}),
            })),
          })),
        }
      }

      if (table === 'band_audio_playlist_tracks') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              })),
            })),
          })),
          insert: vi.fn((payload) => {
            playlistTrackInserts.push(payload)
            return Promise.resolve({error: null})
          }),
        }
      }

      throw new Error(`Unexpected table ${table}`)
    }),
  }
}

describe('demos tracks services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWriteAuditLog.mockResolvedValue(true)
    mockConsumeRateLimit.mockResolvedValue({allowed: true})
    mockGetBandDemosAccess.mockResolvedValue({
      band: {id: 'band-1', name: 'Demo Band', slug: 'demo-band', status: 'draft'},
      role: 'owner',
      canEdit: true,
      canManage: true,
    })
    mockRequireDemosEditor.mockReturnValue({
      band: {id: 'band-1', name: 'Demo Band', slug: 'demo-band', status: 'draft'},
      role: 'owner',
      canEdit: true,
      canManage: true,
    })
    mockEnsureGeneralPlaylist.mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614174001',
    })
    mockStorageFrom.mockReturnValue({
      createSignedUploadUrl: vi.fn().mockResolvedValue({
        data: {
          token: 'signed-token-1',
        },
        error: null,
      }),
      info: vi.fn().mockResolvedValue({
        data: {name: 'demo-nueva.wav'},
        error: null,
      }),
      remove: vi.fn().mockResolvedValue({error: null}),
      upload: vi.fn().mockResolvedValue({error: null}),
    })
    mockRequireDemosAdminClient.mockReturnValue({
      storage: {
        from: mockStorageFrom,
      },
      from: vi.fn(),
    })
  })

  it('creates a signed upload target for direct uploads', {timeout: 15_000}, async () => {
    const {createBandTrackUpload} = await import('./tracks')
    const result = await createBandTrackUpload('user-1', 'band-1', {
      fileName: 'demo-nueva.wav',
      mimeType: 'audio/wav',
      fileSizeBytes: 128,
    })

    expect(mockStorageFrom).toHaveBeenCalledWith('band-demos')
    expect(result.ok).toBe(true)
    expect(result.upload?.storagePath).toContain('band-1')
    expect(result.upload?.token).toBe('signed-token-1')
  })

  it('always links the finalized direct upload to General and also to the chosen custom playlist', async () => {
    const playlistTrackInserts: Array<{playlist_id: string; track_id: string; sort_order: number}> = []
    mockCreateClient.mockResolvedValue(createDatabaseMock(playlistTrackInserts))

    const {completeBandTrackUpload} = await import('./tracks')
    await completeBandTrackUpload(
      'user-1',
      'band-1',
      {
        title: 'Demo nueva',
        trackType: 'demo',
        trackStatus: 'nuevo',
        isDownloadable: true,
        durationSeconds: 1,
        playlistId: '123e4567-e89b-12d3-a456-426614174000',
        upload: {
          trackId: '123e4567-e89b-12d3-a456-426614174099',
          storagePath: 'band-1/123e4567-e89b-12d3-a456-426614174099/demo-nueva.wav',
          originalFileName: 'demo-nueva.wav',
          mimeType: 'audio/wav',
          fileSizeBytes: 128,
        },
      },
      {
        ip: null,
        requestId: 'req-1',
        userAgent: 'Vitest',
      }
    )

    expect(playlistTrackInserts).toHaveLength(2)
    expect(playlistTrackInserts[0]).toMatchObject({
      playlist_id: '123e4567-e89b-12d3-a456-426614174001',
      sort_order: 1,
    })
    expect(playlistTrackInserts[1]).toMatchObject({
      playlist_id: '123e4567-e89b-12d3-a456-426614174000',
      sort_order: 1,
    })
    expect(playlistTrackInserts[0]?.track_id).toBeTruthy()
    expect(playlistTrackInserts[1]?.track_id).toBe(playlistTrackInserts[0]?.track_id)
  })

  it('keeps the legacy multipart upload path working', async () => {
    const playlistTrackInserts: Array<{playlist_id: string; track_id: string; sort_order: number}> = []
    mockCreateClient.mockResolvedValue(createDatabaseMock(playlistTrackInserts))

    const formData = new FormData()
    formData.set('title', 'Demo nueva')
    formData.set('trackType', 'demo')
    formData.set('trackStatus', 'nuevo')
    formData.set('isDownloadable', 'true')
    formData.set('durationSeconds', '1')
    formData.set('playlistId', '123e4567-e89b-12d3-a456-426614174000')
    formData.set('file', new File(['demo'], 'demo-nueva.wav', {type: 'audio/wav'}))

    const {uploadBandTrack} = await import('./tracks')
    await uploadBandTrack('user-1', 'band-1', formData, {
      ip: null,
      requestId: 'req-1',
      userAgent: 'Vitest',
    })

    expect(playlistTrackInserts).toHaveLength(2)
    expect(playlistTrackInserts[0]?.playlist_id).toBe('123e4567-e89b-12d3-a456-426614174001')
    expect(playlistTrackInserts[1]?.playlist_id).toBe('123e4567-e89b-12d3-a456-426614174000')
  })
})
