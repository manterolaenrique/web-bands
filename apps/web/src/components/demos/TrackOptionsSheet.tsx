'use client'

import {useRouter} from 'next/navigation'
import {useState, useTransition} from 'react'

import type {BandAudioPlaylistSummary, BandAudioTrackSummary} from '@web-bands/bands-domain'

import {createTrackAccessRequest, deleteDemoTrackRequest} from '@/lib/dashboard/demos-api'
import type {PlaybackTrackLike} from '@/lib/demos/playback'

import {AddToPlaylistSheet} from './AddToPlaylistSheet'
import {DownloadIcon, MoreIcon, PlayCircleIcon, PlaylistIcon} from './DemoIcons'
import {PlayTrackButton} from './PlayTrackButton'
import {ResponsiveTrackOptionsDialog} from './ResponsiveTrackOptionsDialog'
import {useTapAction} from './useTapAction'

function triggerDownload(url: string, fileName: string) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.rel = 'noopener noreferrer'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
}

export function TrackOptionsSheet({
  bandId,
  track,
  detailHref,
  playlists,
  canEdit,
  queueTracks,
}: {
  bandId: string
  track: BandAudioTrackSummary
  detailHref: string
  playlists: BandAudioPlaylistSummary[]
  canEdit: boolean
  queueTracks: PlaybackTrackLike[]
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const openSheetTap = useTapAction<HTMLButtonElement>(() => {
    setError(null)
    setIsOpen(true)
  })

  return (
    <>
      <button
        className="demos-track-card__icon-button"
        type="button"
        aria-label={`Opciones de ${track.title}`}
        aria-haspopup="dialog"
        onTouchEnd={openSheetTap.onTouchEnd}
        onClick={openSheetTap.onClick}
      >
        <MoreIcon />
      </button>

      {isOpen ? (
        <ResponsiveTrackOptionsDialog title={track.title} eyebrow="Demo privado" onClose={() => setIsOpen(false)}>
          <div className="demos-sheet__list">
            <PlayTrackButton
              className="demos-sheet__list-item"
              tracks={queueTracks}
              trackId={track.id}
              source={{sourceType: 'demos_list'}}
              navigateHref={detailHref}
            >
              <span className="demos-sheet__list-item-icon">
                <PlayCircleIcon />
              </span>
              <span>
                <strong>Reproducir</strong>
                <small>Abrir detalle y reproductor</small>
              </span>
            </PlayTrackButton>

            <button
              className="demos-sheet__list-item"
              type="button"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const response = await createTrackAccessRequest(bandId, track.id, 'download')
                  if (!response.ok || !response.body?.access) {
                    setError(response.body?.message || 'No se pudo preparar la descarga.')
                    return
                  }

                  triggerDownload(response.body.access.url, response.body.access.fileName)
                  setIsOpen(false)
                })
              }}
            >
              <span className="demos-sheet__list-item-icon">
                <DownloadIcon />
              </span>
              <span>
                <strong>Descargar</strong>
                <small>Bajar el archivo al celular</small>
              </span>
            </button>

            <AddToPlaylistSheet
              bandId={bandId}
              trackId={track.id}
              playlists={playlists}
              trigger={
                <button className="demos-sheet__list-item" type="button">
                  <span className="demos-sheet__list-item-icon">
                    <PlaylistIcon />
                  </span>
                  <span>
                    <strong>Agregar a playlist</strong>
                    <small>Sumar este audio a una coleccion</small>
                  </span>
                </button>
              }
            />

            <button
              className="demos-sheet__list-item"
              type="button"
              onClick={() => {
                setIsOpen(false)
                router.push(`${detailHref}?sheet=edit`)
              }}
            >
              <span className="demos-sheet__list-item-icon">
                <PlaylistIcon />
              </span>
              <span>
                <strong>Editar informacion</strong>
                <small>Ver notas, tipo y estado</small>
              </span>
            </button>

            {canEdit ? (
              <button
                className="demos-sheet__list-item demos-sheet__list-item--danger"
                type="button"
                disabled={isPending}
                onClick={() => {
                  const confirmed = window.confirm(`Eliminar "${track.title}"?`)
                  if (!confirmed) {
                    return
                  }

                  startTransition(async () => {
                    const response = await deleteDemoTrackRequest(bandId, track.id)
                    if (!response.ok) {
                      setError(response.body?.message || 'No se pudo eliminar el demo.')
                      return
                    }

                    setIsOpen(false)
                    router.refresh()
                  })
                }}
              >
                <span>
                  <strong>Eliminar</strong>
                  <small>Borra metadata y archivo privado</small>
                </span>
              </button>
            ) : null}
          </div>

          {error ? <div className="status status--error">{error}</div> : null}
        </ResponsiveTrackOptionsDialog>
      ) : null}
    </>
  )
}
