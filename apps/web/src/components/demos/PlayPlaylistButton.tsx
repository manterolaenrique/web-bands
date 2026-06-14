'use client'

import {useState, type ButtonHTMLAttributes, type ReactNode} from 'react'

import {getPlaylistDetailRequest} from '@/lib/dashboard/demos-api'
import {toPlaybackQueueItem} from '@/lib/demos/playback'

import {createDashboardPlaybackSession, useDashboardAudio} from './DashboardAudioProvider'
import {useTapAction} from './useTapAction'

type PlayPlaylistButtonProps = {
  bandId: string
  playlistId: string
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick' | 'type'>

export function PlayPlaylistButton({
  bandId,
  playlistId,
  children,
  disabled,
  ...buttonProps
}: PlayPlaylistButtonProps) {
  const {playSession} = useDashboardAudio()
  const [isPending, setIsPending] = useState(false)

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
          tracks.map((track) => toPlaybackQueueItem(track)),
          0,
          {sourceType: 'playlist', sourceId: playlistId}
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
      {children}
    </button>
  )
}
