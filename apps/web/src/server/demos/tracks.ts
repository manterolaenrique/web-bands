import {revalidatePath} from 'next/cache'
import {cache} from 'react'

import type {
  TrackUploadCompleteInput,
  TrackUploadStartInput,
  BandAudioTrackDetail,
  BandTrackAccessPayload,
  TrackAccessInput,
  TrackUpdateInput,
  TrackUploadInput,
} from '@web-bands/bands-domain'
import {trackUpdateSchema, trackUploadCompleteSchema, trackUploadSchema, trackUploadStartSchema} from '@web-bands/bands-domain'
import {ZodError} from 'zod'

import {writeAuditLog} from '@/lib/server/audit'
import {consumeRateLimit, getRateLimitHeaders, RATE_LIMIT_POLICIES} from '@/lib/server/rate-limit'
import {createClient} from '@/lib/supabase/server'
import {BandServiceError} from '@/server/bands/service-error'

import {
  buildTrackDownloadName,
  buildTrackStoragePath,
  DEMOS_ALLOWED_MIME_TYPES,
  DEMOS_MAX_FILE_SIZE_BYTES,
  DEMOS_SIGNED_URL_TTL_SECONDS,
  ensureGeneralPlaylist,
  getBandDemosAccess,
  loadBandPlaylistRowById,
  requireDemosAccess,
  requireDemosAdminClient,
  requireDemosEditor,
  toTrackSummary,
} from './shared'

type RequestContext = {
  ip: string | null
  requestId: string | null
  userAgent: string | null
}

type TrackRow = Parameters<typeof toTrackSummary>[0]
type UploadedTrackDescriptor = {
  fileSizeBytes: number
  mimeType: string
  originalFileName: string
  storagePath: string
  trackId: string
}

function revalidateDemosHome(bandId: string) {
  revalidatePath(`/dashboard/bands/${bandId}/demos`)
}

function revalidatePlaylistIndex(bandId: string) {
  revalidatePath(`/dashboard/bands/${bandId}/demos/playlists`)
}

function revalidatePlaylistDetail(bandId: string, playlistId: string) {
  revalidatePath(`/dashboard/bands/${bandId}/demos/playlists/${playlistId}`)
}

function revalidateTrackDetail(bandId: string, trackId: string) {
  revalidatePath(`/dashboard/bands/${bandId}/demos/${trackId}`)
}

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : undefined
}

function readNullableInteger(formData: FormData, key: string) {
  const value = formData.get(key)
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.round(parsed) : null
}

function readBoolean(formData: FormData, key: string) {
  const value = formData.get(key)
  if (typeof value !== 'string') {
    return false
  }

  return value === 'true' || value === '1' || value === 'on'
}

function getTrackValidationIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

function buildTrackInputFromFormData(formData: FormData): TrackUploadInput {
  return trackUploadSchema.parse({
    title: readOptionalString(formData, 'title'),
    description: readOptionalString(formData, 'description'),
    relatedSongTitle: readOptionalString(formData, 'relatedSongTitle'),
    trackType: readOptionalString(formData, 'trackType'),
    trackStatus: readOptionalString(formData, 'trackStatus'),
    isDownloadable: readBoolean(formData, 'isDownloadable'),
    durationSeconds: readNullableInteger(formData, 'durationSeconds'),
    playlistId: readOptionalString(formData, 'playlistId'),
  })
}

function buildTrackStartInput(input: unknown): TrackUploadStartInput {
  return trackUploadStartSchema.parse(input)
}

function assertAudioFile(file: File | null) {
  if (!(file instanceof File)) {
    throw new BandServiceError('Audio file is required.', 400)
  }

  if (!DEMOS_ALLOWED_MIME_TYPES.has(file.type)) {
    throw new BandServiceError('Only MP3, WAV, M4A and OGG files are allowed.', 400)
  }

  if (file.size > DEMOS_MAX_FILE_SIZE_BYTES) {
    throw new BandServiceError('Audio must be 50MB or smaller.', 400)
  }

  return file
}

function assertAudioUploadDescriptor<T extends {fileSizeBytes: number; mimeType: string}>(descriptor: T) {
  if (!DEMOS_ALLOWED_MIME_TYPES.has(descriptor.mimeType)) {
    throw new BandServiceError('Only MP3, WAV, M4A and OGG files are allowed.', 400)
  }

  if (descriptor.fileSizeBytes > DEMOS_MAX_FILE_SIZE_BYTES) {
    throw new BandServiceError('Audio must be 50MB or smaller.', 400)
  }

  return descriptor
}

async function removeTrackStorageObject(storageBucket: string, storagePath: string) {
  try {
    const admin = requireDemosAdminClient()
    await admin.storage.from(storageBucket).remove([storagePath])
  } catch {
    // Best-effort cleanup.
  }
}

async function removeTrackRecord(bandId: string, trackId: string) {
  try {
    const supabase = await createClient()
    await supabase.from('band_audio_tracks').delete().eq('band_id', bandId).eq('id', trackId)
  } catch {
    // Best-effort cleanup.
  }
}

async function consumeUploadAllowance(userId: string, bandId: string) {
  const rateLimitResult = await consumeRateLimit(RATE_LIMIT_POLICIES.demosUpload, [userId, bandId])

  if (!rateLimitResult.allowed) {
    throw new BandServiceError('Too many demo uploads right now. Try again in a few minutes.', 429, {
      retryAfterSeconds: rateLimitResult.retryAfterSeconds,
      headers: getRateLimitHeaders(rateLimitResult),
    })
  }
}

async function linkTrackToPlaylist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  playlistId: string,
  trackId: string
) {
  const {data: currentRows, error: playlistRowsError} = await supabase
    .from('band_audio_playlist_tracks')
    .select('sort_order')
    .eq('playlist_id', playlistId)
    .order('sort_order', {ascending: false})
    .limit(1)

  if (playlistRowsError) {
    throw new BandServiceError('Track could not be linked to the playlist.', 500)
  }

  const nextSortOrder = (currentRows?.[0]?.sort_order || 0) + 1
  const {error: playlistInsertError} = await supabase.from('band_audio_playlist_tracks').insert({
    playlist_id: playlistId,
    track_id: trackId,
    sort_order: nextSortOrder,
  })

  if (playlistInsertError) {
    throw new BandServiceError('Track could not be linked to the playlist.', 400, {
      errors: [
        {
          path: 'playlistId',
          message: 'No pudimos sumar este audio a la playlist seleccionada.',
        },
      ],
    })
  }
}

async function verifyUploadedTrack(storagePath: string) {
  const admin = requireDemosAdminClient()
  const {data, error} = await admin.storage.from('band-demos').info(storagePath)

  if (error || !data) {
    throw new BandServiceError('The uploaded audio could not be verified.', 400)
  }
}

async function loadLinkedPlaylistIdsForTrack(
  supabase: Awaited<ReturnType<typeof createClient>>,
  trackId: string
) {
  const {data, error} = await supabase
    .from('band_audio_playlist_tracks')
    .select('playlist_id')
    .eq('track_id', trackId)

  if (error) {
    return []
  }

  return Array.from(new Set((data || []).map((row) => row.playlist_id)))
}

async function persistUploadedTrack(
  userId: string,
  bandId: string,
  input: TrackUploadInput,
  upload: UploadedTrackDescriptor,
  requestContext: RequestContext,
  options?: {
    verifyStorage?: boolean
  }
) {
  requireDemosEditor(await getBandDemosAccess(userId, bandId))
  const supabase = await createClient()
  const generalPlaylist = await ensureGeneralPlaylist(bandId, userId)
  let selectedPlaylistId: string | null = null

  if (options?.verifyStorage) {
    await verifyUploadedTrack(upload.storagePath)
  }

  if (input.playlistId) {
    let playlistRow
    try {
      playlistRow = await loadBandPlaylistRowById(supabase, bandId, input.playlistId)
    } catch {
      throw new BandServiceError('Playlist could not be validated.', 500)
    }

    if (!playlistRow) {
      throw new BandServiceError('Playlist not found.', 404, {
        errors: [
          {
            path: 'playlistId',
            message: 'La playlist seleccionada no existe para esta banda.',
          },
        ],
      })
    }

    selectedPlaylistId = playlistRow.id
  }

  const {data: insertedTrack, error: insertError} = await supabase
    .from('band_audio_tracks')
    .insert({
      id: upload.trackId,
      band_id: bandId,
      title: input.title,
      description: input.description || null,
      related_song_title: input.relatedSongTitle || null,
      storage_bucket: 'band-demos',
      storage_path: upload.storagePath,
      original_file_name: upload.originalFileName,
      mime_type: upload.mimeType,
      file_size_bytes: upload.fileSizeBytes,
      duration_seconds: input.durationSeconds ?? null,
      track_type: input.trackType,
      track_status: input.trackStatus,
      uploaded_by: userId,
      is_downloadable: input.isDownloadable,
    })
    .select(
      'id, band_id, title, description, related_song_title, storage_bucket, storage_path, original_file_name, mime_type, file_size_bytes, duration_seconds, track_type, track_status, uploaded_by, is_downloadable, created_at, updated_at'
    )
    .single()

  if (insertError || !insertedTrack) {
    await removeTrackStorageObject('band-demos', upload.storagePath)
    throw new BandServiceError('Track metadata could not be saved.', 500)
  }

  try {
    await linkTrackToPlaylist(supabase, generalPlaylist.id, upload.trackId)

    if (selectedPlaylistId && selectedPlaylistId !== generalPlaylist.id) {
      await linkTrackToPlaylist(supabase, selectedPlaylistId, upload.trackId)
    }
  } catch (error) {
    await Promise.all([
      removeTrackRecord(bandId, upload.trackId),
      removeTrackStorageObject('band-demos', upload.storagePath),
    ])
    throw error
  }

  revalidateDemosHome(bandId)
  revalidatePlaylistIndex(bandId)
  revalidatePlaylistDetail(bandId, generalPlaylist.id)
  if (selectedPlaylistId && selectedPlaylistId !== generalPlaylist.id) {
    revalidatePlaylistDetail(bandId, selectedPlaylistId)
  }

  await writeAuditLog({
    action: 'band.demo_uploaded',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      fileName: upload.originalFileName,
      mimeType: upload.mimeType,
      requestId: requestContext.requestId,
      size: upload.fileSizeBytes,
      title: input.title,
      trackType: input.trackType,
      playlistId: selectedPlaylistId,
      generalPlaylistId: generalPlaylist.id,
    },
    targetId: upload.trackId,
    targetType: 'band_audio_track',
    userAgent: requestContext.userAgent,
  })

  return {
    ok: true,
    track: toTrackSummary(insertedTrack as TrackRow),
  }
}

function buildTrackAccessPayload(
  signedUrl: string,
  mode: TrackAccessInput['mode'],
  bandSlug: string,
  track: TrackRow
): BandTrackAccessPayload {
  return {
    url: signedUrl,
    expiresInSeconds: DEMOS_SIGNED_URL_TTL_SECONDS,
    fileName: buildTrackDownloadName(
      bandSlug,
      track.title,
      track.track_type,
      track.created_at,
      track.original_file_name
    ),
    mode,
  }
}

export const getBandTrack = cache(async function getBandTrack(
  userId: string,
  bandId: string,
  trackId: string
): Promise<BandAudioTrackDetail | null> {
  const access = await getBandDemosAccess(userId, bandId)
  if (!access) {
    return null
  }

  const supabase = await createClient()
  const {data: trackRow, error} = await supabase
    .from('band_audio_tracks')
    .select(
      'id, band_id, title, description, related_song_title, storage_bucket, storage_path, original_file_name, mime_type, file_size_bytes, duration_seconds, track_type, track_status, uploaded_by, is_downloadable, created_at, updated_at'
    )
    .eq('band_id', bandId)
    .eq('id', trackId)
    .maybeSingle()

  if (error || !trackRow) {
    return null
  }

  const typedTrack = trackRow as TrackRow
  const {data: uploaderProfile} = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', typedTrack.uploaded_by)
    .maybeSingle()

  const uploadedByName =
    uploaderProfile?.display_name ||
    uploaderProfile?.email?.split('@')[0] ||
    null

  return {
    ...toTrackSummary(typedTrack),
    band: access.band,
    role: access.role,
    canEdit: access.canEdit,
    canDownload: access.role !== 'viewer' || typedTrack.is_downloadable,
    uploadedByName,
  }
})

export async function createBandTrackUpload(userId: string, bandId: string, input: unknown) {
  requireDemosEditor(await getBandDemosAccess(userId, bandId))

  let parsed: TrackUploadStartInput
  try {
    parsed = buildTrackStartInput(input)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BandServiceError('Invalid audio upload payload.', 400, {
        errors: getTrackValidationIssues(error),
      })
    }

    throw error
  }

  assertAudioUploadDescriptor(parsed)

  const trackId = crypto.randomUUID()
  const storagePath = buildTrackStoragePath(bandId, trackId, parsed.fileName)
  const admin = requireDemosAdminClient()
  const {data, error} = await admin.storage.from('band-demos').createSignedUploadUrl(storagePath)

  if (error || !data?.token) {
    throw new BandServiceError('Supabase Storage could not prepare the audio upload.', 503)
  }

  return {
    ok: true,
    upload: {
      trackId,
      storagePath,
      token: data.token,
    },
  }
}

export async function completeBandTrackUpload(
  userId: string,
  bandId: string,
  input: unknown,
  requestContext: RequestContext
) {
  requireDemosEditor(await getBandDemosAccess(userId, bandId))
  await consumeUploadAllowance(userId, bandId)

  let parsed: TrackUploadCompleteInput
  try {
    parsed = trackUploadCompleteSchema.parse(input)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BandServiceError('Invalid demo metadata.', 400, {
        errors: getTrackValidationIssues(error),
      })
    }

    throw error
  }

  assertAudioUploadDescriptor(parsed.upload)

  return persistUploadedTrack(
    userId,
    bandId,
    {
      title: parsed.title,
      description: parsed.description,
      relatedSongTitle: parsed.relatedSongTitle,
      trackType: parsed.trackType,
      trackStatus: parsed.trackStatus,
      isDownloadable: parsed.isDownloadable,
      durationSeconds: parsed.durationSeconds,
      playlistId: parsed.playlistId,
    },
    {
      trackId: parsed.upload.trackId,
      storagePath: parsed.upload.storagePath,
      originalFileName: parsed.upload.originalFileName,
      mimeType: parsed.upload.mimeType,
      fileSizeBytes: parsed.upload.fileSizeBytes,
    },
    requestContext,
    {verifyStorage: true}
  )
}

export async function uploadBandTrack(
  userId: string,
  bandId: string,
  formData: FormData,
  requestContext: RequestContext
) {
  requireDemosEditor(await getBandDemosAccess(userId, bandId))
  await consumeUploadAllowance(userId, bandId)

  const file = assertAudioFile(formData.get('file') instanceof File ? (formData.get('file') as File) : null)

  let input: TrackUploadInput

  try {
    input = buildTrackInputFromFormData(formData)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BandServiceError('Invalid demo metadata.', 400, {
        errors: getTrackValidationIssues(error),
      })
    }

    throw error
  }

  const trackId = crypto.randomUUID()
  const storagePath = buildTrackStoragePath(bandId, trackId, file.name)
  const admin = requireDemosAdminClient()
  const uploadBuffer = Buffer.from(await file.arrayBuffer())
  const {error: storageError} = await admin.storage.from('band-demos').upload(storagePath, uploadBuffer, {
    contentType: file.type,
    upsert: false,
  })

  if (storageError) {
    throw new BandServiceError('Supabase Storage could not save the audio file.', 503)
  }

  return persistUploadedTrack(
    userId,
    bandId,
    input,
    {
      trackId,
      storagePath,
      originalFileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
    },
    requestContext
  )
}

export async function updateBandTrack(
  userId: string,
  bandId: string,
  trackId: string,
  input: unknown,
  requestContext: RequestContext
) {
  requireDemosEditor(await getBandDemosAccess(userId, bandId))
  const rateLimitResult = await consumeRateLimit(RATE_LIMIT_POLICIES.demosWrite, [userId, bandId])

  if (!rateLimitResult.allowed) {
    throw new BandServiceError('Too many demo changes right now. Try again in a few minutes.', 429, {
      retryAfterSeconds: rateLimitResult.retryAfterSeconds,
      headers: getRateLimitHeaders(rateLimitResult),
    })
  }

  let parsed: TrackUpdateInput

  try {
    parsed = trackUpdateSchema.parse(input)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BandServiceError('Invalid demo metadata.', 400, {
        errors: getTrackValidationIssues(error),
      })
    }

    throw error
  }

  const supabase = await createClient()
  const linkedPlaylistIds = await loadLinkedPlaylistIdsForTrack(supabase, trackId)
  const {data: updatedTrack, error} = await supabase
    .from('band_audio_tracks')
    .update({
      title: parsed.title,
      description: parsed.description || null,
      related_song_title: parsed.relatedSongTitle || null,
      duration_seconds: parsed.durationSeconds ?? null,
      track_type: parsed.trackType,
      track_status: parsed.trackStatus,
      is_downloadable: parsed.isDownloadable,
    })
    .eq('band_id', bandId)
    .eq('id', trackId)
    .select(
      'id, band_id, title, description, related_song_title, storage_bucket, storage_path, original_file_name, mime_type, file_size_bytes, duration_seconds, track_type, track_status, uploaded_by, is_downloadable, created_at, updated_at'
    )
    .maybeSingle()

  if (error) {
    throw new BandServiceError('Track could not be updated.', 500)
  }

  if (!updatedTrack) {
    throw new BandServiceError('Track not found.', 404)
  }

  revalidateDemosHome(bandId)
  revalidateTrackDetail(bandId, trackId)
  linkedPlaylistIds.forEach((playlistId) => {
    revalidatePlaylistDetail(bandId, playlistId)
  })

  await writeAuditLog({
    action: 'band.demo_updated',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      requestId: requestContext.requestId,
      title: parsed.title,
      trackType: parsed.trackType,
      trackStatus: parsed.trackStatus,
    },
    targetId: trackId,
    targetType: 'band_audio_track',
    userAgent: requestContext.userAgent,
  })

  return {
    ok: true,
    track: toTrackSummary(updatedTrack as TrackRow),
  }
}

export async function deleteBandTrack(
  userId: string,
  bandId: string,
  trackId: string,
  requestContext: RequestContext
) {
  requireDemosEditor(await getBandDemosAccess(userId, bandId))
  const supabase = await createClient()
  const linkedPlaylistIds = await loadLinkedPlaylistIdsForTrack(supabase, trackId)
  const {data: deletedTrack, error} = await supabase
    .from('band_audio_tracks')
    .delete()
    .eq('band_id', bandId)
    .eq('id', trackId)
    .select(
      'id, band_id, title, description, related_song_title, storage_bucket, storage_path, original_file_name, mime_type, file_size_bytes, duration_seconds, track_type, track_status, uploaded_by, is_downloadable, created_at, updated_at'
    )
    .maybeSingle()

  if (error) {
    throw new BandServiceError('Track could not be deleted.', 500)
  }

  if (!deletedTrack) {
    throw new BandServiceError('Track not found.', 404)
  }

  await removeTrackStorageObject(deletedTrack.storage_bucket, deletedTrack.storage_path)

  revalidateDemosHome(bandId)
  revalidatePlaylistIndex(bandId)
  linkedPlaylistIds.forEach((playlistId) => {
    revalidatePlaylistDetail(bandId, playlistId)
  })

  await writeAuditLog({
    action: 'band.demo_deleted',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      requestId: requestContext.requestId,
      storagePath: deletedTrack.storage_path,
      title: deletedTrack.title,
    },
    targetId: trackId,
    targetType: 'band_audio_track',
    userAgent: requestContext.userAgent,
  })

  return {
    ok: true,
  }
}

export async function getBandTrackAccess(
  userId: string,
  bandId: string,
  trackId: string,
  input: TrackAccessInput
) {
  const access = requireDemosAccess(await getBandDemosAccess(userId, bandId))
  const admin = requireDemosAdminClient()
  const {data: trackRow, error} = await admin
    .from('band_audio_tracks')
    .select(
      'id, band_id, title, description, related_song_title, storage_bucket, storage_path, original_file_name, mime_type, file_size_bytes, duration_seconds, track_type, track_status, uploaded_by, is_downloadable, created_at, updated_at'
    )
    .eq('band_id', bandId)
    .eq('id', trackId)
    .maybeSingle()

  if (error || !trackRow) {
    throw new BandServiceError('Track not found.', 404)
  }

  const typedTrack = trackRow as TrackRow
  if (input.mode === 'download' && access.role === 'viewer' && !typedTrack.is_downloadable) {
    throw new BandServiceError('This demo is not downloadable for your role.', 403)
  }

  const {data, error: signedUrlError} = await admin.storage
    .from(typedTrack.storage_bucket)
    .createSignedUrl(typedTrack.storage_path, DEMOS_SIGNED_URL_TTL_SECONDS, {
      download:
        input.mode === 'download'
          ? buildTrackDownloadName(
              access.band.slug,
              typedTrack.title,
              typedTrack.track_type,
              typedTrack.created_at,
              typedTrack.original_file_name
            )
          : undefined,
    })

  if (signedUrlError || !data?.signedUrl) {
    throw new BandServiceError('A private access URL could not be generated.', 503)
  }

  return {
    ok: true,
    access: buildTrackAccessPayload(data.signedUrl, input.mode, access.band.slug, typedTrack),
  }
}
