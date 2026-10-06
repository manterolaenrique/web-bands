import type {BandDemosHomePayload} from '@web-bands/bands-domain'
import {cache} from 'react'

import {createClient} from '@/lib/supabase/server'

import {
  ensureGeneralPlaylist,
  loadBandPlaylistRows,
  normalizeDemoQuery,
  requireDemosAccess,
  resolvePlaylistCoverUrlMap,
  sortPlaylistsForDisplay,
  toPlaylistSummary,
  toTrackSummary,
} from './shared'
import {getBandDemosAccess} from './shared'

type TrackRow = Parameters<typeof toTrackSummary>[0]
type PlaylistRow = Parameters<typeof toPlaylistSummary>[0]

async function loadRecentTrackRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bandId: string,
  normalizedQuery: string,
  limit: number
) {
  const likePattern = `%${normalizedQuery}%`

  let trackQuery = supabase
    .from('band_audio_tracks')
    .select(
      'id, band_id, title, description, related_song_title, storage_bucket, storage_path, original_file_name, mime_type, file_size_bytes, duration_seconds, track_type, track_status, uploaded_by, is_downloadable, created_at, updated_at'
    )
    .eq('band_id', bandId)
    .order('created_at', {ascending: false})
    .limit(limit)

  if (normalizedQuery) {
    trackQuery = trackQuery.or(
      `title.ilike.${likePattern},description.ilike.${likePattern},related_song_title.ilike.${likePattern}`
    )
  }

  const {data} = await trackQuery
  return (data || []) as TrackRow[]
}

export const getBandDemosRecentTracks = cache(async function getBandDemosRecentTracks(
  userId: string,
  bandId: string,
  query?: string | null,
  limit = 8
) {
  requireDemosAccess(await getBandDemosAccess(userId, bandId))
  await ensureGeneralPlaylist(bandId, userId)
  const supabase = await createClient()
  const normalizedQuery = normalizeDemoQuery(query)
  const trackRows = await loadRecentTrackRows(supabase, bandId, normalizedQuery, limit)

  return trackRows.map((row) => toTrackSummary(row))
})

export const getBandDemosHome = cache(async function getBandDemosHome(
  userId: string,
  bandId: string,
  query?: string | null
): Promise<BandDemosHomePayload | null> {
  const access = requireDemosAccess(await getBandDemosAccess(userId, bandId))
  await ensureGeneralPlaylist(bandId, userId)
  const supabase = await createClient()
  const normalizedQuery = normalizeDemoQuery(query)

  const [trackRows, playlistRows, {count: totalTracks}, {count: totalPlaylists}] =
    await Promise.all([
      loadRecentTrackRows(supabase, bandId, normalizedQuery, 8),
      loadBandPlaylistRows(supabase, bandId, {query: normalizedQuery, limit: 6}),
      supabase
        .from('band_audio_tracks')
        .select('id', {head: true, count: 'exact'})
        .eq('band_id', bandId),
      supabase
        .from('band_audio_playlists')
        .select('id', {head: true, count: 'exact'})
        .eq('band_id', bandId),
    ])

  const typedPlaylists = playlistRows as PlaylistRow[]
  const coverUrlMap = await resolvePlaylistCoverUrlMap(typedPlaylists)
  const playlistIds = typedPlaylists.map((playlist) => playlist.id)
  const {data: playlistTrackRows} =
    playlistIds.length > 0
      ? await supabase
          .from('band_audio_playlist_tracks')
          .select('playlist_id')
          .in('playlist_id', playlistIds)
      : {data: [] as Array<{playlist_id: string}>}

  const trackCountMap = (playlistTrackRows || []).reduce<Map<string, number>>((result, row) => {
    result.set(row.playlist_id, (result.get(row.playlist_id) || 0) + 1)
    return result
  }, new Map())

  const playlists = sortPlaylistsForDisplay(
    typedPlaylists.map((playlist) =>
      toPlaylistSummary(playlist, trackCountMap.get(playlist.id) || 0, coverUrlMap.get(playlist.id))
    )
  )

  return {
    band: access.band,
    role: access.role,
    canEdit: access.canEdit,
    query: normalizedQuery,
    featuredTrack: trackRows[0] ? toTrackSummary(trackRows[0]) : null,
    recentTracks: trackRows.map((row) => toTrackSummary(row)),
    playlists,
    totalTracks: totalTracks || 0,
    totalPlaylists: totalPlaylists || 0,
  }
})
