'use client'

import {createContext, useContext, useEffect, useRef, useState, type ReactNode} from 'react'

import type {PlaybackSession, PlaybackSourceContext} from '@web-bands/bands-domain'

import {createTrackAccessRequest} from '@/lib/dashboard/demos-api'
import type {DashboardPlaybackQueueItem} from '@/lib/demos/playback'

type DashboardPlaybackSession = PlaybackSession & {
  queue: DashboardPlaybackQueueItem[]
}

type DashboardAudioContextValue = {
  session: DashboardPlaybackSession | null
  currentTrack: DashboardPlaybackQueueItem | null
  isPlaying: boolean
  isLoading: boolean
  error: string | null
  currentTime: number
  duration: number
  speed: number
  prepareTrack: (track: DashboardPlaybackQueueItem) => Promise<string>
  playSession: (session: DashboardPlaybackSession) => Promise<void>
  togglePlayPause: () => Promise<void>
  seekBy: (seconds: number) => void
  playNext: () => Promise<void>
  setSpeed: (value: number) => void
}

const DashboardAudioContext = createContext<DashboardAudioContextValue | null>(null)

export function DashboardAudioProvider({children}: {children: ReactNode}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sessionRef = useRef<DashboardPlaybackSession | null>(null)
  const sourceCacheRef = useRef(new Map<string, {url: string; expiresAt: number}>())
  const sourceRequestRef = useRef(new Map<string, Promise<string>>())
  const requestIdRef = useRef(0)

  const [session, setSession] = useState<DashboardPlaybackSession | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeedState] = useState(1)

  const currentTrack = session?.queue[session.currentIndex] || null

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoaded = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    const handlePause = () => setIsPlaying(false)
    const handlePlay = () => setIsPlaying(true)
    const handleEnded = () => {
      const activeSession = sessionRef.current
      if (!activeSession || activeSession.currentIndex >= activeSession.queue.length - 1) {
        setIsPlaying(false)
        return
      }

      void playSessionInternal({
        ...activeSession,
        currentIndex: activeSession.currentIndex + 1,
      })
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoaded)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoaded)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.playbackRate = speed
    }
  }, [speed])

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
      return await request
    } finally {
      sourceRequestRef.current.delete(track.id)
    }
  }

  async function prepareTrack(track: DashboardPlaybackQueueItem) {
    const cached = sourceCacheRef.current.get(track.id)
    if (cached && cached.expiresAt > Date.now() + 30_000) {
      return cached.url
    }

    return ensureSource(track)
  }

  async function playSessionInternal(nextSession: DashboardPlaybackSession) {
    const audio = audioRef.current
    const nextTrack = nextSession.queue[nextSession.currentIndex]
    if (!audio || !nextTrack) {
      return
    }

    const requestId = ++requestIdRef.current
    setError(null)
    setIsLoading(true)
    sessionRef.current = nextSession
    setSession(nextSession)
    setCurrentTime(0)
    setDuration(nextTrack.durationSeconds || 0)

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
      audio.playbackRate = speed
      await audio.play()
      setIsPlaying(true)
    } catch (playError) {
      if (requestId !== requestIdRef.current) {
        return
      }

      setError(playError instanceof Error ? playError.message : 'No se pudo reproducir el audio.')
      setIsPlaying(false)
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }

  async function playSession(sessionInput: DashboardPlaybackSession) {
    await playSessionInternal(sessionInput)
  }

  async function togglePlayPause() {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    if (!sessionRef.current) {
      return
    }

    if (!audio.src && currentTrack) {
      await playSessionInternal(sessionRef.current)
      return
    }

    try {
      await audio.play()
      setIsPlaying(true)
    } catch {
      setError('No se pudo reanudar el audio.')
    }
  }

  async function playNext() {
    const activeSession = sessionRef.current
    if (!activeSession || activeSession.currentIndex >= activeSession.queue.length - 1) {
      return
    }

    await playSessionInternal({
      ...activeSession,
      currentIndex: activeSession.currentIndex + 1,
    })
  }

  function seekBy(seconds: number) {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const nextTime = Math.max(0, Math.min(audio.duration || audio.currentTime + seconds, audio.currentTime + seconds))
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  function setSpeed(value: number) {
    setSpeedState(value)
    const audio = audioRef.current
    if (audio) {
      audio.playbackRate = value
    }
  }

  return (
    <DashboardAudioContext.Provider
      value={{
        session,
        currentTrack,
        isPlaying,
        isLoading,
        error,
        currentTime,
        duration,
        speed,
        prepareTrack,
        playSession,
        togglePlayPause,
        seekBy,
        playNext,
        setSpeed,
      }}
    >
      <audio ref={audioRef} data-dashboard-audio="true" preload="metadata" />
      {children}
    </DashboardAudioContext.Provider>
  )
}

export function useDashboardAudio() {
  const context = useContext(DashboardAudioContext)
  if (!context) {
    throw new Error('useDashboardAudio must be used within DashboardAudioProvider.')
  }

  return context
}

export function createDashboardPlaybackSession(
  queue: DashboardPlaybackQueueItem[],
  currentIndex: number,
  source: PlaybackSourceContext
): DashboardPlaybackSession {
  return {
    queue,
    currentIndex,
    sourceType: source.sourceType,
    sourceId: source.sourceId || null,
  }
}
