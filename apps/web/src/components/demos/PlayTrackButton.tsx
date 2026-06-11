'use client'

import {useRouter} from 'next/navigation'
import {useState, type ButtonHTMLAttributes, type ReactNode} from 'react'

import type {PlaybackSourceContext} from '@web-bands/bands-domain'

import {buildPlaybackSession, toPlaybackQueueItem, type PlaybackTrackLike} from '@/lib/demos/playback'

import {createDashboardPlaybackSession, useDashboardAudio} from './DashboardAudioProvider'
import {useTapAction} from './useTapAction'

type PlayTrackButtonProps = {
  tracks: PlaybackTrackLike[]
  trackId: string
  source: PlaybackSourceContext
  navigateHref?: string
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick' | 'type'>

export function PlayTrackButton({
  tracks,
  trackId,
  source,
  navigateHref,
  children,
  disabled,
  onMouseEnter,
  onPointerDown,
  onTouchStart,
  ...buttonProps
}: PlayTrackButtonProps) {
  const router = useRouter()
  const {playSession, prepareTrack} = useDashboardAudio()
  const [isPending, setIsPending] = useState(false)
  const activeTrack = tracks.find((track) => track.id === trackId) || null

  function prewarmTrack() {
    if (!activeTrack) {
      return
    }

    void prepareTrack(toPlaybackQueueItem(activeTrack)).catch(() => {
      // The provider keeps the playback error state for the real tap/click path.
    })
  }

  async function handleActivate() {
    setIsPending(true)

    try {
      const session = buildPlaybackSession(tracks, trackId, source)
      await playSession(createDashboardPlaybackSession(session.queue, session.currentIndex, source))

      if (navigateHref) {
        router.push(navigateHref)
      }
    } catch {
      // Provider exposes the playback error state when access or playback fails.
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
        onMouseEnter?.(event)
        prewarmTrack()
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        prewarmTrack()
      }}
      onTouchStart={(event) => {
        onTouchStart?.(event)
        prewarmTrack()
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
      {children}
    </button>
  )
}
