import type {BandAudioTrackSummary, PlaybackQueueItem, PlaybackSourceContext} from '@web-bands/bands-domain'

export type DashboardPlaybackQueueItem = PlaybackQueueItem & {
  detailHref: string
}

export type PlaybackTrackLike = Pick<
  BandAudioTrackSummary,
  'id' | 'bandId' | 'title' | 'durationSeconds' | 'trackType'
>

export function toPlaybackQueueItem(track: PlaybackTrackLike): DashboardPlaybackQueueItem {
  return {
    id: track.id,
    bandId: track.bandId,
    title: track.title,
    durationSeconds: track.durationSeconds,
    trackType: track.trackType,
    detailHref: `/dashboard/bands/${track.bandId}/demos/${track.id}`,
  }
}

export function buildPlaybackSession(
  tracks: PlaybackTrackLike[],
  trackId: string,
  source: PlaybackSourceContext
) {
  const queue = tracks.map((track) => toPlaybackQueueItem(track))
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
