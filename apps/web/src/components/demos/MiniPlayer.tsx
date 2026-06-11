'use client'

import {useRouter} from 'next/navigation'

import {formatTrackDuration, getTrackTypeLabel} from '@/lib/demos/format'

import {useDashboardAudio} from './DashboardAudioProvider'
import {ChevronRightIcon, PauseCircleIcon, PlayCircleIcon} from './DemoIcons'
import {useTapAction} from './useTapAction'

export function MiniPlayer() {
  const router = useRouter()
  const {currentTrack, isLoading, isPlaying, error, playNext, togglePlayPause} = useDashboardAudio()
  const openTrackTap = useTapAction<HTMLButtonElement>(() => {
    router.push(currentTrack!.detailHref)
  })
  const toggleTap = useTapAction<HTMLButtonElement>(() => {
    void togglePlayPause()
  })
  const nextTap = useTapAction<HTMLButtonElement>(() => {
    void playNext()
  })

  if (!currentTrack) {
    return null
  }

  return (
    <div className="demos-mini-player" data-testid="demos-mini-player">
      <button
        className="demos-mini-player__summary"
        type="button"
        onTouchEnd={openTrackTap.onTouchEnd}
        onClick={openTrackTap.onClick}
      >
        <span className="demos-mini-player__eyebrow">{getTrackTypeLabel(currentTrack.trackType)}</span>
        <strong className="demos-mini-player__title">{currentTrack.title}</strong>
        <small className="demos-mini-player__meta">
          {isLoading ? 'Preparando audio...' : formatTrackDuration(currentTrack.durationSeconds)}
        </small>
      </button>

      <div className="demos-mini-player__actions">
        <button
          className="demos-mini-player__control"
          type="button"
          aria-label={isPlaying ? 'Pausar audio' : 'Reanudar audio'}
          onTouchEnd={toggleTap.onTouchEnd}
          onClick={toggleTap.onClick}
        >
          {isPlaying ? <PauseCircleIcon /> : <PlayCircleIcon />}
        </button>
        <button
          className="demos-mini-player__control"
          type="button"
          aria-label="Siguiente audio"
          onTouchEnd={nextTap.onTouchEnd}
          onClick={nextTap.onClick}
        >
          <ChevronRightIcon />
        </button>
      </div>

      {error ? <div className="demos-mini-player__error">{error}</div> : null}
    </div>
  )
}
