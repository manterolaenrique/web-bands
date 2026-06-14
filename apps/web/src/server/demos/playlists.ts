import {revalidatePath} from 'next/cache'

import type {
  BandAudioPlaylistDetail,
  BandAudioPlaylistTrack,
  PlaylistInput,
  PlaylistTrackOrderInput,
} from '@web-bands/bands-domain'
import {playlistSchema, playlistTrackOrderSchema} from '@web-bands/bands-domain'
import {ZodError} from 'zod'

import {writeAuditLog} from '@/lib/server/audit'
import {consumeRateLimit, getRateLimitHeaders, RATE_LIMIT_POLICIES} from '@/lib/server/rate-limit'
import {createClient} from '@/lib/supabase/server'
import {BandServiceError} from '@/server/bands/service-error'

import {
  type DemosPlaylistRow,
  buildPlaylistCoverStoragePath,
  DEMOS_ALLOWED_COVER_MIME_TYPES,
  DEMOS_MAX_COVER_FILE_SIZE_BYTES,
  ensureGeneralPlaylist,
  getBandDemosAccess,
  isLockedPlaylistSystemKey,
  loadBandPlaylistRowById,
  loadBandPlaylistRows,
  requireDemosAccess,
  requireDemosAdminClient,
  requireDemosEditor,
  resolvePlaylistCoverUrlMap,
  sortPlaylistsForDisplay,
  toPlaylistSummary,
  toTrackSummary,
} from './shared'

type RequestContext = {
  ip: string | null
  requestId: string | null
  userAgent: string | null
}

type PlaylistRow = DemosPlaylistRow
type TrackRow = Parameters<typeof toTrackSummary>[0]

type PlaylistTrackRow = {
  id: string
  playlist_id: string
  track_id: string
  sort_order: number
  created_at: string
}

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : undefined
}

function buildPlaylistInputFromFormData(formData: FormData): PlaylistInput {
  return playlistSchema.parse({
    title: readOptionalString(formData, 'title'),
    description: readOptionalString(formData, 'description'),
    coverAction: readOptionalString(formData, 'coverAction'),
  })
}

function readCoverFile(formData: FormData) {
  const value = formData.get('coverFile')
  return value instanceof File && value.size > 0 ? value : null
}

function assertPlaylistCoverFile(file: File | null) {
  if (!file) {
    return null
  }

  if (!DEMOS_ALLOWED_COVER_MIME_TYPES.has(file.type)) {
    throw new BandServiceError('Playlist covers must be JPG, PNG, WEBP or AVIF.', 400)
  }

  if (file.size > DEMOS_MAX_COVER_FILE_SIZE_BYTES) {
    throw new BandServiceError('Playlist cover must be 5MB or smaller.', 400)
  }

  return file
}

async function uploadPlaylistCover(bandId: string, playlistId: string, file: File) {
  const admin = requireDemosAdminClient()
  const storagePath = buildPlaylistCoverStoragePath(bandId, playlistId, file.name)
  const buffer = Buffer.from(await file.arrayBuffer())
  const {error} = await admin.storage.from('band-demos').upload(storagePath, buffer, {
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    throw new BandServiceError('Supabase Storage could not save the playlist cover.', 503)
  }

  return {
    bucket: 'band-demos',
    path: storagePath,
    originalFileName: file.name,
  }
}

async function removePlaylistCoverStorageObject(storageBucket: string | null, storagePath: string | null) {
  if (!storageBucket || !storagePath) {
    return
  }

  try {
    const admin = requireDemosAdminClient()
    await admin.storage.from(storageBucket).remove([storagePath])
  } catch {
    // Best-effort cleanup.
  }
}

function getValidationIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

function assertPlaylistIsEditable(playlist: {system_key: string | null | undefined}) {
  if (isLockedPlaylistSystemKey(playlist.system_key)) {
    throw new BandServiceError('La playlist General se administra automaticamente.', 403)
  }
}

async function loadPlaylistTrackCountMap(playlistIds: string[]) {
  if (playlistIds.length === 0) {
    return new Map<string, number>()
  }

  const supabase = await createClient()
  const {data} = await supabase
    .from('band_audio_playlist_tracks')
    .select('playlist_id')
    .in('playlist_id', playlistIds)

  return (data || []).reduce<Map<string, number>>((result, row) => {
    result.set(row.playlist_id, (result.get(row.playlist_id) || 0) + 1)
    return result
  }, new Map())
}

async function loadPlaylistTracks(playlistId: string, bandId: string) {
  const supabase = await createClient()
  const {data: playlistTrackRows, error: playlistTrackError} = await supabase
    .from('band_audio_playlist_tracks')
    .select('id, playlist_id, track_id, sort_order, created_at')
    .eq('playlist_id', playlistId)
    .order('sort_order', {ascending: true})
    .order('created_at', {ascending: true})

  if (playlistTrackError) {
    throw new BandServiceError('Playlist tracks could not be loaded.', 500)
  }

  const typedPlaylistTracks = (playlistTrackRows || []) as PlaylistTrackRow[]
  const trackIds = typedPlaylistTracks.map((row) => row.track_id)

  if (trackIds.length === 0) {
    return [] as BandAudioPlaylistTrack[]
  }

  const {data: trackRows, error: trackError} = await supabase
    .from('band_audio_tracks')
    .select(
      'id, band_id, title, description, related_song_title, storage_bucket, storage_path, original_file_name, mime_type, file_size_bytes, duration_seconds, track_type, track_status, uploaded_by, is_downloadable, created_at, updated_at'
    )
    .eq('band_id', bandId)
    .in('id', trackIds)

  if (trackError) {
    throw new BandServiceError('Playlist tracks could not be loaded.', 500)
  }

  const trackMap = new Map(((trackRows || []) as TrackRow[]).map((track) => [track.id, toTrackSummary(track)]))

  return typedPlaylistTracks
    .map((row) => {
      const track = trackMap.get(row.track_id)
      if (!track) {
        return null
      }

      return {
        id: row.id,
        playlistId: row.playlist_id,
        trackId: row.track_id,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        track,
      } satisfies BandAudioPlaylistTrack
    })
    .filter((track): track is BandAudioPlaylistTrack => track !== null)
}

export async function getBandPlaylists(userId: string, bandId: string, query?: string | null) {
  const access = requireDemosAccess(await getBandDemosAccess(userId, bandId))
  await ensureGeneralPlaylist(bandId, userId)
  const supabase = await createClient()
  const normalizedQuery = (query || '').trim()
  let typedPlaylists: PlaylistRow[]

  try {
    typedPlaylists = await loadBandPlaylistRows(supabase, bandId, {query: normalizedQuery})
  } catch {
    throw new BandServiceError('Playlists could not be loaded.', 500)
  }

  const coverUrlMap = await resolvePlaylistCoverUrlMap(typedPlaylists)
  const countMap = await loadPlaylistTrackCountMap(typedPlaylists.map((playlist) => playlist.id))
  const playlists = sortPlaylistsForDisplay(
    typedPlaylists.map((playlist) =>
      toPlaylistSummary(playlist, countMap.get(playlist.id) || 0, coverUrlMap.get(playlist.id))
    )
  )

  return {
    band: access.band,
    role: access.role,
    canEdit: access.canEdit,
    query: normalizedQuery,
    playlists,
  }
}

export async function getBandPlaylist(
  userId: string,
  bandId: string,
  playlistId: string
): Promise<BandAudioPlaylistDetail | null> {
  const access = await getBandDemosAccess(userId, bandId)
  if (!access) {
    return null
  }

  await ensureGeneralPlaylist(bandId, userId)
  const supabase = await createClient()
  let playlistRow: PlaylistRow | null
  try {
    playlistRow = await loadBandPlaylistRowById(supabase, bandId, playlistId)
  } catch {
    return null
  }

  if (!playlistRow) {
    return null
  }

  const tracks = await loadPlaylistTracks(playlistId, bandId)
  const coverUrlMap = await resolvePlaylistCoverUrlMap([playlistRow as PlaylistRow])
  return {
    ...toPlaylistSummary(playlistRow, tracks.length, coverUrlMap.get(playlistId)),
    band: access.band,
    role: access.role,
    canEdit: access.canEdit,
    tracks,
  }
}

export async function createBandPlaylist(
  userId: string,
  bandId: string,
  input: unknown,
  requestContext: RequestContext
) {
  requireDemosEditor(await getBandDemosAccess(userId, bandId))
  const rateLimitResult = await consumeRateLimit(RATE_LIMIT_POLICIES.demosWrite, [userId, bandId, 'playlist'])

  if (!rateLimitResult.allowed) {
    throw new BandServiceError('Too many playlist changes right now. Try again in a few minutes.', 429, {
      retryAfterSeconds: rateLimitResult.retryAfterSeconds,
      headers: getRateLimitHeaders(rateLimitResult),
    })
  }

  let parsed: PlaylistInput
  let coverFile: File | null = null

  try {
    if (input instanceof FormData) {
      parsed = buildPlaylistInputFromFormData(input)
      coverFile = assertPlaylistCoverFile(readCoverFile(input))
    } else {
      parsed = playlistSchema.parse(input)
    }
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BandServiceError('Invalid playlist metadata.', 400, {
        errors: getValidationIssues(error),
      })
    }

    throw error
  }

  const playlistId = crypto.randomUUID()
  const supabase = await createClient()
  let uploadedCover:
    | {
        bucket: string
        path: string
        originalFileName: string
      }
    | null = null

  if (coverFile) {
    uploadedCover = await uploadPlaylistCover(bandId, playlistId, coverFile)
  }

  const {error} = await supabase.from('band_audio_playlists').insert({
    id: playlistId,
    band_id: bandId,
    title: parsed.title,
    description: parsed.description || null,
    cover_storage_bucket: uploadedCover?.bucket || null,
    cover_storage_path: uploadedCover?.path || null,
    cover_original_file_name: uploadedCover?.originalFileName || null,
    created_by: userId,
  })

  if (error) {
    await removePlaylistCoverStorageObject(uploadedCover?.bucket || null, uploadedCover?.path || null)
    throw new BandServiceError('Playlist could not be created.', 500)
  }

  const playlistRow = await loadBandPlaylistRowById(supabase, bandId, playlistId)
  if (!playlistRow) {
    await removePlaylistCoverStorageObject(uploadedCover?.bucket || null, uploadedCover?.path || null)
    throw new BandServiceError('Playlist could not be created.', 500)
  }

  const coverUrlMap = await resolvePlaylistCoverUrlMap([playlistRow])

  revalidatePath(`/dashboard/bands/${bandId}/demos`)
  revalidatePath(`/dashboard/bands/${bandId}/demos/playlists`)

  await writeAuditLog({
    action: 'band.demo_playlist_created',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      requestId: requestContext.requestId,
      title: parsed.title,
    },
    targetId: playlistId,
    targetType: 'band_audio_playlist',
    userAgent: requestContext.userAgent,
  })

  return {
    ok: true,
    playlist: toPlaylistSummary(playlistRow, 0, coverUrlMap.get(playlistId)),
  }
}

export async function updateBandPlaylist(
  userId: string,
  bandId: string,
  playlistId: string,
  input: unknown,
  requestContext: RequestContext
) {
  requireDemosEditor(await getBandDemosAccess(userId, bandId))

  let parsed: PlaylistInput
  let coverFile: File | null = null
  try {
    if (input instanceof FormData) {
      parsed = buildPlaylistInputFromFormData(input)
      coverFile = assertPlaylistCoverFile(readCoverFile(input))
    } else {
      parsed = playlistSchema.parse(input)
    }
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BandServiceError('Invalid playlist metadata.', 400, {
        errors: getValidationIssues(error),
      })
    }

    throw error
  }

  const supabase = await createClient()
  let existingPlaylist: PlaylistRow | null
  try {
    existingPlaylist = await loadBandPlaylistRowById(supabase, bandId, playlistId)
  } catch {
    throw new BandServiceError('Playlist could not be loaded.', 500)
  }

  if (!existingPlaylist) {
    throw new BandServiceError('Playlist not found.', 404)
  }

  assertPlaylistIsEditable(existingPlaylist)

  let uploadedCover:
    | {
        bucket: string
        path: string
        originalFileName: string
      }
    | null = null

  if (coverFile) {
    uploadedCover = await uploadPlaylistCover(bandId, playlistId, coverFile)
  }

  const removeCurrentCover = !uploadedCover && parsed.coverAction === 'remove'
  const {error} = await supabase
    .from('band_audio_playlists')
    .update({
      title: parsed.title,
      description: parsed.description || null,
      cover_storage_bucket: uploadedCover
        ? uploadedCover.bucket
        : removeCurrentCover
          ? null
          : existingPlaylist.cover_storage_bucket,
      cover_storage_path: uploadedCover
        ? uploadedCover.path
        : removeCurrentCover
          ? null
          : existingPlaylist.cover_storage_path,
      cover_original_file_name: uploadedCover
        ? uploadedCover.originalFileName
        : removeCurrentCover
          ? null
          : existingPlaylist.cover_original_file_name,
    })
    .eq('band_id', bandId)
    .eq('id', playlistId)

  if (error) {
    await removePlaylistCoverStorageObject(uploadedCover?.bucket || null, uploadedCover?.path || null)
    throw new BandServiceError('Playlist could not be updated.', 500)
  }

  const playlistRow = await loadBandPlaylistRowById(supabase, bandId, playlistId)
  if (!playlistRow) {
    await removePlaylistCoverStorageObject(uploadedCover?.bucket || null, uploadedCover?.path || null)
    throw new BandServiceError('Playlist not found.', 404)
  }

  const trackCount = (await loadPlaylistTracks(playlistId, bandId)).length
  const coverWasReplaced =
    Boolean(uploadedCover) &&
    existingPlaylist.cover_storage_path &&
    existingPlaylist.cover_storage_path !== uploadedCover?.path

  if (coverWasReplaced || removeCurrentCover) {
    await removePlaylistCoverStorageObject(
      existingPlaylist.cover_storage_bucket,
      existingPlaylist.cover_storage_path
    )
  }

  const coverUrlMap = await resolvePlaylistCoverUrlMap([playlistRow])

  revalidatePath(`/dashboard/bands/${bandId}/demos`)
  revalidatePath(`/dashboard/bands/${bandId}/demos/playlists`)
  revalidatePath(`/dashboard/bands/${bandId}/demos/playlists/${playlistId}`)

  await writeAuditLog({
    action: 'band.demo_playlist_updated',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      requestId: requestContext.requestId,
      title: parsed.title,
    },
    targetId: playlistId,
    targetType: 'band_audio_playlist',
    userAgent: requestContext.userAgent,
  })

  return {
    ok: true,
    playlist: toPlaylistSummary(playlistRow, trackCount, coverUrlMap.get(playlistId)),
  }
}

export async function deleteBandPlaylist(
  userId: string,
  bandId: string,
  playlistId: string,
  requestContext: RequestContext
) {
  requireDemosEditor(await getBandDemosAccess(userId, bandId))
  const supabase = await createClient()
  let existingPlaylist: PlaylistRow | null
  try {
    existingPlaylist = await loadBandPlaylistRowById(supabase, bandId, playlistId)
  } catch {
    throw new BandServiceError('Playlist could not be loaded.', 500)
  }

  if (!existingPlaylist) {
    throw new BandServiceError('Playlist not found.', 404)
  }

  assertPlaylistIsEditable(existingPlaylist)

  const {error} = await supabase
    .from('band_audio_playlists')
    .delete()
    .eq('band_id', bandId)
    .eq('id', playlistId)

  if (error) {
    throw new BandServiceError('Playlist could not be deleted.', 500)
  }

  await removePlaylistCoverStorageObject(existingPlaylist.cover_storage_bucket, existingPlaylist.cover_storage_path)

  revalidatePath(`/dashboard/bands/${bandId}/demos`)
  revalidatePath(`/dashboard/bands/${bandId}/demos/playlists`)

  await writeAuditLog({
    action: 'band.demo_playlist_deleted',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      requestId: requestContext.requestId,
      title: existingPlaylist.title,
    },
    targetId: playlistId,
    targetType: 'band_audio_playlist',
    userAgent: requestContext.userAgent,
  })

  return {ok: true}
}

export async function addTrackToPlaylist(
  userId: string,
  bandId: string,
  playlistId: string,
  trackId: string,
  requestContext: RequestContext
) {
  requireDemosEditor(await getBandDemosAccess(userId, bandId))
  const supabase = await createClient()
  const [playlistRow, {data: trackRow}] = await Promise.all([
    loadBandPlaylistRowById(supabase, bandId, playlistId),
    supabase.from('band_audio_tracks').select('id').eq('band_id', bandId).eq('id', trackId).maybeSingle(),
  ])

  if (!playlistRow) {
    throw new BandServiceError('Playlist not found.', 404)
  }

  assertPlaylistIsEditable({system_key: playlistRow.system_key})

  if (!trackRow) {
    throw new BandServiceError('Track not found.', 404)
  }

  const {data: currentRows} = await supabase
    .from('band_audio_playlist_tracks')
    .select('sort_order')
    .eq('playlist_id', playlistId)
    .order('sort_order', {ascending: false})
    .limit(1)

  const nextSortOrder = (currentRows?.[0]?.sort_order || 0) + 1
  const {error} = await supabase.from('band_audio_playlist_tracks').insert({
    playlist_id: playlistId,
    track_id: trackId,
    sort_order: nextSortOrder,
  })

  if (error) {
    throw new BandServiceError('Track could not be added to the playlist.', 400)
  }

  revalidatePath(`/dashboard/bands/${bandId}/demos`)
  revalidatePath(`/dashboard/bands/${bandId}/demos/playlists`)
  revalidatePath(`/dashboard/bands/${bandId}/demos/playlists/${playlistId}`)

  await writeAuditLog({
    action: 'band.demo_playlist_track_added',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      playlistId,
      requestId: requestContext.requestId,
      trackId,
    },
    targetId: playlistId,
    targetType: 'band_audio_playlist',
    userAgent: requestContext.userAgent,
  })

  return {ok: true}
}

export async function removeTrackFromPlaylist(
  userId: string,
  bandId: string,
  playlistId: string,
  trackId: string,
  requestContext: RequestContext
) {
  requireDemosEditor(await getBandDemosAccess(userId, bandId))
  const supabase = await createClient()
  let playlistRow: PlaylistRow | null
  try {
    playlistRow = await loadBandPlaylistRowById(supabase, bandId, playlistId)
  } catch {
    throw new BandServiceError('Playlist could not be loaded.', 500)
  }

  if (!playlistRow) {
    throw new BandServiceError('Playlist not found.', 404)
  }

  assertPlaylistIsEditable({system_key: playlistRow.system_key})

  const {error} = await supabase
    .from('band_audio_playlist_tracks')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId)

  if (error) {
    throw new BandServiceError('Track could not be removed from the playlist.', 500)
  }

  revalidatePath(`/dashboard/bands/${bandId}/demos`)
  revalidatePath(`/dashboard/bands/${bandId}/demos/playlists`)
  revalidatePath(`/dashboard/bands/${bandId}/demos/playlists/${playlistId}`)

  await writeAuditLog({
    action: 'band.demo_playlist_track_removed',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      playlistId,
      requestId: requestContext.requestId,
      trackId,
    },
    targetId: playlistId,
    targetType: 'band_audio_playlist',
    userAgent: requestContext.userAgent,
  })

  return {ok: true}
}

export async function reorderPlaylistTracks(
  userId: string,
  bandId: string,
  playlistId: string,
  input: unknown,
  requestContext: RequestContext
) {
  requireDemosEditor(await getBandDemosAccess(userId, bandId))

  let parsed: PlaylistTrackOrderInput
  try {
    parsed = playlistTrackOrderSchema.parse(input)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BandServiceError('Invalid playlist order payload.', 400, {
        errors: getValidationIssues(error),
      })
    }

    throw error
  }

  const supabase = await createClient()
  let playlistRow: PlaylistRow | null
  try {
    playlistRow = await loadBandPlaylistRowById(supabase, bandId, playlistId)
  } catch {
    throw new BandServiceError('Playlist could not be loaded.', 500)
  }

  if (!playlistRow) {
    throw new BandServiceError('Playlist not found.', 404)
  }

  assertPlaylistIsEditable({system_key: playlistRow.system_key})

  const {data: currentRows, error} = await supabase
    .from('band_audio_playlist_tracks')
    .select('track_id')
    .eq('playlist_id', playlistId)

  if (error) {
    throw new BandServiceError('Playlist order could not be loaded.', 500)
  }

  const currentTrackIds = (currentRows || []).map((row) => row.track_id).sort()
  const incomingTrackIds = [...parsed.orderedTrackIds].sort()

  if (currentTrackIds.length !== incomingTrackIds.length || currentTrackIds.join('|') !== incomingTrackIds.join('|')) {
    throw new BandServiceError('Playlist order payload does not match current tracks.', 400)
  }

  await Promise.all(
    parsed.orderedTrackIds.map((trackId, index) =>
      supabase
        .from('band_audio_playlist_tracks')
        .update({sort_order: index + 1})
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId)
    )
  )

  revalidatePath(`/dashboard/bands/${bandId}/demos/playlists/${playlistId}`)

  await writeAuditLog({
    action: 'band.demo_playlist_reordered',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      orderedTrackIds: parsed.orderedTrackIds,
      playlistId,
      requestId: requestContext.requestId,
    },
    targetId: playlistId,
    targetType: 'band_audio_playlist',
    userAgent: requestContext.userAgent,
  })

  return {ok: true}
}
