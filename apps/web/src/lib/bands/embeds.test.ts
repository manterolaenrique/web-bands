import {describe, expect, it} from 'vitest'

import {resolveSpotifyEmbedUrl, resolveYouTubeEmbedUrl} from '@/lib/bands/embeds'

describe('resolveYouTubeEmbedUrl', () => {
  it('converts watch urls to embeds', () => {
    expect(resolveYouTubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0'
    )
  })

  it('converts short urls to embeds', () => {
    expect(resolveYouTubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0'
    )
  })

  it('converts shorts urls to embeds', () => {
    expect(resolveYouTubeEmbedUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0'
    )
  })

  it('returns null for invalid urls', () => {
    expect(resolveYouTubeEmbedUrl('https://example.com/video')).toBeNull()
    expect(resolveYouTubeEmbedUrl('not-a-url')).toBeNull()
  })
})

describe('resolveSpotifyEmbedUrl', () => {
  it('converts track urls to embeds', () => {
    expect(resolveSpotifyEmbedUrl('https://open.spotify.com/track/123abc')).toEqual({
      embedUrl: 'https://open.spotify.com/embed/track/123abc?utm_source=generator',
      type: 'track',
      id: '123abc',
    })
  })

  it('converts album, playlist and artist urls to embeds', () => {
    expect(resolveSpotifyEmbedUrl('https://open.spotify.com/album/abc123')?.type).toBe('album')
    expect(resolveSpotifyEmbedUrl('https://open.spotify.com/playlist/abc123')?.type).toBe('playlist')
    expect(resolveSpotifyEmbedUrl('https://open.spotify.com/artist/abc123')?.type).toBe('artist')
  })

  it('accepts spotify urls with intl locale segments', () => {
    expect(
      resolveSpotifyEmbedUrl(
        'https://open.spotify.com/intl-es/artist/64z7A5fKuQxahck2t1vLtr?si=QgJApHCMRaq38afFQS8MCg'
      )
    ).toEqual({
      embedUrl: 'https://open.spotify.com/embed/artist/64z7A5fKuQxahck2t1vLtr?utm_source=generator',
      type: 'artist',
      id: '64z7A5fKuQxahck2t1vLtr',
    })

    expect(
      resolveSpotifyEmbedUrl(
        'https://open.spotify.com/intl-es/album/2N1ulJHFZnoMyrMOjnrjtC?si=ZIsBCPzRSzeDLkQ1tsXD0w'
      )
    ).toEqual({
      embedUrl: 'https://open.spotify.com/embed/album/2N1ulJHFZnoMyrMOjnrjtC?utm_source=generator',
      type: 'album',
      id: '2N1ulJHFZnoMyrMOjnrjtC',
    })
  })

  it('returns null for unsupported or invalid spotify urls', () => {
    expect(resolveSpotifyEmbedUrl('https://open.spotify.com/user/someone')).toBeNull()
    expect(resolveSpotifyEmbedUrl('https://example.com/playlist/demo')).toBeNull()
    expect(resolveSpotifyEmbedUrl('not-a-url')).toBeNull()
  })
})
