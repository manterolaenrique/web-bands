import type {BandAudioPlaylistSummary, BandAudioTrackSummary} from '@web-bands/bands-domain'

import {PendingLink} from '@/components/ui/PendingLink'
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
  const detailHref = `/dashboard/bands/${bandId}/demos/${track.id}?source=demos`

  return (
    <article className="demos-track-card">
      <div className="demos-track-card__leading">
        <span className="demos-track-card__icon">
          <AudioWaveIcon />
        </span>
        <div className="demos-track-card__copy">
          <h3>
            <PendingLink href={detailHref} pendingLabel={`Abriendo ${track.title}...`}>
              {track.title}
            </PendingLink>
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
          className="demos-track-card__icon-button demos-track-card__action-button"
          aria-label={`Reproducir ${track.title}`}
          tracks={queueTracks}
          trackId={track.id}
          source={{sourceType: 'demos_list'}}
          sourceHref={`/dashboard/bands/${bandId}/demos`}
          sourceLabel="Demos"
        >
          <PlayCircleIcon />
          <span className="demos-track-card__action-label">Reproducir</span>
        </PlayTrackButton>
        <TrackOptionsSheet
          bandId={bandId}
          track={track}
          detailHref={detailHref}
          playlists={playlists}
          canEdit={canEdit}
          queueTracks={queueTracks}
          triggerClassName="demos-track-card__icon-button demos-track-card__action-button"
          triggerLabel="Opciones"
        />
      </div>
    </article>
  )
}
