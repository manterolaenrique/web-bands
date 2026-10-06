import type {BandAudioPlaylistDetail, BandAudioTrackDetail} from '@web-bands/bands-domain'

import {createClient} from '@/lib/supabase/browser'

export type DemosApiEnvelope<T> = {
  ok: boolean
  status: number
  body: T | null
}

export type DemoApiValidationIssue = {
  path: string
  message: string
}

export type TrackMutationResponse = {
  ok?: boolean
  track?: unknown
  message?: string
  errors?: DemoApiValidationIssue[]
}

export type TrackUploadStartResponse = {
  ok?: boolean
  upload?: {
    trackId: string
    storagePath: string
    token: string
  }
  message?: string
  errors?: DemoApiValidationIssue[]
}

export type PlaylistMutationResponse = {
  ok?: boolean
  playlist?: unknown
  message?: string
  errors?: DemoApiValidationIssue[]
}

export type PlaylistDetailResponse = BandAudioPlaylistDetail & {
  message?: string
}

export type TrackDetailResponse = BandAudioTrackDetail & {
  message?: string
}

export type TrackAccessResponse = {
  ok?: boolean
  access?: {
    url: string
    expiresInSeconds: number
    fileName: string
    mode: 'stream' | 'download'
  }
  message?: string
}

export type PlaylistMutationInput = {
  title: string
  description?: string
  coverAction?: 'keep' | 'remove'
}

const PLAYLIST_DETAIL_CACHE_TTL_MS = 45_000
const playlistDetailCache = new Map<string, {expiresAt: number; response: DemosApiEnvelope<PlaylistDetailResponse>}>()
const playlistDetailRequests = new Map<string, Promise<DemosApiEnvelope<PlaylistDetailResponse>>>()

function getPlaylistDetailCacheKey(bandId: string, playlistId: string) {
  return `${bandId}:${playlistId}`
}

function invalidatePlaylistDetailCache(bandId: string, playlistId: string) {
  const cacheKey = getPlaylistDetailCacheKey(bandId, playlistId)
  playlistDetailCache.delete(cacheKey)
  playlistDetailRequests.delete(cacheKey)
}

async function parseJson<T>(response: Response) {
  return (await response.json().catch(() => null)) as T | null
}

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

function readBoolean(formData: FormData, key: string) {
  const value = formData.get(key)
  return value === 'true' || value === '1' || value === 'on'
}

function readNullableInteger(formData: FormData, key: string) {
  const value = formData.get(key)
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.round(parsed) : null
}

async function createTrackUploadRequest(bandId: string, file: File) {
  const response = await fetch(`/api/dashboard/bands/${bandId}/demos/uploads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
    }),
  })

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<TrackUploadStartResponse>(response),
  } satisfies DemosApiEnvelope<TrackUploadStartResponse>
}

export async function uploadDemoTrackRequest(
  bandId: string,
  formData: FormData,
  options?: {
    onPhaseChange?: (phase: 'preparing' | 'uploading' | 'finalizing') => void
  }
) {
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return {
      ok: false,
      status: 400,
      body: {
        message: 'Audio file is required.',
      },
    } satisfies DemosApiEnvelope<TrackMutationResponse>
  }

  options?.onPhaseChange?.('preparing')
  const uploadStart = await createTrackUploadRequest(bandId, file)
  if (!uploadStart.ok || !uploadStart.body?.upload) {
    return {
      ok: false,
      status: uploadStart.status,
      body: {
        message: uploadStart.body?.message || 'No se pudo preparar la subida del audio.',
        errors: uploadStart.body?.errors,
      },
    } satisfies DemosApiEnvelope<TrackMutationResponse>
  }

  options?.onPhaseChange?.('uploading')
  const supabase = createClient()
  const {error: uploadError} = await supabase.storage
    .from('band-demos')
    .uploadToSignedUrl(uploadStart.body.upload.storagePath, uploadStart.body.upload.token, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return {
      ok: false,
      status: 503,
      body: {
        message: uploadError.message || 'No se pudo subir el audio a storage.',
      },
    } satisfies DemosApiEnvelope<TrackMutationResponse>
  }

  const finalizePayload = {
    title: readOptionalString(formData, 'title'),
    description: readOptionalString(formData, 'description'),
    relatedSongTitle: readOptionalString(formData, 'relatedSongTitle'),
    trackType: readOptionalString(formData, 'trackType'),
    trackStatus: readOptionalString(formData, 'trackStatus'),
    isDownloadable: readBoolean(formData, 'isDownloadable'),
    durationSeconds: readNullableInteger(formData, 'durationSeconds'),
    playlistId: readOptionalString(formData, 'playlistId'),
    upload: {
      trackId: uploadStart.body.upload.trackId,
      storagePath: uploadStart.body.upload.storagePath,
      originalFileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
    },
  }

  options?.onPhaseChange?.('finalizing')
  const response = await fetch(`/api/dashboard/bands/${bandId}/demos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(finalizePayload),
  })

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<TrackMutationResponse>(response),
  } satisfies DemosApiEnvelope<TrackMutationResponse>
}

export async function updateDemoTrackRequest(bandId: string, trackId: string, input: unknown) {
  const response = await fetch(`/api/dashboard/bands/${bandId}/demos/${trackId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<TrackMutationResponse>(response),
  } satisfies DemosApiEnvelope<TrackMutationResponse>
}

export async function deleteDemoTrackRequest(bandId: string, trackId: string) {
  const response = await fetch(`/api/dashboard/bands/${bandId}/demos/${trackId}`, {
    method: 'DELETE',
  })

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<{ok?: boolean; message?: string}>(response),
  } satisfies DemosApiEnvelope<{ok?: boolean; message?: string}>
}

export async function createTrackAccessRequest(
  bandId: string,
  trackId: string,
  mode: 'stream' | 'download'
) {
  const response = await fetch(`/api/dashboard/bands/${bandId}/demos/${trackId}/access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({mode}),
  })

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<TrackAccessResponse>(response),
  } satisfies DemosApiEnvelope<TrackAccessResponse>
}

export async function getDemoTrackDetailRequest(bandId: string, trackId: string) {
  const response = await fetch(`/api/dashboard/bands/${bandId}/demos/${trackId}`)

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<TrackDetailResponse>(response),
  } satisfies DemosApiEnvelope<TrackDetailResponse>
}

export async function createPlaylistRequest(bandId: string, input: FormData | PlaylistMutationInput) {
  const requestInit =
    input instanceof FormData
      ? {
          method: 'POST',
          body: input,
        }
      : {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        }
  const response = await fetch(`/api/dashboard/bands/${bandId}/demos/playlists`, {
    ...requestInit,
  })

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<PlaylistMutationResponse>(response),
  } satisfies DemosApiEnvelope<PlaylistMutationResponse>
}

export async function updatePlaylistRequest(
  bandId: string,
  playlistId: string,
  input: FormData | PlaylistMutationInput
) {
  const requestInit =
    input instanceof FormData
      ? {
          method: 'PATCH',
          body: input,
        }
      : {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        }
  const response = await fetch(`/api/dashboard/bands/${bandId}/demos/playlists/${playlistId}`, {
    ...requestInit,
  })

  if (response.ok) {
    invalidatePlaylistDetailCache(bandId, playlistId)
  }

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<PlaylistMutationResponse>(response),
  } satisfies DemosApiEnvelope<PlaylistMutationResponse>
}

export async function getPlaylistDetailRequest(bandId: string, playlistId: string) {
  const cacheKey = getPlaylistDetailCacheKey(bandId, playlistId)
  const cached = playlistDetailCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.response
  }

  const pendingRequest = playlistDetailRequests.get(cacheKey)
  if (pendingRequest) {
    return pendingRequest
  }

  const request = (async () => {
    const response = await fetch(`/api/dashboard/bands/${bandId}/demos/playlists/${playlistId}`)

    const envelope = {
      ok: response.ok,
      status: response.status,
      body: await parseJson<PlaylistDetailResponse>(response),
    } satisfies DemosApiEnvelope<PlaylistDetailResponse>

    if (envelope.ok && envelope.body) {
      playlistDetailCache.set(cacheKey, {
        expiresAt: Date.now() + PLAYLIST_DETAIL_CACHE_TTL_MS,
        response: envelope,
      })
    }

    return envelope
  })()

  playlistDetailRequests.set(cacheKey, request)

  try {
    return await request
  } finally {
    playlistDetailRequests.delete(cacheKey)
  }
}

export function prewarmPlaylistDetailRequest(bandId: string, playlistId: string) {
  const cacheKey = getPlaylistDetailCacheKey(bandId, playlistId)
  const cached = playlistDetailCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return
  }

  if (playlistDetailRequests.has(cacheKey)) {
    return
  }

  void getPlaylistDetailRequest(bandId, playlistId).catch(() => {
    // The user-facing path handles failures when the playlist is actually played.
  })
}

export async function deletePlaylistRequest(bandId: string, playlistId: string) {
  const response = await fetch(`/api/dashboard/bands/${bandId}/demos/playlists/${playlistId}`, {
    method: 'DELETE',
  })

  if (response.ok) {
    invalidatePlaylistDetailCache(bandId, playlistId)
  }

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<{ok?: boolean; message?: string}>(response),
  } satisfies DemosApiEnvelope<{ok?: boolean; message?: string}>
}

export async function addTrackToPlaylistRequest(bandId: string, playlistId: string, trackId: string) {
  const response = await fetch(`/api/dashboard/bands/${bandId}/demos/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({trackId}),
  })

  if (response.ok) {
    invalidatePlaylistDetailCache(bandId, playlistId)
  }

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<{ok?: boolean; message?: string}>(response),
  } satisfies DemosApiEnvelope<{ok?: boolean; message?: string}>
}

export async function removeTrackFromPlaylistRequest(bandId: string, playlistId: string, trackId: string) {
  const response = await fetch(
    `/api/dashboard/bands/${bandId}/demos/playlists/${playlistId}/tracks/${trackId}`,
    {
      method: 'DELETE',
    }
  )

  if (response.ok) {
    invalidatePlaylistDetailCache(bandId, playlistId)
  }

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<{ok?: boolean; message?: string}>(response),
  } satisfies DemosApiEnvelope<{ok?: boolean; message?: string}>
}

export async function reorderPlaylistTracksRequest(
  bandId: string,
  playlistId: string,
  orderedTrackIds: string[]
) {
  const response = await fetch(
    `/api/dashboard/bands/${bandId}/demos/playlists/${playlistId}/tracks/order`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({orderedTrackIds}),
    }
  )

  if (response.ok) {
    invalidatePlaylistDetailCache(bandId, playlistId)
  }

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<{ok?: boolean; message?: string}>(response),
  } satisfies DemosApiEnvelope<{ok?: boolean; message?: string}>
}
