'use client'

import {usePendingNavigation} from '@/components/ui/usePendingNavigation'
import {formatTrackDuration, getTrackTypeLabel} from '@/lib/demos/format'

import {useDashboardAudioControls, useDashboardAudioSelector} from './DashboardAudioProvider'
import {ChevronRightIcon, PauseCircleIcon, PlayCircleIcon, PlaylistIcon} from './DemoIcons'
import {useTapAction} from './useTapAction'

export function MiniPlayer() {
  const navigation = usePendingNavigation()
  const currentTrack = useDashboardAudioSelector((state) => state.currentTrack)
  const canPlayNext = useDashboardAudioSelector((state) => state.canPlayNext)
  const error = useDashboardAudioSelector((state) => state.error)
  const isLoading = useDashboardAudioSelector((state) => state.isLoading)
  const isPlaying = useDashboardAudioSelector((state) => state.isPlaying)
  const isTransitioningTrack = useDashboardAudioSelector((state) => state.isTransitioningTrack)
  const sourceHref = useDashboardAudioSelector((state) => state.sourceHref)
  const sourceLabel = useDashboardAudioSelector((state) => state.sourceLabel)
  const sourceType = useDashboardAudioSelector((state) => state.sourceType)
  const {playNext, togglePlayPause} = useDashboardAudioControls()
  const openTrackTap = useTapAction<HTMLButtonElement>(() => {
    navigation.push(currentTrack!.detailHref)
  })
  const toggleTap = useTapAction<HTMLButtonElement>(() => {
    void togglePlayPause()
  })
  const nextTap = useTapAction<HTMLButtonElement>(() => {
    void playNext()
  })
  const sourceTap = useTapAction<HTMLButtonElement>(() => {
    if (sourceHref) {
      navigation.push(sourceHref)
    }
  })
  const isNavigating = navigation.isPending

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
        <span className="demos-mini-player__eyebrow">
          {sourceLabel || getTrackTypeLabel(currentTrack.trackType)}
        </span>
        <strong className="demos-mini-player__title">{currentTrack.title}</strong>
        <small className="demos-mini-player__meta">
          {isNavigating
            ? 'Abriendo detalle...'
            : isTransitioningTrack || isLoading
              ? 'Cambiando de cancion...'
              : `${getTrackTypeLabel(currentTrack.trackType)} Â· ${formatTrackDuration(currentTrack.durationSeconds)}`}
        </small>
      </button>

      <div className="demos-mini-player__actions">
        {sourceType === 'playlist' && sourceHref ? (
          <button
            className="demos-mini-player__control"
            type="button"
            aria-label={`Ir a ${sourceLabel || 'la playlist'}`}
            disabled={isNavigating}
            onTouchEnd={sourceTap.onTouchEnd}
            onClick={sourceTap.onClick}
          >
            <PlaylistIcon />
          </button>
        ) : null}
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
          disabled={!canPlayNext}
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
