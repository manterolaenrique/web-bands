'use client'

import {cloneElement, isValidElement, useState, useTransition, type ReactElement, type MouseEvent, type ReactNode} from 'react'

import type {BandAudioPlaylistSummary} from '@web-bands/bands-domain'

import {InlineButtonSpinner} from '@/components/ui/InlineButtonSpinner'
import {addTrackToPlaylistRequest} from '@/lib/dashboard/demos-api'

export function AddToPlaylistSheet({
  bandId,
  trackId,
  playlists,
  trigger,
  onAdded,
}: {
  bandId: string
  trackId: string
  playlists: BandAudioPlaylistSummary[]
  trigger: ReactNode
  onAdded?: (playlistId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [pendingPlaylistId, setPendingPlaylistId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const availablePlaylists = playlists.filter((playlist) => !playlist.isLocked)

  function openSheet() {
    setError(null)
    setIsOpen(true)
  }

  const triggerNode = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<{onClick?: (event: MouseEvent<HTMLElement>) => void}>, {
        onClick: (event: MouseEvent<HTMLElement>) => {
          const originalOnClick = (
            (trigger as ReactElement<{onClick?: (event: MouseEvent<HTMLElement>) => void}>).props
          ).onClick
          originalOnClick?.(event)
          if (!event.defaultPrevented) {
            openSheet()
          }
        },
      })
    : (
        <button className="demos-sheet__trigger" type="button" onClick={openSheet}>
          {trigger}
        </button>
      )

  return (
    <>
      {triggerNode}

      {isOpen ? (
        <div className="demos-sheet" role="dialog" aria-modal="true" aria-label="Agregar a playlist">
          <button className="demos-sheet__backdrop" type="button" onClick={() => setIsOpen(false)} />
          <div className="demos-sheet__panel">
            <div className="demos-sheet__handle" aria-hidden="true" />
            <div className="demos-sheet__header">
              <div>
                <p className="eyebrow">Playlists</p>
                <h2>Agregar a playlist</h2>
              </div>
            </div>

            {availablePlaylists.length === 0 ? (
              <div className="status status--warning">No hay playlists adicionales disponibles.</div>
            ) : (
              <div className="demos-sheet__list">
                {availablePlaylists.map((playlist) => (
                  <button
                    key={playlist.id}
                    className="demos-sheet__list-item"
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      startTransition(async () => {
                        setPendingPlaylistId(playlist.id)
                        const response = await addTrackToPlaylistRequest(bandId, playlist.id, trackId)

                        if (!response.ok) {
                          setError(response.body?.message || 'No se pudo agregar a la playlist.')
                          setPendingPlaylistId(null)
                          return
                        }

                        setIsOpen(false)
                        setPendingPlaylistId(null)
                        onAdded?.(playlist.id)
                      })
                    }}
                  >
                    <span>
                      <strong>{playlist.title}</strong>
                      <small>{playlist.trackCount} audios</small>
                    </span>
                    <span>
                      {isPending && pendingPlaylistId === playlist.id ? (
                        <InlineButtonSpinner label="Agregando..." />
                      ) : (
                        'Agregar'
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {error ? <div className="status status--error">{error}</div> : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
