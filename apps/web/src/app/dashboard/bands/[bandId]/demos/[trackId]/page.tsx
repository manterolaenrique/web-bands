import {notFound} from 'next/navigation'

import {TrackDetailWorkspace} from '@/components/demos/TrackDetailWorkspace'
import {requireUser} from '@/lib/auth/session'
import {getBandEditorPayload} from '@/server/bands/editor-payload'
import {getBandDemosRecentTracks} from '@/server/demos/home'
import {getBandPlaylist, getBandPlaylistSummaries} from '@/server/demos/playlists'
import {getBandTrack} from '@/server/demos/tracks'

type PageProps = {
  params: Promise<{
    bandId: string
    trackId: string
  }>
  searchParams: Promise<{
    playlistId?: string
    sheet?: string
    source?: string
  }>
}

export default async function BandDemoTrackPage({params, searchParams}: PageProps) {
  const {bandId, trackId} = await params
  const {playlistId, sheet, source} = await searchParams
  const user = await requireUser()
  const [track, playlistsData, playlistContext, demosContext, editorPayload] = await Promise.all([
    getBandTrack(user.id, bandId, trackId),
    getBandPlaylistSummaries(user.id, bandId, null),
    playlistId ? getBandPlaylist(user.id, bandId, playlistId) : Promise.resolve(null),
    source === 'demos' ? getBandDemosRecentTracks(user.id, bandId, null) : Promise.resolve(null),
    getBandEditorPayload(user.id, bandId),
  ])

  if (!track || !editorPayload) {
    notFound()
  }

  const playbackContext = playlistContext
    ? {
        queueTracks: playlistContext.tracks.map((item) => item.track),
        source: {sourceType: 'playlist' as const, sourceId: playlistContext.id},
        sourceHref: `/dashboard/bands/${bandId}/demos/playlists/${playlistContext.id}`,
        sourceLabel: playlistContext.title,
      }
    : demosContext
      ? {
          queueTracks: demosContext,
          source: {sourceType: 'demos_list' as const},
          sourceHref: `/dashboard/bands/${bandId}/demos`,
          sourceLabel: 'Demos',
        }
      : null

  return (
    <TrackDetailWorkspace
      key={[
        track.id,
        track.title,
        track.description || '',
        track.relatedSongTitle || '',
        track.trackType,
        track.trackStatus,
        track.isDownloadable ? '1' : '0',
        sheet === 'edit' ? 'edit' : 'view',
      ].join(':')}
      bandId={bandId}
      track={track}
      initialPlaylists={playlistsData}
      queueTracks={playbackContext?.queueTracks}
      source={playbackContext?.source}
      sourceHref={playbackContext?.sourceHref}
      sourceLabel={playbackContext?.sourceLabel}
      initialEditOpen={sheet === 'edit'}
      publicBandHref={editorPayload.publicBandHref}
      canManage={editorPayload.canManage}
    />
  )
}
