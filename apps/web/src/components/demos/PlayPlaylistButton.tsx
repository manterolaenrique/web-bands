'use client'

import {useState, type ButtonHTMLAttributes, type ReactNode} from 'react'

import {LoadingSpinner} from '@/components/ui/LoadingSpinner'
import {getPlaylistDetailRequest, prewarmPlaylistDetailRequest} from '@/lib/dashboard/demos-api'
import {toPlaybackQueueItem} from '@/lib/demos/playback'

import {createDashboardPlaybackSession, useDashboardAudioControls} from './DashboardAudioProvider'
import {useTapAction} from './useTapAction'

type PlayPlaylistButtonProps = {
  bandId: string
  playlistId: string
  sourceHref?: string | null
  sourceLabel?: string | null
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick' | 'type'>

export function PlayPlaylistButton({
  bandId,
  playlistId,
  sourceHref,
  sourceLabel,
  children,
  disabled,
  ...buttonProps
}: PlayPlaylistButtonProps) {
  const {playSession} = useDashboardAudioControls()
  const [isPending, setIsPending] = useState(false)

  function prewarmPlaylist() {
    prewarmPlaylistDetailRequest(bandId, playlistId)
  }

  async function handleActivate() {
    setIsPending(true)

    try {
      const response = await getPlaylistDetailRequest(bandId, playlistId)
      const tracks = response.body?.tracks?.map((item) => item.track) || []

      if (!response.ok || tracks.length === 0) {
        return
      }

      await playSession(
        createDashboardPlaybackSession(
          tracks.map((track) => toPlaybackQueueItem(track, {sourceType: 'playlist', sourceId: playlistId})),
          0,
          {sourceType: 'playlist', sourceId: playlistId},
          {
            sourceHref,
            sourceLabel,
          }
        )
      )
    } finally {
      setIsPending(false)
    }
  }

  const tapAction = useTapAction<HTMLButtonElement>(() => {
    void handleActivate()
  })

  return (
    <button
      {...buttonProps}
      type="button"
      disabled={disabled || isPending}
      aria-busy={isPending}
      onMouseEnter={(event) => {
        buttonProps.onMouseEnter?.(event)
        prewarmPlaylist()
      }}
      onPointerDown={(event) => {
        buttonProps.onPointerDown?.(event)
        prewarmPlaylist()
      }}
      onTouchStart={(event) => {
        buttonProps.onTouchStart?.(event)
        prewarmPlaylist()
      }}
      onTouchEnd={(event) => {
        buttonProps.onTouchEnd?.(event)
        if (!event.defaultPrevented) {
          tapAction.onTouchEnd(event)
        }
      }}
      onClick={(event) => {
        if (!event.defaultPrevented) {
          tapAction.onClick(event)
        }
      }}
    >
      {isPending ? <LoadingSpinner size="sm" label="Cargando playlist" className="button__spinner" /> : null}
      {children}
    </button>
  )
}
