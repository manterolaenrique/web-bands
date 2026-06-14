import {beforeEach, describe, expect, it, vi} from 'vitest'

const mockCreateClient = vi.fn()
const mockWriteAuditLog = vi.fn()
const mockConsumeRateLimit = vi.fn()
const mockGetBandDemosAccess = vi.fn()
const mockRequireDemosEditor = vi.fn()
const mockEnsureGeneralPlaylist = vi.fn()
const mockResolvePlaylistCoverUrlMap = vi.fn()

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
    demosWrite: 'demos-write',
  },
}))

vi.mock('./shared', async () => {
  const actual = await vi.importActual<typeof import('./shared')>('./shared')

  return {
    ...actual,
    getBandDemosAccess: mockGetBandDemosAccess,
    requireDemosEditor: mockRequireDemosEditor,
    ensureGeneralPlaylist: mockEnsureGeneralPlaylist,
    resolvePlaylistCoverUrlMap: mockResolvePlaylistCoverUrlMap,
  }
})

describe('demos playlists services', () => {
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
      id: 'playlist-general',
    })
    mockResolvePlaylistCoverUrlMap.mockResolvedValue(new Map())
  })

  it('ensures General exists and returns it first in getBandPlaylists', async () => {
    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'band_audio_playlists') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'playlist-custom',
                      band_id: 'band-1',
                      title: 'Ensayo jueves',
                      description: null,
                      cover_storage_bucket: null,
                      cover_storage_path: null,
                      cover_original_file_name: null,
                      created_by: 'user-1',
                      created_at: '2026-06-10T10:00:00.000Z',
                      updated_at: '2026-06-11T10:00:00.000Z',
                      system_key: null,
                    },
                    {
                      id: 'playlist-general',
                      band_id: 'band-1',
                      title: 'General',
                      description: null,
                      cover_storage_bucket: null,
                      cover_storage_path: null,
                      cover_original_file_name: null,
                      created_by: 'user-1',
                      created_at: '2026-06-09T10:00:00.000Z',
                      updated_at: '2026-06-09T10:00:00.000Z',
                      system_key: 'general',
                    },
                  ],
                  error: null,
                }),
              })),
            })),
          }
        }

        if (table === 'band_audio_playlist_tracks') {
          return {
            select: vi.fn(() => ({
              in: vi.fn().mockResolvedValue({
                data: [
                  {playlist_id: 'playlist-general'},
                  {playlist_id: 'playlist-custom'},
                  {playlist_id: 'playlist-custom'},
                ],
              }),
            })),
          }
        }

        throw new Error(`Unexpected table ${table}`)
      }),
    })

    const {getBandPlaylists} = await import('./playlists')
    const result = await getBandPlaylists('user-1', 'band-1')

    expect(mockEnsureGeneralPlaylist).toHaveBeenCalledWith('band-1', 'user-1')
    expect(result.playlists.map((playlist) => playlist.id)).toEqual(['playlist-general', 'playlist-custom'])
    expect(result.playlists[0]).toMatchObject({
      systemKey: 'general',
      isLocked: true,
    })
  })

  it('blocks manual updates for the General playlist', async () => {
    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'band_audio_playlists') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'playlist-general',
                      band_id: 'band-1',
                      title: 'General',
                      description: null,
                      cover_storage_bucket: null,
                      cover_storage_path: null,
                      cover_original_file_name: null,
                      created_by: 'user-1',
                      created_at: '2026-06-09T10:00:00.000Z',
                      updated_at: '2026-06-09T10:00:00.000Z',
                      system_key: 'general',
                    },
                    error: null,
                  }),
                })),
              })),
            })),
          }
        }

        throw new Error(`Unexpected table ${table}`)
      }),
    })

    const {updateBandPlaylist} = await import('./playlists')

    await expect(
      updateBandPlaylist(
        'user-1',
        'band-1',
        'playlist-general',
        {
          title: 'General',
          description: '',
          coverAction: 'keep',
        },
        {
          ip: null,
          requestId: 'req-1',
          userAgent: 'Vitest',
        }
      )
    ).rejects.toMatchObject({
      status: 403,
      message: 'La playlist General se administra automaticamente.',
    })
  })
})
