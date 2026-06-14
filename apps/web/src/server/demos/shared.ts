import type {
  BandAudioPlaylistSummary,
  BandAudioPlaylistSystemKey,
  BandAudioTrackSummary,
  BandMemberRole,
  BandWorkspaceSummary,
} from '@web-bands/bands-domain'

import {canEditBand, canManageBand, getMembershipRole} from '@/lib/auth/permissions'
import {isSupabaseAdminConfigured} from '@/lib/env'
import {createAdminClient} from '@/lib/supabase/admin'
import {createClient} from '@/lib/supabase/server'
import {BandServiceError} from '@/server/bands/service-error'

export const DEMOS_BUCKET = 'band-demos'
export const DEMOS_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024
export const DEMOS_ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/ogg',
])
export const DEMOS_SIGNED_URL_TTL_SECONDS = 60 * 10
export const DEMOS_ALLOWED_COVER_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
])
export const DEMOS_MAX_COVER_FILE_SIZE_BYTES = 5 * 1024 * 1024
export const GENERAL_PLAYLIST_SYSTEM_KEY: BandAudioPlaylistSystemKey = 'general'
export const GENERAL_PLAYLIST_TITLE = 'General'

type TrackRow = {
  id: string
  band_id: string
  title: string
  description: string | null
  related_song_title: string | null
  storage_bucket: string
  storage_path: string
  original_file_name: string
  mime_type: string
  file_size_bytes: number
  duration_seconds: number | null
  track_type: BandAudioTrackSummary['trackType']
  track_status: BandAudioTrackSummary['trackStatus']
  uploaded_by: string
  is_downloadable: boolean
  created_at: string
  updated_at: string
}

type PlaylistRow = {
  id: string
  band_id: string
  title: string
  description: string | null
  cover_storage_bucket: string | null
  cover_storage_path: string | null
  cover_original_file_name: string | null
  created_by: string
  created_at: string
  updated_at: string
  system_key: BandAudioPlaylistSystemKey | null
}

export type DemosPlaylistRow = PlaylistRow
type PlaylistRowInput = Omit<PlaylistRow, 'system_key'> & {system_key?: string | null}

export type DemosAccess = {
  role: BandMemberRole
  band: BandWorkspaceSummary
  canEdit: boolean
  canManage: boolean
}

async function createDemosPermissionClient() {
  if (isSupabaseAdminConfigured()) {
    return createAdminClient()
  }

  return createClient()
}

export async function getBandDemosAccess(userId: string, bandId: string): Promise<DemosAccess | null> {
  const supabase = await createDemosPermissionClient()
  const role = await getMembershipRole(supabase, bandId, userId)

  if (!role) {
    return null
  }

  const {data: bandRow, error} = await supabase
    .from('bands')
    .select('id, name, slug, status')
    .eq('id', bandId)
    .maybeSingle()

  if (error || !bandRow) {
    return null
  }

  return {
    role,
    band: bandRow as BandWorkspaceSummary,
    canEdit: canEditBand(role),
    canManage: canManageBand(role),
  }
}

function normalizePlaylistSystemKey(value: string | null): BandAudioPlaylistSystemKey | null {
  return value === GENERAL_PLAYLIST_SYSTEM_KEY ? GENERAL_PLAYLIST_SYSTEM_KEY : null
}

function inferLegacyPlaylistSystemKey(title: string) {
  return title === GENERAL_PLAYLIST_TITLE ? GENERAL_PLAYLIST_SYSTEM_KEY : null
}

export function isLockedPlaylistSystemKey(value: string | null | undefined) {
  return normalizePlaylistSystemKey(value || null) !== null
}

export function isMissingSystemKeyColumnError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as {code?: string; details?: string; message?: string}
  const haystack = `${candidate.message || ''} ${candidate.details || ''}`.toLowerCase()

  return candidate.code === '42703' || haystack.includes('system_key')
}

export function requireDemosAccess(access: DemosAccess | null) {
  if (!access) {
    throw new BandServiceError('Band not found.', 404)
  }

  return access
}

export function requireDemosEditor(access: DemosAccess | null) {
  const resolved = requireDemosAccess(access)

  if (!resolved.canEdit) {
    throw new BandServiceError('You do not have permission to manage demos for this band.', 403)
  }

  return resolved
}

export function requireDemosAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    throw new BandServiceError('Supabase admin config is required for private demos.', 503)
  }

  return createAdminClient()
}

export function normalizeDemoQuery(value: string | null | undefined) {
  return (value || '').trim()
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

export function getFileExtension(fileName: string) {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : ''
}

export function buildTrackStoragePath(bandId: string, trackId: string, originalFileName: string) {
  const extension = getFileExtension(originalFileName) || 'bin'
  const safeBase = slugifySegment(originalFileName.replace(/\.[^.]+$/, '')) || 'demo'
  return `${bandId}/${trackId}/${safeBase}.${extension}`
}

export function buildPlaylistCoverStoragePath(bandId: string, playlistId: string, originalFileName: string) {
  const extension = getFileExtension(originalFileName) || 'bin'
  const safeBase = slugifySegment(originalFileName.replace(/\.[^.]+$/, '')) || 'cover'
  const suffix = crypto.randomUUID().slice(0, 8)
  return `${bandId}/playlists/${playlistId}/${safeBase}-${suffix}.${extension}`
}

export function buildTrackDownloadName(
  bandSlug: string,
  title: string,
  trackType: BandAudioTrackSummary['trackType'],
  createdAt: string,
  originalFileName: string
) {
  const date = new Date(createdAt)
  const extension = getFileExtension(originalFileName) || 'bin'
  const safeBand = slugifySegment(bandSlug) || 'band'
  const safeTitle = slugifySegment(title) || 'demo'
  const safeType = slugifySegment(trackType.replace(/_/g, '-')) || 'audio'
  const safeDate = Number.isNaN(date.getTime())
    ? 'sin-fecha'
    : `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`

  return `${safeBand}_${safeTitle}_${safeType}_${safeDate}.${extension}`
}

export function toTrackSummary(row: TrackRow): BandAudioTrackSummary {
  return {
    id: row.id,
    bandId: row.band_id,
    title: row.title,
    description: row.description || undefined,
    relatedSongTitle: row.related_song_title || undefined,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    originalFileName: row.original_file_name,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes,
    durationSeconds: row.duration_seconds,
    trackType: row.track_type,
    trackStatus: row.track_status,
    uploadedBy: row.uploaded_by,
    isDownloadable: row.is_downloadable,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toPlaylistSummary(
  row: PlaylistRowInput,
  trackCount: number,
  coverSignedUrl?: string | null
): BandAudioPlaylistSummary {
  const systemKey =
    normalizePlaylistSystemKey(typeof row.system_key === 'string' ? row.system_key : null) ||
    inferLegacyPlaylistSystemKey(row.title)

  return {
    id: row.id,
    bandId: row.band_id,
    title: row.title,
    description: row.description || undefined,
    coverAssetPath: row.cover_storage_path || undefined,
    coverSignedUrl: coverSignedUrl || undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    trackCount,
    systemKey,
    isLocked: systemKey !== null,
  }
}

export function sortPlaylistsForDisplay<T extends {systemKey: BandAudioPlaylistSystemKey | null; updatedAt: string}>(
  playlists: T[]
) {
  return [...playlists].sort((left, right) => {
    if (left.systemKey === GENERAL_PLAYLIST_SYSTEM_KEY && right.systemKey !== GENERAL_PLAYLIST_SYSTEM_KEY) {
      return -1
    }

    if (right.systemKey === GENERAL_PLAYLIST_SYSTEM_KEY && left.systemKey !== GENERAL_PLAYLIST_SYSTEM_KEY) {
      return 1
    }

    return Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
  })
}

export async function resolvePlaylistCoverUrlMap(playlists: PlaylistRowInput[]) {
  const rowsWithCover = playlists.filter((playlist) => playlist.cover_storage_bucket && playlist.cover_storage_path)
  if (rowsWithCover.length === 0) {
    return new Map<string, string>()
  }

  try {
    const admin = requireDemosAdminClient()
    const signedEntries = await Promise.all(
      rowsWithCover.map(async (playlist) => {
        const {data, error} = await admin.storage
          .from(playlist.cover_storage_bucket as string)
          .createSignedUrl(playlist.cover_storage_path as string, DEMOS_SIGNED_URL_TTL_SECONDS)

        if (error || !data?.signedUrl) {
          return null
        }

        return [playlist.id, data.signedUrl] as const
      })
    )

    return signedEntries.reduce<Map<string, string>>((result, entry) => {
      if (entry) {
        result.set(entry[0], entry[1])
      }

      return result
    }, new Map())
  } catch {
    return new Map<string, string>()
  }
}

export const PLAYLIST_SELECT_FIELDS_BASE =
  'id, band_id, title, description, cover_storage_bucket, cover_storage_path, cover_original_file_name, created_by, created_at, updated_at' as const

export const PLAYLIST_SELECT_FIELDS =
  `${PLAYLIST_SELECT_FIELDS_BASE}, system_key` as const

function normalizePlaylistRow(row: PlaylistRowInput): PlaylistRow {
  return {
    ...row,
    system_key:
      normalizePlaylistSystemKey(typeof row.system_key === 'string' ? row.system_key : null) ||
      inferLegacyPlaylistSystemKey(row.title),
  }
}

export async function loadBandPlaylistRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bandId: string,
  options?: {
    query?: string | null
    limit?: number
  }
) {
  const normalizedQuery = (options?.query || '').trim()
  const likePattern = `%${normalizedQuery}%`

  const run = (fields: string) => {
    let query = supabase.from('band_audio_playlists').select(fields).eq('band_id', bandId).order('updated_at', {ascending: false})

    if (normalizedQuery) {
      query = query.or(`title.ilike.${likePattern},description.ilike.${likePattern}`)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    return query
  }

  const primary = await run(PLAYLIST_SELECT_FIELDS)
  if (!primary.error) {
    return ((primary.data as unknown as PlaylistRowInput[]) || []).map((row) => normalizePlaylistRow(row))
  }

  if (!isMissingSystemKeyColumnError(primary.error)) {
    throw primary.error
  }

  const fallback = await run(PLAYLIST_SELECT_FIELDS_BASE)
  if (fallback.error) {
    throw fallback.error
  }

  return ((fallback.data as unknown as PlaylistRowInput[]) || []).map((row) => normalizePlaylistRow(row))
}

export async function loadBandPlaylistRowById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bandId: string,
  playlistId: string
) {
  const run = (fields: string) =>
    supabase.from('band_audio_playlists').select(fields).eq('band_id', bandId).eq('id', playlistId).maybeSingle()

  const primary = await run(PLAYLIST_SELECT_FIELDS)
  if (!primary.error) {
    return primary.data ? normalizePlaylistRow(primary.data as unknown as PlaylistRowInput) : null
  }

  if (!isMissingSystemKeyColumnError(primary.error)) {
    throw primary.error
  }

  const fallback = await run(PLAYLIST_SELECT_FIELDS_BASE)
  if (fallback.error) {
    throw fallback.error
  }

  return fallback.data ? normalizePlaylistRow(fallback.data as unknown as PlaylistRowInput) : null
}

export async function ensureGeneralPlaylist(bandId: string, currentUserId: string) {
  const supabase = await createClient()
  let existingPlaylist: PlaylistRow | null = null
  let legacyMode = false

  const primaryLookup = await supabase
    .from('band_audio_playlists')
    .select(PLAYLIST_SELECT_FIELDS)
    .eq('band_id', bandId)
    .eq('system_key', GENERAL_PLAYLIST_SYSTEM_KEY)
    .maybeSingle()

  if (!primaryLookup.error) {
    existingPlaylist = primaryLookup.data ? normalizePlaylistRow(primaryLookup.data as unknown as PlaylistRowInput) : null
    if (!existingPlaylist) {
      const titleFallback = await supabase
        .from('band_audio_playlists')
        .select(PLAYLIST_SELECT_FIELDS)
        .eq('band_id', bandId)
        .eq('title', GENERAL_PLAYLIST_TITLE)
        .maybeSingle()

      if (!titleFallback.error && titleFallback.data) {
        existingPlaylist = normalizePlaylistRow(titleFallback.data as unknown as PlaylistRowInput)

        if (!existingPlaylist.system_key) {
          await supabase
            .from('band_audio_playlists')
            .update({system_key: GENERAL_PLAYLIST_SYSTEM_KEY})
            .eq('band_id', bandId)
            .eq('id', existingPlaylist.id)
        }
      }
    }
  } else if (isMissingSystemKeyColumnError(primaryLookup.error)) {
    legacyMode = true
    const fallbackLookup = await supabase
      .from('band_audio_playlists')
      .select(PLAYLIST_SELECT_FIELDS_BASE)
      .eq('band_id', bandId)
      .eq('title', GENERAL_PLAYLIST_TITLE)
      .maybeSingle()

    if (fallbackLookup.error) {
      throw new BandServiceError('General playlist could not be loaded.', 500)
    }

    existingPlaylist = fallbackLookup.data ? normalizePlaylistRow(fallbackLookup.data as unknown as PlaylistRowInput) : null
  } else {
    throw new BandServiceError('General playlist could not be loaded.', 500)
  }

  if (existingPlaylist) {
    return existingPlaylist
  }

  const {data: bandRow, error: bandError} = await supabase
    .from('bands')
    .select('created_by')
    .eq('id', bandId)
    .maybeSingle()

  if (bandError || !bandRow) {
    throw new BandServiceError('Band not found.', 404)
  }

  const writeClient = isSupabaseAdminConfigured() ? createAdminClient() : supabase
  const creatorId = bandRow.created_by || currentUserId
  const {data: insertedPlaylist, error: insertPlaylistError} = await writeClient
    .from('band_audio_playlists')
    .insert({
      band_id: bandId,
      title: GENERAL_PLAYLIST_TITLE,
      description: null,
      created_by: creatorId,
      ...(legacyMode ? {} : {system_key: GENERAL_PLAYLIST_SYSTEM_KEY}),
    })
    .select(legacyMode ? PLAYLIST_SELECT_FIELDS_BASE : PLAYLIST_SELECT_FIELDS)
    .maybeSingle()

  if (insertPlaylistError) {
    const concurrentPlaylist = legacyMode
      ? await supabase
          .from('band_audio_playlists')
          .select(PLAYLIST_SELECT_FIELDS_BASE)
          .eq('band_id', bandId)
          .eq('title', GENERAL_PLAYLIST_TITLE)
          .maybeSingle()
      : await supabase
          .from('band_audio_playlists')
          .select(PLAYLIST_SELECT_FIELDS)
          .eq('band_id', bandId)
          .eq('system_key', GENERAL_PLAYLIST_SYSTEM_KEY)
          .maybeSingle()

    if (concurrentPlaylist.data) {
      return normalizePlaylistRow(concurrentPlaylist.data as unknown as PlaylistRowInput)
    }

    throw new BandServiceError('General playlist could not be created.', 500)
  }

  if (!insertedPlaylist) {
    throw new BandServiceError('General playlist could not be created.', 500)
  }

  const insertedPlaylistRow = insertedPlaylist as unknown as PlaylistRowInput & {id: string}

  const {data: trackRows, error: tracksError} = await supabase
    .from('band_audio_tracks')
    .select('id, created_at')
    .eq('band_id', bandId)
    .order('created_at', {ascending: true})

  if (tracksError) {
    throw new BandServiceError('General playlist tracks could not be loaded.', 500)
  }

  if ((trackRows || []).length > 0) {
    const {error: playlistTracksError} = await writeClient.from('band_audio_playlist_tracks').upsert(
      (trackRows || []).map((track, index) => ({
        playlist_id: insertedPlaylistRow.id,
        track_id: track.id,
        sort_order: index + 1,
      })),
      {
        onConflict: 'playlist_id,track_id',
        ignoreDuplicates: true,
      }
    )

    if (playlistTracksError) {
      throw new BandServiceError('General playlist tracks could not be created.', 500)
    }
  }

  return normalizePlaylistRow(insertedPlaylistRow)
}
