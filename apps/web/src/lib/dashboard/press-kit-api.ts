'use client'

import type {
  BandPressKitPayload,
  BandPrivateAsset,
  BandPrivateAssetShareLinkResponse,
  PressKitSharePreset,
} from '@web-bands/bands-domain'

import {createClient} from '@/lib/supabase/browser'

type PressKitApiEnvelope<T> = {
  ok: boolean
  status: number
  body: T | null
}

export type PressKitValidationIssue = {
  path: string
  message: string
}

export type PressKitSaveResponse = {
  ok?: boolean
  band?: {
    id: string
    slug: string
    sanityDocumentId: string
    syncedAt?: string
  }
  message?: string
  errors?: PressKitValidationIssue[]
}

export type PressKitAssetUploadStartResponse = {
  ok?: boolean
  upload?: {
    assetId: string
    storagePath: string
    token: string
  }
  message?: string
  errors?: PressKitValidationIssue[]
}

export type PressKitAssetMutationResponse = {
  ok?: boolean
  asset?: BandPrivateAsset
  message?: string
  errors?: PressKitValidationIssue[]
}

async function parseJson<T>(response: Response) {
  return (await response.json().catch(() => null)) as T | null
}

export async function updatePressKitRequest(
  bandId: string,
  input: {
    shortPitch?: string
    bioShort?: string
    bioLong?: string
    shareNotes?: string
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    bookingNotes?: string
    keyLinks: Array<{
      _key: string
      label: string
      url: string
      kind: 'press' | 'demo' | 'drive' | 'instagram' | 'spotify' | 'youtube' | 'other'
    }>
  }
) {
  const response = await fetch(`/api/dashboard/bands/${bandId}/press-kit`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<PressKitSaveResponse>(response),
  } satisfies PressKitApiEnvelope<PressKitSaveResponse>
}

async function createPressKitUploadRequest(
  bandId: string,
  input: {
    kind: 'logo'
    label: string
    fileName: string
    mimeType: string
    fileSizeBytes: number
  }
) {
  const response = await fetch(`/api/dashboard/bands/${bandId}/press-kit/uploads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<PressKitAssetUploadStartResponse>(response),
  } satisfies PressKitApiEnvelope<PressKitAssetUploadStartResponse>
}

export async function uploadPressKitAssetRequest(
  bandId: string,
  input: {
    label: string
    file: File
  },
  options?: {
    onPhaseChange?: (phase: 'preparing' | 'uploading' | 'finalizing') => void
  }
) {
  options?.onPhaseChange?.('preparing')
  const uploadStart = await createPressKitUploadRequest(bandId, {
    kind: 'logo',
    label: input.label,
    fileName: input.file.name,
    mimeType: input.file.type,
    fileSizeBytes: input.file.size,
  })

  if (!uploadStart.ok || !uploadStart.body?.upload) {
    return {
      ok: false,
      status: uploadStart.status,
      body: {
        message: uploadStart.body?.message || 'No se pudo preparar la subida del logo.',
        errors: uploadStart.body?.errors,
      },
    } satisfies PressKitApiEnvelope<PressKitAssetMutationResponse>
  }

  options?.onPhaseChange?.('uploading')
  const supabase = createClient()
  const {error: uploadError} = await supabase.storage
    .from('band-press-assets')
    .uploadToSignedUrl(uploadStart.body.upload.storagePath, uploadStart.body.upload.token, input.file, {
      contentType: input.file.type,
      upsert: false,
    })

  if (uploadError) {
    return {
      ok: false,
      status: 503,
      body: {
        message: uploadError.message || 'No se pudo subir el logo a storage.',
      },
    } satisfies PressKitApiEnvelope<PressKitAssetMutationResponse>
  }

  options?.onPhaseChange?.('finalizing')
  const response = await fetch(`/api/dashboard/bands/${bandId}/press-kit/assets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      kind: 'logo',
      label: input.label,
      upload: {
        assetId: uploadStart.body.upload.assetId,
        storagePath: uploadStart.body.upload.storagePath,
        originalFileName: input.file.name,
        mimeType: input.file.type,
        fileSizeBytes: input.file.size,
      },
    }),
  })

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<PressKitAssetMutationResponse>(response),
  } satisfies PressKitApiEnvelope<PressKitAssetMutationResponse>
}

export async function deletePressKitAssetRequest(bandId: string, assetId: string) {
  const response = await fetch(`/api/dashboard/bands/${bandId}/press-kit/assets/${assetId}`, {
    method: 'DELETE',
  })

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<{ok?: boolean; message?: string}>(response),
  } satisfies PressKitApiEnvelope<{ok?: boolean; message?: string}>
}

export async function createPressKitShareLinkRequest(
  bandId: string,
  assetId: string,
  preset: PressKitSharePreset = '24h'
) {
  const response = await fetch(`/api/dashboard/bands/${bandId}/press-kit/assets/${assetId}/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({preset}),
  })

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<BandPrivateAssetShareLinkResponse & {message?: string}>(
      response
    ),
  } satisfies PressKitApiEnvelope<BandPrivateAssetShareLinkResponse & {message?: string}>
}

export async function getPressKitPayloadRequest(bandId: string) {
  const response = await fetch(`/api/dashboard/bands/${bandId}/press-kit`)

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<BandPressKitPayload & {message?: string}>(response),
  } satisfies PressKitApiEnvelope<BandPressKitPayload & {message?: string}>
}
