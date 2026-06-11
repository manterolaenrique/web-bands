export type DashboardValidationIssue = {
  path: string
  message: string
}

export type DashboardApiEnvelope<T> = {
  ok: boolean
  status: number
  body: T | null
}

export type CreateBandApiResponse = {
  ok?: boolean
  band?: {
    id: string
    name: string
    slug: string
    status: string
  }
  editorHref?: string
  message?: string
  code?: string
}

export type UpdateBandApiResponse = {
  ok?: boolean
  band?: {
    id: string
    slug: string
    sanityDocumentId: string
    syncedAt?: string
  }
  message?: string
  errors?: DashboardValidationIssue[]
}

export type UploadBandAssetApiResponse = {
  ok?: boolean
  image?: {
    assetId?: string
    url?: string | null
  }
  message?: string
}

async function parseJson<T>(response: Response) {
  return (await response.json().catch(() => null)) as T | null
}

export async function createBandRequest(input: {name: string}) {
  const response = await fetch('/api/dashboard/bands', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<CreateBandApiResponse>(response),
  } satisfies DashboardApiEnvelope<CreateBandApiResponse>
}

export async function updateBandRequest(bandId: string, input: unknown) {
  const response = await fetch(`/api/bands/${bandId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<UpdateBandApiResponse>(response),
  } satisfies DashboardApiEnvelope<UpdateBandApiResponse>
}

export async function uploadBandAssetRequest(bandId: string, formData: FormData) {
  const response = await fetch(`/api/bands/${bandId}/assets`, {
    method: 'POST',
    body: formData,
  })

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<UploadBandAssetApiResponse>(response),
  } satisfies DashboardApiEnvelope<UploadBandAssetApiResponse>
}
