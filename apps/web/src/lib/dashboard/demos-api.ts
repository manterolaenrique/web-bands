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

export type PlaylistMutationResponse = {
  ok?: boolean
  playlist?: unknown
  message?: string
  errors?: DemoApiValidationIssue[]
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

async function parseJson<T>(response: Response) {
  return (await response.json().catch(() => null)) as T | null
}

export async function uploadDemoTrackRequest(bandId: string, formData: FormData) {
  const response = await fetch(`/api/dashboard/bands/${bandId}/demos`, {
    method: 'POST',
    body: formData,
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

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<PlaylistMutationResponse>(response),
  } satisfies DemosApiEnvelope<PlaylistMutationResponse>
}

export async function deletePlaylistRequest(bandId: string, playlistId: string) {
  const response = await fetch(`/api/dashboard/bands/${bandId}/demos/playlists/${playlistId}`, {
    method: 'DELETE',
  })

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

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<{ok?: boolean; message?: string}>(response),
  } satisfies DemosApiEnvelope<{ok?: boolean; message?: string}>
}
