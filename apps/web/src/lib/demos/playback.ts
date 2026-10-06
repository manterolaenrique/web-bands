import type {BandAudioTrackSummary, PlaybackQueueItem, PlaybackSourceContext} from '@web-bands/bands-domain'

export type DashboardPlaybackQueueItem = PlaybackQueueItem & {
  detailHref: string
}

export type DashboardPlaybackSourceMeta = {
  sourceHref?: string | null
  sourceLabel?: string | null
}

export type PlaybackTrackLike = Pick<
  BandAudioTrackSummary,
  'id' | 'bandId' | 'title' | 'durationSeconds' | 'trackType'
>

export function buildTrackDetailHref(
  bandId: string,
  trackId: string,
  source?: PlaybackSourceContext | null
) {
  const detailPath = `/dashboard/bands/${bandId}/demos/${trackId}`
  if (!source) {
    return detailPath
  }

  const params = new URLSearchParams()
  if (source.sourceType === 'playlist' && source.sourceId) {
    params.set('playlistId', source.sourceId)
  } else if (source.sourceType === 'demos_list' || source.sourceType === 'featured') {
    params.set('source', 'demos')
  }

  const query = params.toString()
  return query ? `${detailPath}?${query}` : detailPath
}

export function toPlaybackQueueItem(
  track: PlaybackTrackLike,
  source?: PlaybackSourceContext | null
): DashboardPlaybackQueueItem {
  return {
    id: track.id,
    bandId: track.bandId,
    title: track.title,
    durationSeconds: track.durationSeconds,
    trackType: track.trackType,
    detailHref: buildTrackDetailHref(track.bandId, track.id, source),
  }
}

export function buildPlaybackSession(
  tracks: PlaybackTrackLike[],
  trackId: string,
  source: PlaybackSourceContext
) {
  const queue = tracks.map((track) => toPlaybackQueueItem(track, source))
  const currentIndex = Math.max(
    0,
    queue.findIndex((track) => track.id === trackId)
  )

  return {
    queue,
    currentIndex,
    sourceType: source.sourceType,
    sourceId: source.sourceId || null,
  }
}
