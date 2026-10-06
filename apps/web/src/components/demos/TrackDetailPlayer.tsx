'use client'

import {useEffect, useEffectEvent, useMemo, useState} from 'react'

import type {
  BandAudioPlaylistSummary,
  BandAudioTrackDetail,
  BandAudioTrackSummary,
  PlaybackSourceContext,
} from '@web-bands/bands-domain'

import {usePendingNavigation} from '@/components/ui/usePendingNavigation'
import {createTrackAccessRequest, getDemoTrackDetailRequest} from '@/lib/dashboard/demos-api'
import {buildPlaybackSession, toPlaybackQueueItem} from '@/lib/demos/playback'
import {formatCompactDate, formatFileSize, formatTrackDuration, getTrackStatusLabel, getTrackTypeLabel} from '@/lib/demos/format'

import {
  createDashboardPlaybackSession,
  useDashboardAudioControls,
  useDashboardAudioSelector,
} from './DashboardAudioProvider'
import {AddToPlaylistSheet} from './AddToPlaylistSheet'
import {
  DownloadIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  PlaylistIcon,
  SkipNextIcon,
  SkipPreviousIcon,
} from './DemoIcons'
import {useTapAction} from './useTapAction'

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5] as const

function triggerDownload(url: string, fileName: string) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
}

export function TrackDetailPlayer({
  bandId,
  track,
  playlists,
  queueTracks,
  source,
  sourceHref,
  sourceLabel,
}: {
  bandId: string
  track: BandAudioTrackDetail
  playlists: BandAudioPlaylistSummary[]
  queueTracks?: BandAudioTrackSummary[]
  source?: PlaybackSourceContext
  sourceHref?: string | null
  sourceLabel?: string | null
}) {
  const navigation = usePendingNavigation()
  const [actionError, setActionError] = useState<string | null>(null)
  const [displayTrack, setDisplayTrack] = useState(track)
  const canPlayNext = useDashboardAudioSelector((state) => state.canPlayNext)
  const canPlayPrevious = useDashboardAudioSelector((state) => state.canPlayPrevious)
  const currentTime = useDashboardAudioSelector((state) => state.currentTime)
  const currentTrack = useDashboardAudioSelector((state) => state.currentTrack)
  const duration = useDashboardAudioSelector((state) => state.duration)
  const error = useDashboardAudioSelector((state) => state.error)
  const isLoading = useDashboardAudioSelector((state) => state.isLoading)
  const isPlaying = useDashboardAudioSelector((state) => state.isPlaying)
  const isTransitioningTrack = useDashboardAudioSelector((state) => state.isTransitioningTrack)
  const speed = useDashboardAudioSelector((state) => state.speed)
  const {playNext, playPrevious, playSession, prepareTrack, setSpeed, togglePlayPause} = useDashboardAudioControls()

  const resolvedQueue = useMemo(() => (queueTracks?.length ? queueTracks : [track]), [queueTracks, track])
  const resolvedSource = useMemo(
    () => source || ({sourceType: 'track_detail' as const, sourceId: track.id}),
    [source, track.id]
  )
  const queuedCurrentTrack = currentTrack && resolvedQueue.some((item) => item.id === currentTrack.id) ? currentTrack : null
  const playbackTargetId = queuedCurrentTrack?.id || displayTrack.id
  const playbackTarget =
    resolvedQueue.find((queueTrack) => queueTrack.id === playbackTargetId) || displayTrack
  const isDisplayTrackActive = currentTrack?.id === displayTrack.id

  const replaceTrackRoute = useEffectEvent((href: string, title: string) => {
    navigation.replace(href, {scroll: false}, `Abriendo ${title}...`)
  })

  useEffect(() => {
    if (!queuedCurrentTrack || queuedCurrentTrack.id === displayTrack.id) {
      return
    }

    let isCancelled = false

    replaceTrackRoute(queuedCurrentTrack.detailHref, queuedCurrentTrack.title)

    void getDemoTrackDetailRequest(bandId, queuedCurrentTrack.id).then((response) => {
      if (!response.ok || !response.body || isCancelled) {
        return
      }

      setDisplayTrack(response.body)
    })

    return () => {
      isCancelled = true
    }
  }, [bandId, displayTrack.id, queuedCurrentTrack])

  const progress = useMemo(() => {
    const activeDuration = isDisplayTrackActive ? duration : displayTrack.durationSeconds || 0
    const activeCurrentTime = isDisplayTrackActive ? currentTime : 0
    if (!activeDuration || activeDuration <= 0) {
      return 0
    }

    return Math.min(100, (activeCurrentTime / activeDuration) * 100)
  }, [currentTime, displayTrack.durationSeconds, duration, isDisplayTrackActive])

  async function handlePlayToggle() {
    if (queuedCurrentTrack) {
      await togglePlayPause()
      return
    }

    const session = buildPlaybackSession(resolvedQueue, displayTrack.id, resolvedSource)
    await playSession(
      createDashboardPlaybackSession(session.queue, session.currentIndex, resolvedSource, {
        sourceHref,
        sourceLabel,
      })
    )
  }

  const visibleCurrentTime = isDisplayTrackActive ? currentTime : 0
  const visibleDuration = isDisplayTrackActive ? duration : displayTrack.durationSeconds || 0
  const visibleError = error
  const playTap = useTapAction<HTMLButtonElement>(() => {
    void handlePlayToggle()
  })
  const previousTap = useTapAction<HTMLButtonElement>(() => {
    void playPrevious()
  })
  const nextTap = useTapAction<HTMLButtonElement>(() => {
    void playNext()
  })
  const sourceTap = useTapAction<HTMLButtonElement>(() => {
    if (sourceHref) {
      navigation.push(sourceHref, undefined, sourceLabel ? `Abriendo ${sourceLabel}...` : 'Abriendo...')
    }
  })

  useEffect(() => {
    void prepareTrack(toPlaybackQueueItem(playbackTarget, resolvedSource)).catch(() => {
      // The first explicit tap still surfaces errors from the provider if access fails.
    })
  }, [playbackTarget, prepareTrack, resolvedSource])

  return (
    <div className="demos-player-card">
      <div className="demos-player-card__hero">
        <div>
          <div className="pill-row">
            <span className="pill">{getTrackTypeLabel(displayTrack.trackType)}</span>
            <span className="pill pill--muted">{getTrackStatusLabel(displayTrack.trackStatus)}</span>
          </div>
          <h2>{displayTrack.title}</h2>
          <p>{displayTrack.relatedSongTitle || 'Audio privado de la banda'}</p>
        </div>

        <div className="demos-player-card__meta">
          <span>{formatCompactDate(displayTrack.createdAt)}</span>
          <span>{formatTrackDuration(displayTrack.durationSeconds)}</span>
        </div>
      </div>

      <div className="demos-player-card__wave">
        {Array.from({length: 40}).map((_, index) => (
          <span
            key={index}
            style={{
              height: `${24 + ((index * 13) % 58)}%`,
              opacity: index / 40 <= progress / 100 ? 1 : 0.28,
            }}
          />
        ))}
      </div>

      <div className="demos-player-card__progress">
        <div className="demos-player-card__progress-bar">
          <span style={{width: `${progress}%`}} />
        </div>
        <div className="demos-player-card__progress-copy">
          <span>{formatTrackDuration(Math.round(visibleCurrentTime))}</span>
          <span>{formatTrackDuration(Math.round(visibleDuration))}</span>
        </div>
      </div>

      <div className="demos-player-card__controls">
        <button
          className="demos-player-card__secondary-button"
          type="button"
          disabled={!canPlayPrevious}
          onTouchEnd={previousTap.onTouchEnd}
          onClick={previousTap.onClick}
        >
          <SkipPreviousIcon />
        </button>
        <button
          className="demos-player-card__play-button"
          type="button"
          disabled={isTransitioningTrack}
          onPointerDown={() => {
            void prepareTrack(toPlaybackQueueItem(playbackTarget, resolvedSource)).catch(() => {
              // Playback errors stay in the shared provider state.
            })
          }}
          onTouchStart={() => {
            void prepareTrack(toPlaybackQueueItem(playbackTarget, resolvedSource)).catch(() => {
              // Playback errors stay in the shared provider state.
            })
          }}
          onTouchEnd={playTap.onTouchEnd}
          onClick={playTap.onClick}
        >
          {queuedCurrentTrack && isPlaying ? <PauseCircleIcon /> : <PlayCircleIcon />}
        </button>
        <button
          className="demos-player-card__secondary-button"
          type="button"
          disabled={!canPlayNext}
          onTouchEnd={nextTap.onTouchEnd}
          onClick={nextTap.onClick}
        >
          <SkipNextIcon />
        </button>
      </div>

      <div className="demos-player-card__speeds">
        {SPEED_OPTIONS.map((option) => (
          <button
            key={option}
            className={`demos-player-card__speed${speed === option ? ' demos-player-card__speed--active' : ''}`}
            type="button"
            onClick={() => setSpeed(option)}
          >
            {option}x
          </button>
        ))}
      </div>

      <div className="demos-player-card__actions">
        {sourceHref && sourceLabel ? (
          <button
            className="button button--ghost"
            type="button"
            onTouchEnd={sourceTap.onTouchEnd}
            onClick={sourceTap.onClick}
          >
            <PlaylistIcon />
            {sourceLabel}
          </button>
        ) : null}
        <AddToPlaylistSheet
          bandId={bandId}
          trackId={displayTrack.id}
          playlists={playlists}
          trigger={
            <button className="button" type="button">
              <PlaylistIcon />
              Agregar a playlist
            </button>
          }
        />
        {displayTrack.canDownload ? (
          <button
            className="button button--ghost"
            type="button"
            onClick={async () => {
              const response = await createTrackAccessRequest(bandId, displayTrack.id, 'download')
              if (!response.ok || !response.body?.access) {
                setActionError(response.body?.message || 'No se pudo preparar la descarga.')
                return
              }

              triggerDownload(response.body.access.url, response.body.access.fileName)
            }}
          >
            <DownloadIcon />
            Descargar
          </button>
        ) : null}
      </div>

      <div className="demos-track-meta-grid">
        <div>
          <span>Subido por</span>
          <strong>{displayTrack.uploadedByName || 'Integrante de la banda'}</strong>
        </div>
        <div>
          <span>Fecha</span>
          <strong>{formatCompactDate(displayTrack.createdAt)}</strong>
        </div>
        <div>
          <span>Tipo</span>
          <strong>{getTrackTypeLabel(displayTrack.trackType)}</strong>
        </div>
        <div>
          <span>Archivo</span>
          <strong>{formatFileSize(displayTrack.fileSizeBytes)}</strong>
        </div>
      </div>

      {displayTrack.description ? (
        <div className="demos-notes-card">
          <h3>Notas</h3>
          <p>{displayTrack.description}</p>
        </div>
      ) : null}

      {isTransitioningTrack && queuedCurrentTrack ? (
        <div className="status status--warning">Cambiando a {queuedCurrentTrack.title}...</div>
      ) : isLoading && queuedCurrentTrack ? (
        <div className="status status--warning">Preparando audio privado...</div>
      ) : null}
      {visibleError ? <div className="status status--error">{visibleError}</div> : null}
      {actionError ? <div className="status status--error">{actionError}</div> : null}
    </div>
  )
}
