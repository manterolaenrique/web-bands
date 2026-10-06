'use client'

import type {
  BandPressKitPayload,
  BandPrivateAsset,
  BandPrivateAssetKind,
  BandPrivateAssetShareLinkResponse,
  PressKitSharePreset,
} from '@web-bands/bands-domain'
import {
  PRESS_KIT_LOGO_MAX_FILE_SIZE_BYTES,
  PRESS_KIT_RIDER_MAX_FILE_SIZE_BYTES,
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
    kind: BandPrivateAssetKind
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
    kind: BandPrivateAssetKind
    label: string
    file: File
  },
  options?: {
    onPhaseChange?: (phase: 'preparing' | 'uploading' | 'finalizing') => void
  }
) {
  const mimeType = normalizePrivateAssetMimeType(input.file)
  const maximumSize =
    input.kind === 'logo'
      ? PRESS_KIT_LOGO_MAX_FILE_SIZE_BYTES
      : PRESS_KIT_RIDER_MAX_FILE_SIZE_BYTES
  const expectedMimeType = input.kind === 'logo' ? 'image/png' : 'application/pdf'

  if (input.label.trim().length < 2) {
    return localUploadValidationError('label', 'El nombre debe tener al menos 2 caracteres.')
  }

  if (mimeType !== expectedMimeType) {
    return localUploadValidationError(
      'mimeType',
      input.kind === 'logo' ? 'Selecciona un archivo PNG valido.' : 'Selecciona un archivo PDF valido.'
    )
  }

  if (input.file.size > maximumSize) {
    return localUploadValidationError(
      'fileSizeBytes',
      input.kind === 'logo' ? 'El logo PNG no puede superar 20 MB.' : 'El rider tecnico no puede superar 25 MB.'
    )
  }

  options?.onPhaseChange?.('preparing')
  const uploadStart = await createPressKitUploadRequest(bandId, {
    kind: input.kind,
    label: input.label,
    fileName: input.file.name,
    mimeType,
    fileSizeBytes: input.file.size,
  })

  if (!uploadStart.ok || !uploadStart.body?.upload) {
    return {
      ok: false,
      status: uploadStart.status,
      body: {
        message:
          uploadStart.body?.message ||
          (input.kind === 'logo'
            ? 'No se pudo preparar la subida del logo.'
            : 'No se pudo preparar la subida del rider tecnico.'),
        errors: uploadStart.body?.errors,
      },
    } satisfies PressKitApiEnvelope<PressKitAssetMutationResponse>
  }

  options?.onPhaseChange?.('uploading')
  const supabase = createClient()
  const {error: uploadError} = await supabase.storage
    .from('band-press-assets')
    .uploadToSignedUrl(uploadStart.body.upload.storagePath, uploadStart.body.upload.token, input.file, {
      contentType: mimeType,
      upsert: false,
    })

  if (uploadError) {
    return {
      ok: false,
      status: 503,
      body: {
        message:
          uploadError.message ||
          (input.kind === 'logo'
            ? 'No se pudo subir el logo a storage.'
            : 'No se pudo subir el rider tecnico a storage.'),
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
      kind: input.kind,
      label: input.label,
      upload: {
        assetId: uploadStart.body.upload.assetId,
        storagePath: uploadStart.body.upload.storagePath,
        originalFileName: input.file.name,
        mimeType,
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

export function normalizePrivateAssetMimeType(file: Pick<File, 'name' | 'type'>) {
  if (file.type) {
    return file.type.toLowerCase()
  }

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'png') {
    return 'image/png'
  }

  if (extension === 'pdf') {
    return 'application/pdf'
  }

  return ''
}

function localUploadValidationError(path: string, message: string) {
  return {
    ok: false,
    status: 400,
    body: {
      message,
      errors: [{path, message}],
    },
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
