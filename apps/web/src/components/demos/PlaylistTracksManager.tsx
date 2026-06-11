'use client'

import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useState, useTransition} from 'react'

import type {BandAudioPlaylistTrack} from '@web-bands/bands-domain'

import {removeTrackFromPlaylistRequest, reorderPlaylistTracksRequest} from '@/lib/dashboard/demos-api'
import {formatTrackDuration, getTrackTypeLabel} from '@/lib/demos/format'

import {ChevronRightIcon, PlayCircleIcon} from './DemoIcons'
import {PlayTrackButton} from './PlayTrackButton'

export function PlaylistTracksManager({
  bandId,
  playlistId,
  tracks,
  canEdit,
}: {
  bandId: string
  playlistId: string
  tracks: BandAudioPlaylistTrack[]
  canEdit: boolean
}) {
  const router = useRouter()
  const [orderedTracks, setOrderedTracks] = useState(tracks)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const syncOrder = (nextTracks: BandAudioPlaylistTrack[]) => {
    setOrderedTracks(nextTracks)
    startTransition(async () => {
      const response = await reorderPlaylistTracksRequest(
        bandId,
        playlistId,
        nextTracks.map((track) => track.track.id)
      )

      if (!response.ok) {
        setError(response.body?.message || 'No se pudo reordenar la playlist.')
        setOrderedTracks(tracks)
        return
      }

      router.refresh()
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
            <Link
              href={`/dashboard/bands/${bandId}/demos/${item.track.id}`}
              className="demos-track-card__icon-button"
              aria-label={`Abrir ${item.track.title}`}
            >
              <ChevronRightIcon />
            </Link>
            {canEdit ? (
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
                    startTransition(async () => {
                      const response = await removeTrackFromPlaylistRequest(
                        bandId,
                        playlistId,
                        item.track.id
                      )

                      if (!response.ok) {
                        setError(response.body?.message || 'No se pudo quitar el track.')
                        return
                      }

                      setOrderedTracks((current) => current.filter((entry) => entry.id !== item.id))
                      router.refresh()
                    })
                  }}
                >
                  Quitar
                </button>
              </>
            ) : null}
          </div>
        </article>
      ))}

      {error ? <div className="status status--error">{error}</div> : null}
    </div>
  )
}
