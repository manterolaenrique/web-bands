'use client'

import {useEffect, useMemo, useState} from 'react'

import type {
  BandAudioPlaylistSummary,
  BandAudioTrackDetail,
  BandAudioTrackSummary,
  PlaybackSourceContext,
} from '@web-bands/bands-domain'

import {createTrackAccessRequest} from '@/lib/dashboard/demos-api'
import {buildPlaybackSession, toPlaybackQueueItem} from '@/lib/demos/playback'
import {formatCompactDate, formatFileSize, formatTrackDuration, getTrackStatusLabel, getTrackTypeLabel} from '@/lib/demos/format'

import {createDashboardPlaybackSession, useDashboardAudio} from './DashboardAudioProvider'
import {AddToPlaylistSheet} from './AddToPlaylistSheet'
import {
  BackTenIcon,
  DownloadIcon,
  ForwardTenIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  PlaylistIcon,
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
}: {
  bandId: string
  track: BandAudioTrackDetail
  playlists: BandAudioPlaylistSummary[]
  queueTracks?: BandAudioTrackSummary[]
  source?: PlaybackSourceContext
}) {
  const [actionError, setActionError] = useState<string | null>(null)
  const {
    currentTrack,
    currentTime,
    duration,
    error,
    isLoading,
    isPlaying,
    playNext,
    playSession,
    prepareTrack,
    seekBy,
    setSpeed,
    speed,
    togglePlayPause,
  } = useDashboardAudio()

  const resolvedQueue = queueTracks?.length ? queueTracks : [track]
  const resolvedSource = source || {sourceType: 'track_detail' as const, sourceId: track.id}
  const isActiveTrack = currentTrack?.id === track.id

  const progress = useMemo(() => {
    const activeDuration = isActiveTrack ? duration : track.durationSeconds || 0
    const activeCurrentTime = isActiveTrack ? currentTime : 0
    if (!activeDuration || activeDuration <= 0) {
      return 0
    }

    return Math.min(100, (activeCurrentTime / activeDuration) * 100)
  }, [currentTime, duration, isActiveTrack, track.durationSeconds])

  async function handlePlayToggle() {
    if (isActiveTrack) {
      await togglePlayPause()
      return
    }

    const session = buildPlaybackSession(resolvedQueue, track.id, resolvedSource)
    await playSession(createDashboardPlaybackSession(session.queue, session.currentIndex, resolvedSource))
  }

  const visibleCurrentTime = isActiveTrack ? currentTime : 0
  const visibleDuration = isActiveTrack ? duration : track.durationSeconds || 0
  const visibleError = isActiveTrack ? error : null
  const playTap = useTapAction<HTMLButtonElement>(() => {
    void handlePlayToggle()
  })
  const backTap = useTapAction<HTMLButtonElement>(() => {
    seekBy(-10)
  })
  const nextTap = useTapAction<HTMLButtonElement>(() => {
    void playNext()
  })

  useEffect(() => {
    void prepareTrack(toPlaybackQueueItem(track)).catch(() => {
      // The first explicit tap still surfaces errors from the provider if access fails.
    })
  }, [prepareTrack, track])

  return (
    <div className="demos-player-card">
      <div className="demos-player-card__hero">
        <div>
          <div className="pill-row">
            <span className="pill">{getTrackTypeLabel(track.trackType)}</span>
            <span className="pill pill--muted">{getTrackStatusLabel(track.trackStatus)}</span>
          </div>
          <h2>{track.title}</h2>
          <p>{track.relatedSongTitle || 'Audio privado de la banda'}</p>
        </div>

        <div className="demos-player-card__meta">
          <span>{formatCompactDate(track.createdAt)}</span>
          <span>{formatTrackDuration(track.durationSeconds)}</span>
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
          disabled={!isActiveTrack}
          onTouchEnd={backTap.onTouchEnd}
          onClick={backTap.onClick}
        >
          <BackTenIcon />
        </button>
        <button
          className="demos-player-card__play-button"
          type="button"
          onPointerDown={() => {
            void prepareTrack(toPlaybackQueueItem(track)).catch(() => {
              // Playback errors stay in the shared provider state.
            })
          }}
          onTouchStart={() => {
            void prepareTrack(toPlaybackQueueItem(track)).catch(() => {
              // Playback errors stay in the shared provider state.
            })
          }}
          onTouchEnd={playTap.onTouchEnd}
          onClick={playTap.onClick}
        >
          {isActiveTrack && isPlaying ? <PauseCircleIcon /> : <PlayCircleIcon />}
        </button>
        <button
          className="demos-player-card__secondary-button"
          type="button"
          disabled={!isActiveTrack}
          onTouchEnd={nextTap.onTouchEnd}
          onClick={nextTap.onClick}
        >
          <ForwardTenIcon />
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
        <AddToPlaylistSheet
          bandId={bandId}
          trackId={track.id}
          playlists={playlists}
          trigger={
            <button className="button" type="button">
              <PlaylistIcon />
              Agregar a playlist
            </button>
          }
        />
        {track.canDownload ? (
          <button
            className="button button--ghost"
            type="button"
            onClick={async () => {
              const response = await createTrackAccessRequest(bandId, track.id, 'download')
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
          <strong>{track.uploadedByName || 'Integrante de la banda'}</strong>
        </div>
        <div>
          <span>Fecha</span>
          <strong>{formatCompactDate(track.createdAt)}</strong>
        </div>
        <div>
          <span>Tipo</span>
          <strong>{getTrackTypeLabel(track.trackType)}</strong>
        </div>
        <div>
          <span>Archivo</span>
          <strong>{formatFileSize(track.fileSizeBytes)}</strong>
        </div>
      </div>

      {track.description ? (
        <div className="demos-notes-card">
          <h3>Notas</h3>
          <p>{track.description}</p>
        </div>
      ) : null}

      {isLoading && isActiveTrack ? <div className="status status--warning">Preparando audio privado...</div> : null}
      {visibleError ? <div className="status status--error">{visibleError}</div> : null}
      {actionError ? <div className="status status--error">{actionError}</div> : null}
    </div>
  )
}
