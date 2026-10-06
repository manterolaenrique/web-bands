'use client'

import {createContext, useContext, useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode} from 'react'

import type {PlaybackSession, PlaybackSourceContext, PlaybackSourceType} from '@web-bands/bands-domain'

import {createTrackAccessRequest} from '@/lib/dashboard/demos-api'
import type {DashboardPlaybackQueueItem, DashboardPlaybackSourceMeta} from '@/lib/demos/playback'
import {markClientMetric, recordClientMetric, recordMeasuredClientMetric} from '@/lib/performance/client-metrics'

type DashboardPlaybackSession = PlaybackSession &
  DashboardPlaybackSourceMeta & {
    queue: DashboardPlaybackQueueItem[]
  }

type DashboardAudioSnapshot = {
  session: DashboardPlaybackSession | null
  currentTrack: DashboardPlaybackQueueItem | null
  isPlaying: boolean
  isLoading: boolean
  isTransitioningTrack: boolean
  error: string | null
  currentTime: number
  duration: number
  speed: number
  sourceHref: string | null
  sourceLabel: string | null
  sourceType: PlaybackSourceType | null
  canPlayPrevious: boolean
  canPlayNext: boolean
}

type DashboardAudioControls = {
  prepareTrack: (track: DashboardPlaybackQueueItem) => Promise<string>
  playSession: (session: DashboardPlaybackSession) => Promise<void>
  togglePlayPause: () => Promise<void>
  playPrevious: () => Promise<void>
  seekBy: (seconds: number) => void
  playNext: () => Promise<void>
  setSpeed: (value: number) => void
}

type DashboardAudioStore = {
  getSnapshot: () => DashboardAudioSnapshot
  subscribe: (listener: () => void) => () => void
  setState: (
    updater:
      | Partial<DashboardAudioSnapshot>
      | ((state: DashboardAudioSnapshot) => Partial<DashboardAudioSnapshot>)
  ) => void
}

type DashboardAudioContextValue = {
  controls: DashboardAudioControls
  store: DashboardAudioStore
}

type PlaybackMetricTransition = {
  action: 'play' | 'next' | 'previous' | 'resume'
  startedAt: number
  trackId: string
  trackTitle: string
  queueLength: number
  sourceLabel: string | null
  sourceType: PlaybackSourceType | null
}

const DashboardAudioContext = createContext<DashboardAudioContextValue | null>(null)

function createInitialSnapshot(): DashboardAudioSnapshot {
  return {
    session: null,
    currentTrack: null,
    isPlaying: false,
    isLoading: false,
    isTransitioningTrack: false,
    error: null,
    currentTime: 0,
    duration: 0,
    speed: 1,
    sourceHref: null,
    sourceLabel: null,
    sourceType: null,
    canPlayPrevious: false,
    canPlayNext: false,
  }
}

function buildSessionState(session: DashboardPlaybackSession | null) {
  const currentTrack = session?.queue[session.currentIndex] || null

  return {
    session,
    currentTrack,
    sourceHref: session?.sourceHref || null,
    sourceLabel: session?.sourceLabel || null,
    sourceType: session?.sourceType || null,
    canPlayPrevious: Boolean(session && session.currentIndex > 0),
    canPlayNext: Boolean(session && session.currentIndex < session.queue.length - 1),
  } satisfies Pick<
    DashboardAudioSnapshot,
    'session' | 'currentTrack' | 'sourceHref' | 'sourceLabel' | 'sourceType' | 'canPlayPrevious' | 'canPlayNext'
  >
}

function createDashboardAudioStore(): DashboardAudioStore {
  let state = createInitialSnapshot()
  const listeners = new Set<() => void>()

  return {
    getSnapshot() {
      return state
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    setState(updater) {
      const partial = typeof updater === 'function' ? updater(state) : updater
      let hasChanged = false

      for (const [key, value] of Object.entries(partial)) {
        if (!Object.is(state[key as keyof DashboardAudioSnapshot], value)) {
          hasChanged = true
          break
        }
      }

      if (!hasChanged) {
        return
      }

      state = {
        ...state,
        ...partial,
      }

      listeners.forEach((listener) => listener())
    },
  }
}

export function DashboardAudioProvider({children}: {children: ReactNode}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sessionRef = useRef<DashboardPlaybackSession | null>(null)
  const sourceCacheRef = useRef(new Map<string, {url: string; expiresAt: number}>())
  const sourceRequestRef = useRef(new Map<string, Promise<string>>())
  const requestIdRef = useRef(0)
  const playbackMetricRef = useRef<PlaybackMetricTransition | null>(null)
  const storeRef = useRef<DashboardAudioStore | null>(null)
  const controlsRef = useRef<DashboardAudioControls | null>(null)

  if (!storeRef.current) {
    storeRef.current = createDashboardAudioStore()
  }

  const store = storeRef.current

  function getCachedSource(trackId: string) {
    const cached = sourceCacheRef.current.get(trackId)
    if (cached && cached.expiresAt > Date.now() + 30_000) {
      return cached.url
    }

    return null
  }

  async function ensureSource(track: DashboardPlaybackQueueItem) {
    const cachedUrl = getCachedSource(track.id)
    if (cachedUrl) {
      return cachedUrl
    }

    const pendingRequest = sourceRequestRef.current.get(track.id)
    if (pendingRequest) {
      return pendingRequest
    }

    const requestStartedAt = markClientMetric()
    const request = (async () => {
      const response = await createTrackAccessRequest(track.bandId, track.id, 'stream')
      if (!response.ok || !response.body?.access?.url) {
        throw new Error(response.body?.message || 'No se pudo abrir el audio privado.')
      }

      sourceCacheRef.current.set(track.id, {
        url: response.body.access.url,
        expiresAt: Date.now() + response.body.access.expiresInSeconds * 1000,
      })

      return response.body.access.url
    })()

    sourceRequestRef.current.set(track.id, request)

    try {
      const sourceUrl = await request
      recordMeasuredClientMetric('audio_source_resolved', requestStartedAt, {
        context: {
          bandId: track.bandId,
          trackId: track.id,
        },
      })
      return sourceUrl
    } catch (error) {
      recordMeasuredClientMetric('audio_source_failed', requestStartedAt, {
        context: {
          bandId: track.bandId,
          trackId: track.id,
          message: error instanceof Error ? error.message : 'unknown',
        },
      })
      throw error
    } finally {
      sourceRequestRef.current.delete(track.id)
    }
  }

  async function prepareTrack(track: DashboardPlaybackQueueItem) {
    const cachedUrl = getCachedSource(track.id)
    if (cachedUrl) {
      return cachedUrl
    }

    return ensureSource(track)
  }

  function resolveSessionMove(offset: number) {
    const activeSession = sessionRef.current
    if (!activeSession) {
      return null
    }

    const nextIndex = activeSession.currentIndex + offset
    if (nextIndex < 0 || nextIndex >= activeSession.queue.length) {
      return null
    }

    return {
      ...activeSession,
      currentIndex: nextIndex,
    } satisfies DashboardPlaybackSession
  }

  function beginPlaybackMetric(
    action: PlaybackMetricTransition['action'],
    nextSession: DashboardPlaybackSession,
    nextTrack: DashboardPlaybackQueueItem
  ) {
    playbackMetricRef.current = {
      action,
      startedAt: markClientMetric(),
      trackId: nextTrack.id,
      trackTitle: nextTrack.title,
      queueLength: nextSession.queue.length,
      sourceLabel: nextSession.sourceLabel || null,
      sourceType: nextSession.sourceType,
    }
  }

  function flushPlaybackMetric(name: string, fallbackContext?: Record<string, string | number | boolean | null>) {
    if (!playbackMetricRef.current) {
      return
    }

    const metric = playbackMetricRef.current
    recordMeasuredClientMetric(name, metric.startedAt, {
      context: {
        action: metric.action,
        queueLength: metric.queueLength,
        sourceLabel: metric.sourceLabel,
        sourceType: metric.sourceType,
        trackId: metric.trackId,
        trackTitle: metric.trackTitle,
        ...fallbackContext,
      },
    })
    playbackMetricRef.current = null
  }

  async function playSessionInternal(
    nextSession: DashboardPlaybackSession,
    action: PlaybackMetricTransition['action'] = 'play'
  ) {
    const audio = audioRef.current
    const nextTrack = nextSession.queue[nextSession.currentIndex]
    if (!audio || !nextTrack) {
      return
    }

    beginPlaybackMetric(action, nextSession, nextTrack)
    const requestId = ++requestIdRef.current
    sessionRef.current = nextSession
    store.setState((currentState) => ({
      ...buildSessionState(nextSession),
      error: null,
      isLoading: true,
      isTransitioningTrack: true,
      currentTime: 0,
      duration: nextTrack.durationSeconds || currentState.duration,
    }))

    try {
      const sourceUrl = getCachedSource(nextTrack.id) || (await prepareTrack(nextTrack))
      if (requestId !== requestIdRef.current) {
        return
      }

      if (audio.src !== sourceUrl) {
        audio.src = sourceUrl
        audio.load()
      }

      audio.currentTime = 0
      audio.playbackRate = store.getSnapshot().speed
      await audio.play()
      store.setState({
        isPlaying: true,
      })
    } catch (playError) {
      if (requestId !== requestIdRef.current) {
        return
      }

      flushPlaybackMetric('audio_time_to_failed_playback', {
        message: playError instanceof Error ? playError.message : 'No se pudo reproducir el audio.',
      })
      store.setState({
        error: playError instanceof Error ? playError.message : 'No se pudo reproducir el audio.',
        isPlaying: false,
      })
    } finally {
      if (requestId === requestIdRef.current) {
        store.setState({
          isLoading: false,
          isTransitioningTrack: false,
        })
      }
    }
  }

  async function playSession(nextSession: DashboardPlaybackSession) {
    await playSessionInternal(nextSession, 'play')
  }

  async function togglePlayPause() {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const snapshot = store.getSnapshot()
    if (snapshot.isPlaying) {
      audio.pause()
      store.setState({
        isPlaying: false,
      })
      return
    }

    if (!sessionRef.current) {
      return
    }

    if (!audio.src && snapshot.currentTrack) {
      await playSessionInternal(sessionRef.current)
      return
    }

    try {
      if (snapshot.currentTrack && sessionRef.current) {
        beginPlaybackMetric('resume', sessionRef.current, snapshot.currentTrack)
      }

      await audio.play()
      store.setState({
        isPlaying: true,
      })
    } catch (error) {
      flushPlaybackMetric('audio_time_to_failed_playback', {
        message: error instanceof Error ? error.message : 'No se pudo reanudar el audio.',
      })
      store.setState({
        error: 'No se pudo reanudar el audio.',
      })
    }
  }

  async function playNext() {
    const nextSession = resolveSessionMove(1)
    if (!nextSession) {
      store.setState({
        isPlaying: false,
      })
      return
    }

    await playSessionInternal(nextSession, 'next')
  }

  async function playPrevious() {
    const previousSession = resolveSessionMove(-1)
    if (!previousSession) {
      return
    }

    await playSessionInternal(previousSession, 'previous')
  }

  function seekBy(seconds: number) {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const nextTime = Math.max(0, Math.min(audio.duration || audio.currentTime + seconds, audio.currentTime + seconds))
    audio.currentTime = nextTime
    store.setState({
      currentTime: nextTime,
    })
  }

  function setSpeed(value: number) {
    store.setState({
      speed: value,
    })

    const audio = audioRef.current
    if (audio) {
      audio.playbackRate = value
    }
  }

  if (!controlsRef.current) {
    controlsRef.current = {
      prepareTrack,
      playSession,
      togglePlayPause,
      playPrevious,
      seekBy,
      playNext,
      setSpeed,
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const handleTimeUpdate = () => {
      store.setState({
        currentTime: audio.currentTime,
      })
    }

    const handleLoaded = () => {
      store.setState({
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
      })
    }

    const handlePlaying = () => {
      flushPlaybackMetric('audio_time_to_audible')
    }

    const handlePause = () => {
      store.setState({
        isPlaying: false,
      })
    }

    const handlePlay = () => {
      store.setState({
        isPlaying: true,
      })
    }

    const handleEnded = () => {
      recordClientMetric('audio_track_ended', 1, {
        unit: 'count',
        context: {
          trackId: sessionRef.current?.queue[sessionRef.current.currentIndex]?.id,
        },
      })
      void playNext()
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoaded)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoaded)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [store])

  const contextValue = useMemo(
    () => ({
      controls: controlsRef.current as DashboardAudioControls,
      store,
    }),
    [store]
  )

  return (
    <DashboardAudioContext.Provider value={contextValue}>
      <audio ref={audioRef} data-dashboard-audio="true" preload="metadata" />
      <DashboardAudioEffects />
      {children}
    </DashboardAudioContext.Provider>
  )
}

function DashboardAudioEffects() {
  const controls = useDashboardAudioControls()
  const currentTrack = useDashboardAudioSelector((state) => state.currentTrack)
  const canPlayNext = useDashboardAudioSelector((state) => state.canPlayNext)
  const canPlayPrevious = useDashboardAudioSelector((state) => state.canPlayPrevious)
  const isPlaying = useDashboardAudioSelector((state) => state.isPlaying)
  const session = useDashboardAudioSelector((state) => state.session)
  const sourceLabel = useDashboardAudioSelector((state) => state.sourceLabel)

  useEffect(() => {
    if (!currentTrack) {
      delete document.body.dataset.dashboardPlayer
      return
    }

    document.body.dataset.dashboardPlayer = 'active'
    return () => {
      delete document.body.dataset.dashboardPlayer
    }
  }, [currentTrack])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      return
    }

    const setHandler = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null
    ) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {
        // Some browsers expose Media Session partially and reject unsupported actions.
      }
    }

    setHandler('play', () => {
      void controls.togglePlayPause()
    })
    setHandler('pause', () => {
      void controls.togglePlayPause()
    })
    setHandler('nexttrack', canPlayNext ? () => void controls.playNext() : null)
    setHandler('previoustrack', canPlayPrevious ? () => void controls.playPrevious() : null)

    if (!currentTrack) {
      navigator.mediaSession.metadata = null
      navigator.mediaSession.playbackState = 'none'
      return
    }

    if (typeof MediaMetadata !== 'undefined') {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        album: sourceLabel || 'Demos privados',
      })
    }
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
  }, [canPlayNext, canPlayPrevious, controls, currentTrack, isPlaying, sourceLabel])

  useEffect(() => {
    if (!session) {
      return
    }

    const nextTrack = session.queue[session.currentIndex + 1]
    if (!nextTrack) {
      return
    }

    void controls.prepareTrack(nextTrack).catch(() => {
      // Best-effort prewarm only.
    })
  }, [controls, currentTrack?.id, session])

  return null
}

function useDashboardAudioContext() {
  const context = useContext(DashboardAudioContext)
  if (!context) {
    throw new Error('useDashboardAudio must be used within DashboardAudioProvider.')
  }

  return context
}

export function useDashboardAudioSelector<T>(selector: (state: DashboardAudioSnapshot) => T) {
  const {store} = useDashboardAudioContext()

  return useSyncExternalStore(store.subscribe, () => selector(store.getSnapshot()), () => selector(store.getSnapshot()))
}

export function useDashboardAudioControls() {
  return useDashboardAudioContext().controls
}

export function useDashboardAudioHasCurrentTrack() {
  return useDashboardAudioSelector((state) => state.currentTrack !== null)
}

export function useDashboardAudio() {
  const controls = useDashboardAudioControls()
  const snapshot = useDashboardAudioSelector((state) => state)

  return {
    ...snapshot,
    ...controls,
  }
}

export function createDashboardPlaybackSession(
  queue: DashboardPlaybackQueueItem[],
  currentIndex: number,
  source: PlaybackSourceContext,
  meta?: DashboardPlaybackSourceMeta
): DashboardPlaybackSession {
  return {
    queue,
    currentIndex,
    sourceType: source.sourceType,
    sourceId: source.sourceId || null,
    sourceLabel: meta?.sourceLabel || null,
    sourceHref: meta?.sourceHref || null,
  }
}
