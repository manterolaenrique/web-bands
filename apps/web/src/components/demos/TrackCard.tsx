import Link from 'next/link'

import type {BandAudioPlaylistSummary, BandAudioTrackSummary} from '@web-bands/bands-domain'

import {formatCompactDate, formatTrackDuration, getTrackTypeLabel} from '@/lib/demos/format'

import {AudioWaveIcon, PlayCircleIcon} from './DemoIcons'
import {PlayTrackButton} from './PlayTrackButton'
import {TrackOptionsSheet} from './TrackOptionsSheet'

export function TrackCard({
  bandId,
  track,
  playlists,
  canEdit,
  queueTracks,
}: {
  bandId: string
  track: BandAudioTrackSummary
  playlists: BandAudioPlaylistSummary[]
  canEdit: boolean
  queueTracks: BandAudioTrackSummary[]
}) {
  const detailHref = `/dashboard/bands/${bandId}/demos/${track.id}`

  return (
    <article className="demos-track-card">
      <div className="demos-track-card__leading">
        <span className="demos-track-card__icon">
          <AudioWaveIcon />
        </span>
        <div className="demos-track-card__copy">
          <h3>
            <Link href={detailHref}>{track.title}</Link>
          </h3>
          <div className="demos-track-card__meta">
            <span className="demos-track-chip">{getTrackTypeLabel(track.trackType)}</span>
            <span>
              {formatTrackDuration(track.durationSeconds)} · {formatCompactDate(track.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="demos-track-card__actions">
        <PlayTrackButton
          className="demos-track-card__icon-button"
          aria-label={`Reproducir ${track.title}`}
          tracks={queueTracks}
          trackId={track.id}
          source={{sourceType: 'demos_list'}}
        >
          <PlayCircleIcon />
        </PlayTrackButton>
        <TrackOptionsSheet
          bandId={bandId}
          track={track}
          detailHref={detailHref}
          playlists={playlists}
          canEdit={canEdit}
          queueTracks={queueTracks}
        />
      </div>
    </article>
  )
}
