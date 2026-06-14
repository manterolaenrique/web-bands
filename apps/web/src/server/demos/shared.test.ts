import {describe, expect, it} from 'vitest'

import {sortPlaylistsForDisplay, toPlaylistSummary} from './shared'

describe('toPlaylistSummary', () => {
  it('marks the general playlist as locked', () => {
    const summary = toPlaylistSummary(
      {
        id: 'playlist-general',
        band_id: 'band-1',
        title: 'General',
        description: null,
        cover_storage_bucket: null,
        cover_storage_path: null,
        cover_original_file_name: null,
        created_by: 'user-1',
        created_at: '2026-06-12T10:00:00.000Z',
        updated_at: '2026-06-12T10:00:00.000Z',
        system_key: 'general',
      },
      3,
      null
    )

    expect(summary.systemKey).toBe('general')
    expect(summary.isLocked).toBe(true)
  })
})

describe('sortPlaylistsForDisplay', () => {
  it('keeps General first and sorts the rest by updatedAt desc', () => {
    const playlists = sortPlaylistsForDisplay([
      {id: 'custom-older', systemKey: null, updatedAt: '2026-06-10T10:00:00.000Z'},
      {id: 'general', systemKey: 'general' as const, updatedAt: '2026-06-01T10:00:00.000Z'},
      {id: 'custom-newer', systemKey: null, updatedAt: '2026-06-11T10:00:00.000Z'},
    ])

    expect(playlists.map((playlist) => playlist.id)).toEqual(['general', 'custom-newer', 'custom-older'])
  })
})
