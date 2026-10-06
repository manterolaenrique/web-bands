'use client'

import type {
  BandSetlistEditorPayload,
  BandSetlistPrintFontPreset,
  BandSetlistPrintPayload,
  BandSetlistsHubPayload,
  BandSongLibraryItem,
  BandSetlistDetail,
  BandSetlistItem,
} from '@web-bands/bands-domain'

type SetlistsApiEnvelope<T> = {
  ok: boolean
  status: number
  body: T | null
}

export type SetlistsValidationIssue = {
  path: string
  message: string
}

type MutationResponse<T> = {
  ok?: boolean
  message?: string
  errors?: SetlistsValidationIssue[]
} & T

async function parseJson<T>(response: Response) {
  return (await response.json().catch(() => null)) as T | null
}

async function sendJson<T>(url: string, method: string, input?: unknown) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: input === undefined ? undefined : JSON.stringify(input),
  })

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<T>(response),
  } satisfies SetlistsApiEnvelope<T>
}

export async function getSetlistsHubPayloadRequest(bandId: string) {
  return sendJson<BandSetlistsHubPayload & {message?: string}>(`/api/dashboard/bands/${bandId}/setlists`, 'GET')
}

export async function getSetlistEditorPayloadRequest(bandId: string, setlistId: string) {
  return sendJson<BandSetlistEditorPayload & {message?: string}>(
    `/api/dashboard/bands/${bandId}/setlists/${setlistId}`,
    'GET'
  )
}

export async function getSetlistPrintPayloadRequest(bandId: string, setlistId: string) {
  return sendJson<BandSetlistPrintPayload & {message?: string}>(
    `/api/dashboard/bands/${bandId}/setlists/${setlistId}/print`,
    'GET'
  )
}

export async function createSongLibraryItemRequest(
  bandId: string,
  input: {
    title: string
    defaultNotes?: string
    defaultDurationSeconds?: number | null
  }
) {
  return sendJson<MutationResponse<{song?: BandSongLibraryItem}>>(
    `/api/dashboard/bands/${bandId}/setlists/library`,
    'POST',
    input
  )
}

export async function updateSongLibraryItemRequest(
  bandId: string,
  songId: string,
  input: {
    title: string
    defaultNotes?: string
    defaultDurationSeconds?: number | null
  }
) {
  return sendJson<MutationResponse<{song?: BandSongLibraryItem}>>(
    `/api/dashboard/bands/${bandId}/setlists/library/${songId}`,
    'PATCH',
    input
  )
}

export async function deleteSongLibraryItemRequest(bandId: string, songId: string) {
  return sendJson<MutationResponse<Record<string, never>>>(
    `/api/dashboard/bands/${bandId}/setlists/library/${songId}`,
    'DELETE'
  )
}

export async function createSetlistRequest(
  bandId: string,
  input: {
    title?: string
    showDate: string
    venueName: string
    location?: string
    pressLogoAssetId?: string
    printFontPreset?: BandSetlistPrintFontPreset
    printAllCaps?: boolean
    linkedShowKey?: string
  }
) {
  return sendJson<MutationResponse<{setlist?: BandSetlistDetail | unknown}>>(
    `/api/dashboard/bands/${bandId}/setlists`,
    'POST',
    input
  )
}

export async function updateSetlistRequest(
  bandId: string,
  setlistId: string,
  input: {
    title?: string
    showDate: string
    venueName: string
    location?: string
    pressLogoAssetId?: string
    printFontPreset?: BandSetlistPrintFontPreset
    printAllCaps?: boolean
    linkedShowKey?: string
  }
) {
  return sendJson<MutationResponse<{setlist?: BandSetlistDetail}>>(
    `/api/dashboard/bands/${bandId}/setlists/${setlistId}`,
    'PATCH',
    input
  )
}

export async function deleteSetlistRequest(bandId: string, setlistId: string) {
  return sendJson<MutationResponse<Record<string, never>>>(
    `/api/dashboard/bands/${bandId}/setlists/${setlistId}`,
    'DELETE'
  )
}

export async function duplicateSetlistRequest(bandId: string, setlistId: string) {
  return sendJson<MutationResponse<{setlist?: unknown}>>(
    `/api/dashboard/bands/${bandId}/setlists/${setlistId}/duplicate`,
    'POST'
  )
}

export async function createSetlistItemRequest(
  bandId: string,
  setlistId: string,
  input:
    | {
        itemType: 'song'
        songId: string
        notesOverride?: string
        insertIndex?: number
      }
    | {
        itemType: 'block'
        blockLabel: string
        notesOverride?: string
        insertIndex?: number
      }
) {
  return sendJson<MutationResponse<{item?: BandSetlistItem}>>(
    `/api/dashboard/bands/${bandId}/setlists/${setlistId}/items`,
    'POST',
    input
  )
}

export async function updateSetlistItemRequest(
  bandId: string,
  setlistId: string,
  itemId: string,
  input: {
    songId?: string
    blockLabel?: string
    notesOverride?: string
  }
) {
  return sendJson<MutationResponse<{item?: BandSetlistItem}>>(
    `/api/dashboard/bands/${bandId}/setlists/${setlistId}/items/${itemId}`,
    'PATCH',
    input
  )
}

export async function deleteSetlistItemRequest(bandId: string, setlistId: string, itemId: string) {
  return sendJson<MutationResponse<Record<string, never>>>(
    `/api/dashboard/bands/${bandId}/setlists/${setlistId}/items/${itemId}`,
    'DELETE'
  )
}

export async function reorderSetlistItemsRequest(bandId: string, setlistId: string, orderedItemIds: string[]) {
  return sendJson<MutationResponse<Record<string, never>>>(
    `/api/dashboard/bands/${bandId}/setlists/${setlistId}/items/order`,
    'PATCH',
    {orderedItemIds}
  )
}
