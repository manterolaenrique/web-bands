export type SpotifyEmbedType = 'track' | 'album' | 'playlist' | 'artist'

export type SpotifyEmbedResult = {
  embedUrl: string
  type: SpotifyEmbedType
  id: string
}

function isYouTubeHost(hostname: string) {
  return hostname === 'youtube.com' || hostname === 'www.youtube.com' || hostname === 'm.youtube.com'
}

function normalizeSpotifyHostname(hostname: string) {
  return hostname.replace(/^www\./, '').toLowerCase()
}

function normalizeSpotifyPathSegments(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)

  if (segments[0]?.startsWith('intl-')) {
    return segments.slice(1)
  }

  return segments
}

export function resolveYouTubeEmbedUrl(url: string | undefined) {
  if (!url) {
    return null
  }

  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()
    let videoId = ''

    if (hostname === 'youtu.be') {
      videoId = parsed.pathname.split('/').filter(Boolean)[0] || ''
    } else if (isYouTubeHost(hostname)) {
      const segments = parsed.pathname.split('/').filter(Boolean)

      if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v') || ''
      } else if (segments[0] === 'shorts' || segments[0] === 'embed' || segments[0] === 'live') {
        videoId = segments[1] || ''
      }
    }

    if (!/^[a-zA-Z0-9_-]{6,}$/.test(videoId)) {
      return null
    }

    return `https://www.youtube.com/embed/${videoId}?rel=0`
  } catch {
    return null
  }
}

export function resolveSpotifyEmbedUrl(url: string | undefined): SpotifyEmbedResult | null {
  if (!url) {
    return null
  }

  try {
    const parsed = new URL(url)
    const hostname = normalizeSpotifyHostname(parsed.hostname)

    if (hostname !== 'open.spotify.com' && hostname !== 'play.spotify.com') {
      return null
    }

    const segments = normalizeSpotifyPathSegments(parsed.pathname)
    const supportedType = segments[0]
    const id = segments[1]

    if (!supportedType || !id) {
      return null
    }

    if (!['track', 'album', 'playlist', 'artist'].includes(supportedType)) {
      return null
    }

    return {
      embedUrl: `https://open.spotify.com/embed/${supportedType}/${id}?utm_source=generator`,
      type: supportedType as SpotifyEmbedType,
      id,
    }
  } catch {
    return null
  }
}
