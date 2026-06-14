import {describe, expect, it} from 'vitest'

import {trackUploadSchema} from './demos'

describe('trackUploadSchema', () => {
  it('accepts an empty playlist id as undefined', () => {
    const parsed = trackUploadSchema.parse({
      title: 'Demo nueva',
      description: '',
      relatedSongTitle: '',
      trackType: 'demo',
      trackStatus: 'nuevo',
      isDownloadable: true,
      durationSeconds: null,
      playlistId: '',
    })

    expect(parsed.playlistId).toBeUndefined()
  })

  it('accepts a valid playlist id', () => {
    const parsed = trackUploadSchema.parse({
      title: 'Demo nueva',
      description: '',
      relatedSongTitle: '',
      trackType: 'demo',
      trackStatus: 'nuevo',
      isDownloadable: true,
      durationSeconds: 180,
      playlistId: '123e4567-e89b-12d3-a456-426614174000',
    })

    expect(parsed.playlistId).toBe('123e4567-e89b-12d3-a456-426614174000')
  })
})
