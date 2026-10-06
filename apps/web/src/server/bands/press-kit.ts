import type {
  BandPressKitPayload,
  BandPrivateAsset,
  BandPrivateAssetKind,
  PressKitSharePreset,
} from '@web-bands/bands-domain'
import {
  bandPressKitUpdateSchema,
  bandPrivateAssetFinalizeSchema,
  bandPrivateAssetShareSchema,
  bandPrivateAssetUploadStartSchema,
} from '@web-bands/bands-domain'

import {revalidatePath} from 'next/cache'

import {canEditBand} from '@/lib/auth/permissions'
import {isSupabaseAdminConfigured} from '@/lib/env'
import {writeAuditLog} from '@/lib/server/audit'
import {logServerError, logServerWarning} from '@/lib/server/log'
import {consumeRateLimit, getRateLimitHeaders, RATE_LIMIT_POLICIES} from '@/lib/server/rate-limit'
import {createAdminClient} from '@/lib/supabase/admin'
import {createClient} from '@/lib/supabase/server'
import {getBandEditorPayload} from './editor-payload'
import {BandServiceError} from './service-error'
import {updateBand} from './update-band'

type RequestContext = {
  ip: string | null
  requestId: string | null
  userAgent: string | null
}

type PrivateAssetRow = {
  id: string
  band_id: string
  kind: BandPrivateAssetKind
  label: string
  storage_bucket: string
  storage_path: string
  original_file_name: string
  mime_type: string
  file_size_bytes: number
  uploaded_by: string
  created_at: string
  updated_at: string
}

const PRESS_KIT_BUCKET = 'band-press-assets'
const PRESS_KIT_PREVIEW_TTL_SECONDS = 60 * 10
const PRESS_KIT_SHARE_PRESET_SECONDS: Record<PressKitSharePreset, number> = {
  '1h': 60 * 60,
  '24h': 60 * 60 * 24,
  '7d': 60 * 60 * 24 * 7,
}
const PRIVATE_ASSET_SELECT_FIELDS =
  'id, band_id, kind, label, storage_bucket, storage_path, original_file_name, mime_type, file_size_bytes, uploaded_by, created_at, updated_at' as const

function isMissingPressKitTableError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as {code?: string; details?: string; message?: string; hint?: string}
  const haystack = `${candidate.message || ''} ${candidate.details || ''} ${candidate.hint || ''}`.toLowerCase()

  return candidate.code === '42P01' || candidate.code === 'PGRST205' || haystack.includes('band_private_assets')
}

function isMissingPressKitStorageError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as {code?: string; details?: string; message?: string; error?: string}
  const haystack = `${candidate.message || ''} ${candidate.details || ''} ${candidate.error || ''}`.toLowerCase()

  return haystack.includes(PRESS_KIT_BUCKET) || haystack.includes('bucket not found')
}

function getMissingPressKitInfrastructureMessage() {
  return 'The press kit storage is not installed in this environment yet. Apply the Supabase migration for band_press_assets first.'
}

function requirePressKitAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    throw new BandServiceError('Supabase admin config is required for the press kit.', 503)
  }

  return createAdminClient()
}

function slugifySegment(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function getFileExtension(fileName: string) {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : ''
}

function buildPrivateAssetStoragePath(bandId: string, assetId: string, originalFileName: string) {
  const extension = getFileExtension(originalFileName) || 'png'
  const safeBase = slugifySegment(originalFileName.replace(/\.[^.]+$/, '')) || 'logo'
  return `${bandId}/${assetId}/${safeBase}.${extension}`
}

function buildPrivateAssetDownloadName(bandSlug: string, label: string, originalFileName: string) {
  const extension = getFileExtension(originalFileName) || 'png'
  const safeBand = slugifySegment(bandSlug) || 'banda'
  const safeLabel = slugifySegment(label) || 'logo'
  return `${safeBand}_${safeLabel}.${extension}`
}

function toPrivateAsset(row: PrivateAssetRow, previewUrl?: string | null): BandPrivateAsset {
  return {
    id: row.id,
    bandId: row.band_id,
    kind: row.kind,
    label: row.label,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    originalFileName: row.original_file_name,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    previewUrl: previewUrl || undefined,
  }
}

async function removePrivateAssetStorageObject(storagePath: string) {
  try {
    const supabase = await createClient()
    await supabase.storage.from(PRESS_KIT_BUCKET).remove([storagePath])
  } catch {
    // Best-effort cleanup.
  }
}

async function loadPrivateAssetRow(
  bandId: string,
  assetId: string
): Promise<PrivateAssetRow | null> {
  const supabase = await createClient()
  const {data, error} = await supabase
    .from('band_private_assets')
    .select(PRIVATE_ASSET_SELECT_FIELDS)
    .eq('band_id', bandId)
    .eq('id', assetId)
    .maybeSingle()

  if (error) {
    if (isMissingPressKitTableError(error)) {
      throw new BandServiceError(getMissingPressKitInfrastructureMessage(), 503)
    }

    throw new BandServiceError('Press kit asset could not be loaded.', 500)
  }

  return (data as PrivateAssetRow | null) || null
}

async function createPreviewUrl(storagePath: string) {
  try {
    const admin = requirePressKitAdminClient()
    const {data, error} = await admin.storage
      .from(PRESS_KIT_BUCKET)
      .createSignedUrl(storagePath, PRESS_KIT_PREVIEW_TTL_SECONDS)

    if (error || !data?.signedUrl) {
      return null
    }

    return data.signedUrl
  } catch {
    return null
  }
}

function normalizeOptionalValue(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : ''
}

export async function listBandPrivateAssets(userId: string, bandId: string) {
  const payload = await getBandEditorPayload(userId, bandId)
  if (!payload) {
    throw new BandServiceError('Band not found.', 404)
  }

  if (!payload.canEdit) {
    throw new BandServiceError('You do not have permission to access the press kit.', 403)
  }

  const supabase = await createClient()
  const {data, error} = await supabase
    .from('band_private_assets')
    .select(PRIVATE_ASSET_SELECT_FIELDS)
    .eq('band_id', bandId)
    .order('created_at', {ascending: false})

  if (error) {
    if (isMissingPressKitTableError(error)) {
      logServerWarning('bands.press_kit.infrastructure_missing', {
        bandId,
        userId,
      })
      return []
    }

    throw new BandServiceError('Press kit assets could not be loaded.', 500)
  }

  const rows = ((data as PrivateAssetRow[]) || [])
  const previews = await Promise.all(rows.map((row) => createPreviewUrl(row.storage_path)))

  return rows.map((row, index) => toPrivateAsset(row, previews[index]))
}

export async function getBandPressKitPayload(
  userId: string,
  bandId: string
): Promise<BandPressKitPayload | null> {
  const payload = await getBandEditorPayload(userId, bandId)
  if (!payload || !payload.canEdit) {
    return null
  }

  const assets = await listBandPrivateAssets(userId, bandId)

  return {
    role: payload.role,
    band: {
      id: payload.band.id,
      name: payload.band.name,
      slug: payload.band.slug,
      status: payload.band.status,
    },
    canEdit: payload.canEdit,
    canManage: payload.canManage,
    publicBandHref: payload.publicBandHref,
    initialServerSavedAt: payload.initialServerSavedAt,
    internalKit: payload.initialValues.internalKit,
    assets,
  }
}

export async function updateBandPressKit(
  userId: string,
  bandId: string,
  rawBody: unknown,
  requestContext: RequestContext
) {
  const payload = await getBandEditorPayload(userId, bandId)
  if (!payload) {
    throw new BandServiceError('Band not found.', 404)
  }

  if (!payload.canEdit) {
    throw new BandServiceError('You do not have permission to access the press kit.', 403)
  }

  const parsed = bandPressKitUpdateSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw new BandServiceError('Invalid press kit payload.', 400, {
      errors: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    })
  }

  const merged = {
    ...payload.initialValues,
    internalKit: {
      ...payload.initialValues.internalKit,
      shortPitch: normalizeOptionalValue(parsed.data.shortPitch),
      bioShort: normalizeOptionalValue(parsed.data.bioShort),
      bioLong: normalizeOptionalValue(parsed.data.bioLong),
      shareNotes: normalizeOptionalValue(parsed.data.shareNotes),
      contactName: normalizeOptionalValue(parsed.data.contactName),
      contactEmail: normalizeOptionalValue(parsed.data.contactEmail),
      contactPhone: normalizeOptionalValue(parsed.data.contactPhone),
      bookingNotes: normalizeOptionalValue(parsed.data.bookingNotes),
      keyLinks: parsed.data.keyLinks,
    },
  }

  return updateBand(userId, bandId, merged, requestContext)
}

export async function createBandPrivateAssetUpload(
  userId: string,
  bandId: string,
  rawInput: unknown
) {
  const supabase = await createClient()
  const {data: membership, error: membershipError} = await supabase
    .from('band_memberships')
    .select('role')
    .eq('band_id', bandId)
    .eq('user_id', userId)
    .maybeSingle()

  if (membershipError) {
    throw new BandServiceError('Press kit permissions could not be verified.', 500)
  }

  if (!canEditBand(membership?.role)) {
    throw new BandServiceError('You do not have permission to manage the press kit.', 403)
  }

  const rateLimitResult = await consumeRateLimit(RATE_LIMIT_POLICIES.assetUpload, [userId, bandId, 'press-kit'])
  if (!rateLimitResult.allowed) {
    logServerWarning('rate_limit.blocked', {
      action: 'bands.press_kit.upload_prepare',
      bandId,
      bucket: RATE_LIMIT_POLICIES.assetUpload.bucket,
      keyHash: rateLimitResult.keyHash,
      retryAfterSeconds: rateLimitResult.retryAfterSeconds,
      userId,
    })

    throw new BandServiceError('Too many press kit uploads right now. Try again in a few minutes.', 429, {
      retryAfterSeconds: rateLimitResult.retryAfterSeconds,
      headers: getRateLimitHeaders(rateLimitResult),
    })
  }

  const parsed = bandPrivateAssetUploadStartSchema.safeParse(rawInput)
  if (!parsed.success) {
    throw new BandServiceError('Invalid press kit upload payload.', 400, {
      errors: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    })
  }

  const {data: bandRow, error: bandError} = await supabase
    .from('bands')
    .select('id')
    .eq('id', bandId)
    .maybeSingle()

  if (bandError || !bandRow) {
    throw new BandServiceError('Band not found.', 404)
  }

  const assetId = crypto.randomUUID()
  const storagePath = buildPrivateAssetStoragePath(bandId, assetId, parsed.data.fileName)
  const admin = requirePressKitAdminClient()
  const {data, error} = await admin.storage.from(PRESS_KIT_BUCKET).createSignedUploadUrl(storagePath)

  if (error || !data?.token) {
    if (isMissingPressKitStorageError(error)) {
      throw new BandServiceError(getMissingPressKitInfrastructureMessage(), 503)
    }

    throw new BandServiceError('Supabase Storage could not prepare the press kit upload.', 503)
  }

  return {
    ok: true,
    upload: {
      assetId,
      storagePath,
      token: data.token,
    },
  }
}

export async function completeBandPrivateAssetUpload(
  userId: string,
  bandId: string,
  rawInput: unknown,
  requestContext: RequestContext
) {
  const supabase = await createClient()
  const {data: membership, error: membershipError} = await supabase
    .from('band_memberships')
    .select('role')
    .eq('band_id', bandId)
    .eq('user_id', userId)
    .maybeSingle()

  if (membershipError) {
    throw new BandServiceError('Press kit permissions could not be verified.', 500)
  }

  if (!canEditBand(membership?.role)) {
    throw new BandServiceError('You do not have permission to manage the press kit.', 403)
  }

  const parsed = bandPrivateAssetFinalizeSchema.safeParse(rawInput)
  if (!parsed.success) {
    throw new BandServiceError('Invalid press kit asset payload.', 400, {
      errors: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    })
  }

  if (!parsed.data.upload.storagePath.startsWith(`${bandId}/${parsed.data.upload.assetId}/`)) {
    throw new BandServiceError('Invalid press kit storage path.', 400)
  }

  const admin = requirePressKitAdminClient()
  const {data: storedObject, error: storageError} = await admin.storage
    .from(PRESS_KIT_BUCKET)
    .info(parsed.data.upload.storagePath)

  if (storageError || !storedObject) {
    if (isMissingPressKitStorageError(storageError)) {
      throw new BandServiceError(getMissingPressKitInfrastructureMessage(), 503)
    }

    throw new BandServiceError('The uploaded press kit asset could not be verified.', 400)
  }

  const assetValues = {
    band_id: bandId,
    kind: parsed.data.kind,
    label: parsed.data.label,
    storage_bucket: PRESS_KIT_BUCKET,
    storage_path: parsed.data.upload.storagePath,
    original_file_name: parsed.data.upload.originalFileName,
    mime_type: parsed.data.upload.mimeType,
    file_size_bytes: parsed.data.upload.fileSizeBytes,
    uploaded_by: userId,
  }

  let previousRider: PrivateAssetRow | null = null
  let savedAsset: PrivateAssetRow | null = null
  let saveError: unknown = null

  if (parsed.data.kind === 'technical_rider') {
    const {data: existingRider, error: existingRiderError} = await supabase
      .from('band_private_assets')
      .select(PRIVATE_ASSET_SELECT_FIELDS)
      .eq('band_id', bandId)
      .eq('kind', 'technical_rider')
      .maybeSingle()

    if (existingRiderError) {
      await removePrivateAssetStorageObject(parsed.data.upload.storagePath)
      throw new BandServiceError('The current technical rider could not be verified.', 500)
    }

    previousRider = (existingRider as PrivateAssetRow | null) || null
  }

  if (previousRider) {
    const {data, error} = await supabase
      .from('band_private_assets')
      .update(assetValues)
      .eq('band_id', bandId)
      .eq('id', previousRider.id)
      .select(PRIVATE_ASSET_SELECT_FIELDS)
      .maybeSingle()

    savedAsset = (data as PrivateAssetRow | null) || null
    saveError = error
  } else {
    const {data, error} = await supabase
      .from('band_private_assets')
      .insert({
        id: parsed.data.upload.assetId,
        ...assetValues,
      })
      .select(PRIVATE_ASSET_SELECT_FIELDS)
      .maybeSingle()

    savedAsset = (data as PrivateAssetRow | null) || null
    saveError = error
  }

  if (saveError || !savedAsset) {
    await removePrivateAssetStorageObject(parsed.data.upload.storagePath)
    if (isMissingPressKitTableError(saveError)) {
      throw new BandServiceError(getMissingPressKitInfrastructureMessage(), 503)
    }

    throw new BandServiceError('Press kit asset metadata could not be saved.', 500)
  }

  if (previousRider && previousRider.storage_path !== parsed.data.upload.storagePath) {
    await removePrivateAssetStorageObject(previousRider.storage_path)
  }

  revalidatePath(`/dashboard/bands/${bandId}/press-kit`)

  await writeAuditLog({
    action: 'band.press_asset_uploaded',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      assetId: savedAsset.id,
      fileName: parsed.data.upload.originalFileName,
      kind: parsed.data.kind,
      requestId: requestContext.requestId,
      size: parsed.data.upload.fileSizeBytes,
    },
    targetId: savedAsset.id,
    targetType: 'band_private_asset',
    userAgent: requestContext.userAgent,
  })

  const previewUrl = await createPreviewUrl(parsed.data.upload.storagePath)

  return {
    ok: true,
    asset: toPrivateAsset(savedAsset, previewUrl),
  }
}

export async function deleteBandPrivateAsset(
  userId: string,
  bandId: string,
  assetId: string,
  requestContext: RequestContext
) {
  const payload = await getBandEditorPayload(userId, bandId)
  if (!payload) {
    throw new BandServiceError('Band not found.', 404)
  }

  if (!payload.canEdit) {
    throw new BandServiceError('You do not have permission to manage the press kit.', 403)
  }

  const supabase = await createClient()
  const {data: deletedAsset, error} = await supabase
    .from('band_private_assets')
    .delete()
    .eq('band_id', bandId)
    .eq('id', assetId)
    .select(PRIVATE_ASSET_SELECT_FIELDS)
    .maybeSingle()

  if (error) {
    if (isMissingPressKitTableError(error)) {
      throw new BandServiceError(getMissingPressKitInfrastructureMessage(), 503)
    }

    throw new BandServiceError('Press kit asset could not be deleted.', 500)
  }

  if (!deletedAsset) {
    throw new BandServiceError('Press kit asset not found.', 404)
  }

  await removePrivateAssetStorageObject((deletedAsset as PrivateAssetRow).storage_path)
  revalidatePath(`/dashboard/bands/${bandId}/press-kit`)

  await writeAuditLog({
    action: 'band.press_asset_deleted',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      assetId,
      requestId: requestContext.requestId,
      storagePath: (deletedAsset as PrivateAssetRow).storage_path,
    },
    targetId: assetId,
    targetType: 'band_private_asset',
    userAgent: requestContext.userAgent,
  })

  return {
    ok: true,
  }
}

export async function createBandPrivateAssetShareLink(
  userId: string,
  bandId: string,
  assetId: string,
  rawInput: unknown,
  requestContext: RequestContext
) {
  const payload = await getBandEditorPayload(userId, bandId)
  if (!payload) {
    throw new BandServiceError('Band not found.', 404)
  }

  if (!payload.canEdit) {
    throw new BandServiceError('You do not have permission to access the press kit.', 403)
  }

  const parsed = bandPrivateAssetShareSchema.safeParse(rawInput)
  if (!parsed.success) {
    throw new BandServiceError('Invalid share link payload.', 400, {
      errors: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    })
  }

  const asset = await loadPrivateAssetRow(bandId, assetId)
  if (!asset) {
    throw new BandServiceError('Press kit asset not found.', 404)
  }

  const admin = requirePressKitAdminClient()
  const expiresInSeconds = PRESS_KIT_SHARE_PRESET_SECONDS[parsed.data.preset]
  const fileName = buildPrivateAssetDownloadName(payload.band.slug, asset.label, asset.original_file_name)
  const {data, error} = await admin.storage.from(PRESS_KIT_BUCKET).createSignedUrl(asset.storage_path, expiresInSeconds, {
    download: fileName,
  })

  if (error || !data?.signedUrl) {
    logServerError('bands.press_kit.share_url_failed', error, {
      assetId,
      bandId,
      userId,
    })

    throw new BandServiceError('A temporary download link could not be generated.', 503)
  }

  await writeAuditLog({
    action: 'band.press_asset_shared',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      assetId,
      expiresInSeconds,
      preset: parsed.data.preset,
      requestId: requestContext.requestId,
    },
    targetId: assetId,
    targetType: 'band_private_asset',
    userAgent: requestContext.userAgent,
  })

  return {
    ok: true,
    share: {
      url: data.signedUrl,
      expiresInSeconds,
      preset: parsed.data.preset,
      fileName,
    },
  }
}
