'use client'
import {useState, useTransition} from 'react'

import type {BandAudioPlaylistTrack} from '@web-bands/bands-domain'

import {InlineButtonSpinner} from '@/components/ui/InlineButtonSpinner'
import {PendingLink} from '@/components/ui/PendingLink'
import {removeTrackFromPlaylistRequest, reorderPlaylistTracksRequest} from '@/lib/dashboard/demos-api'
import {formatTrackDuration, getTrackTypeLabel} from '@/lib/demos/format'

import {ChevronRightIcon, PlayCircleIcon} from './DemoIcons'
import {PlayTrackButton} from './PlayTrackButton'

export function PlaylistTracksManager({
  bandId,
  playlistId,
  playlistTitle,
  tracks,
  canEdit,
  isLocked,
  onTracksChange,
}: {
  bandId: string
  playlistId: string
  playlistTitle: string
  tracks: BandAudioPlaylistTrack[]
  canEdit: boolean
  isLocked: boolean
  onTracksChange?: (tracks: BandAudioPlaylistTrack[]) => void
}) {
  const [orderedTracks, setOrderedTracks] = useState(tracks)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const syncOrder = (nextTracks: BandAudioPlaylistTrack[]) => {
    const previousTracks = orderedTracks
    setOrderedTracks(nextTracks)
    onTracksChange?.(nextTracks)
    startTransition(async () => {
      const response = await reorderPlaylistTracksRequest(
        bandId,
        playlistId,
        nextTracks.map((track) => track.track.id)
      )

      if (!response.ok) {
        setError(response.body?.message || 'No se pudo reordenar la playlist.')
        setOrderedTracks(previousTracks)
        onTracksChange?.(previousTracks)
        return
      }
    })
  }

  return (
    <div className="demos-playlist-tracks">
      {orderedTracks.map((item, index) => (
        <article className="demos-playlist-track-row" key={item.id}>
          <div className="demos-playlist-track-row__order">
            <span>{index + 1}</span>
          </div>
          <div className="demos-playlist-track-row__main">
            <PlayTrackButton
              className="demos-playlist-track-row__play"
              aria-label={`Reproducir ${item.track.title}`}
              tracks={orderedTracks.map((entry) => entry.track)}
              trackId={item.track.id}
              source={{sourceType: 'playlist', sourceId: playlistId}}
              sourceHref={`/dashboard/bands/${bandId}/demos/playlists/${playlistId}`}
              sourceLabel={playlistTitle}
            >
              <PlayCircleIcon />
            </PlayTrackButton>
            <div>
              <strong>{item.track.title}</strong>
              <small>
                {getTrackTypeLabel(item.track.trackType)} · {formatTrackDuration(item.track.durationSeconds)}
              </small>
            </div>
          </div>
          <div className="demos-playlist-track-row__actions">
            <PendingLink
              href={`/dashboard/bands/${bandId}/demos/${item.track.id}?playlistId=${playlistId}`}
              className="demos-track-card__icon-button"
              aria-label={`Abrir ${item.track.title}`}
              pendingLabel={`Abriendo ${item.track.title}...`}
            >
              <ChevronRightIcon />
            </PendingLink>
            {canEdit && !isLocked ? (
              <>
                <button
                  className="button"
                  type="button"
                  disabled={isPending || index === 0}
                  onClick={() => {
                    const next = [...orderedTracks]
                    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                    syncOrder(next)
                  }}
                >
                  Subir
                </button>
                <button
                  className="button"
                  type="button"
                  disabled={isPending || index === orderedTracks.length - 1}
                  onClick={() => {
                    const next = [...orderedTracks]
                    ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
                    syncOrder(next)
                  }}
                >
                  Bajar
                </button>
                <button
                  className="button button--danger"
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    const previousTracks = orderedTracks
                    const nextTracks = previousTracks.filter((entry) => entry.id !== item.id)
                    setOrderedTracks(nextTracks)
                    onTracksChange?.(nextTracks)
                    startTransition(async () => {
                      const response = await removeTrackFromPlaylistRequest(
                        bandId,
                        playlistId,
                        item.track.id
                      )

                      if (!response.ok) {
                        setError(response.body?.message || 'No se pudo quitar el track.')
                        setOrderedTracks(previousTracks)
                        onTracksChange?.(previousTracks)
                        return
                      }
                    })
                  }}
                >
                  {isPending ? <InlineButtonSpinner label="Guardando..." /> : 'Quitar'}
                </button>
              </>
            ) : null}
          </div>
        </article>
      ))}

      {error ? <div className="status status--error">{error}</div> : null}
      {isPending ? <div className="status status--warning">Sincronizando cambios de la playlist...</div> : null}
    </div>
  )
}
