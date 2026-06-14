import {z} from 'zod'

import type {BandMemberRole, SupabaseBand} from './types'

const optionalTrimmedString = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional()

const requiredTrimmedString = (min: number, max: number) => z.string().trim().min(min).max(max)

export const BAND_AUDIO_TRACK_TYPES = [
  'idea',
  'riff',
  'demo',
  'ensayo',
  'pre_mezcla',
  'mezcla',
  'final',
  'referencia',
] as const

export const BAND_AUDIO_TRACK_STATUSES = [
  'nuevo',
  'en_revision',
  'para_ensayar',
  'aprobado',
  'descartado',
  'final',
] as const

export const BAND_AUDIO_ACCESS_MODES = ['stream', 'download'] as const
export const PLAYBACK_SOURCE_TYPES = ['track_detail', 'demos_list', 'featured', 'playlist'] as const

export type BandAudioTrackType = (typeof BAND_AUDIO_TRACK_TYPES)[number]
export type BandAudioTrackStatus = (typeof BAND_AUDIO_TRACK_STATUSES)[number]
export type BandAudioAccessMode = (typeof BAND_AUDIO_ACCESS_MODES)[number]
export type PlaybackSourceType = (typeof PLAYBACK_SOURCE_TYPES)[number]

export type BandWorkspaceSummary = Pick<SupabaseBand, 'id' | 'name' | 'slug' | 'status'>

export type BandAudioTrackSummary = {
  id: string
  bandId: string
  title: string
  description?: string
  relatedSongTitle?: string
  storageBucket: string
  storagePath: string
  originalFileName: string
  mimeType: string
  fileSizeBytes: number
  durationSeconds: number | null
  trackType: BandAudioTrackType
  trackStatus: BandAudioTrackStatus
  uploadedBy: string
  uploadedByName?: string | null
  isDownloadable: boolean
  createdAt: string
  updatedAt: string
}

export type BandAudioTrackDetail = BandAudioTrackSummary & {
  band: BandWorkspaceSummary
  role: BandMemberRole
  canEdit: boolean
  canDownload: boolean
}

export const BAND_AUDIO_PLAYLIST_SYSTEM_KEYS = ['general'] as const

export type BandAudioPlaylistSystemKey = (typeof BAND_AUDIO_PLAYLIST_SYSTEM_KEYS)[number]

export type BandAudioPlaylistSummary = {
  id: string
  bandId: string
  title: string
  description?: string
  coverAssetPath?: string
  coverSignedUrl?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  trackCount: number
  systemKey: BandAudioPlaylistSystemKey | null
  isLocked: boolean
}

export type BandAudioPlaylistTrack = {
  id: string
  playlistId: string
  trackId: string
  sortOrder: number
  createdAt: string
  track: BandAudioTrackSummary
}

export type BandAudioPlaylistDetail = BandAudioPlaylistSummary & {
  band: BandWorkspaceSummary
  role: BandMemberRole
  canEdit: boolean
  tracks: BandAudioPlaylistTrack[]
}

export type BandDemosHomePayload = {
  band: BandWorkspaceSummary
  role: BandMemberRole
  canEdit: boolean
  query: string
  featuredTrack: BandAudioTrackSummary | null
  recentTracks: BandAudioTrackSummary[]
  playlists: BandAudioPlaylistSummary[]
  totalTracks: number
  totalPlaylists: number
}

export type PlaybackQueueItem = {
  id: string
  bandId: string
  title: string
  durationSeconds: number | null
  trackType: BandAudioTrackType
}

export type PlaybackSourceContext = {
  sourceType: PlaybackSourceType
  sourceId?: string | null
}

export type PlaybackSession = PlaybackSourceContext & {
  queue: PlaybackQueueItem[]
  currentIndex: number
}

export type BandTrackAccessPayload = {
  url: string
  expiresInSeconds: number
  fileName: string
  mode: BandAudioAccessMode
}

const trackMetadataSchema = z.object({
  title: requiredTrimmedString(2, 160),
  description: optionalTrimmedString(2000),
  relatedSongTitle: optionalTrimmedString(120),
  trackType: z.enum(BAND_AUDIO_TRACK_TYPES),
  trackStatus: z.enum(BAND_AUDIO_TRACK_STATUSES),
  isDownloadable: z.boolean().default(true),
  durationSeconds: z.number().int().positive().max(14400).nullable().optional(),
})

const optionalPlaylistId = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .pipe(z.string().uuid().optional())

export const trackUploadSchema = trackMetadataSchema.extend({
  playlistId: optionalPlaylistId,
})

export const trackUpdateSchema = trackMetadataSchema.extend({
  durationSeconds: z.number().int().positive().max(14400).nullable().optional(),
})

export const playlistSchema = z.object({
  title: requiredTrimmedString(2, 120),
  description: optionalTrimmedString(400),
  coverAction: z.enum(['keep', 'remove']).default('keep'),
})

export const playlistTrackOrderSchema = z.object({
  orderedTrackIds: z.array(z.string().uuid()).min(1),
})

export const trackAccessSchema = z.object({
  mode: z.enum(BAND_AUDIO_ACCESS_MODES),
})

export type TrackUploadInput = z.infer<typeof trackUploadSchema>
export type TrackUpdateInput = z.infer<typeof trackUpdateSchema>
export type PlaylistInput = z.infer<typeof playlistSchema>
export type PlaylistTrackOrderInput = z.infer<typeof playlistTrackOrderSchema>
export type TrackAccessInput = z.infer<typeof trackAccessSchema>
