import type {
  BandAudioPlaylistSummary,
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
}

export type DemosPlaylistRow = PlaylistRow

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
  row: PlaylistRow,
  trackCount: number,
  coverSignedUrl?: string | null
): BandAudioPlaylistSummary {
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
  }
}

export async function resolvePlaylistCoverUrlMap(playlists: PlaylistRow[]) {
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
