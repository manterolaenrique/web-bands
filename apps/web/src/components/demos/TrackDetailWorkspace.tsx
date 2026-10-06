'use client'

import {useState} from 'react'

import type {
  BandAudioPlaylistSummary,
  BandStatus,
  BandAudioTrackDetail,
  BandAudioTrackSummary,
  PlaybackSourceContext,
} from '@web-bands/bands-domain'

import {BandWorkspaceHeader} from '@/components/dashboard/BandWorkspaceHeader'
import {BandWorkspaceNav} from '@/components/demos/BandWorkspaceNav'
import {PlaylistFormSheet} from '@/components/demos/PlaylistFormSheet'
import {TrackDetailPlayer} from '@/components/demos/TrackDetailPlayer'
import {TrackEditSheet} from '@/components/demos/TrackEditSheet'

function upsertPlaylist(
  currentPlaylists: BandAudioPlaylistSummary[],
  nextPlaylist: BandAudioPlaylistSummary
) {
  const existingIndex = currentPlaylists.findIndex((playlist) => playlist.id === nextPlaylist.id)
  const nextPlaylists =
    existingIndex >= 0
      ? currentPlaylists.map((playlist) => (playlist.id === nextPlaylist.id ? nextPlaylist : playlist))
      : [...currentPlaylists, nextPlaylist]

  return [...nextPlaylists].sort((left, right) => {
    if (left.isLocked !== right.isLocked) {
      return left.isLocked ? -1 : 1
    }

    return left.title.localeCompare(right.title, 'es')
  })
}

export function TrackDetailWorkspace({
  bandId,
  track,
  initialPlaylists,
  queueTracks,
  source,
  sourceHref,
  sourceLabel,
  initialEditOpen = false,
  publicBandHref = null,
  canManage = false,
}: {
  bandId: string
  track: BandAudioTrackDetail
  initialPlaylists: BandAudioPlaylistSummary[]
  queueTracks?: BandAudioTrackSummary[]
  source?: PlaybackSourceContext
  sourceHref?: string | null
  sourceLabel?: string | null
  initialEditOpen?: boolean
  publicBandHref?: string | null
  canManage?: boolean
}) {
  const [playlists, setPlaylists] = useState(initialPlaylists)

  return (
    <div className="demos-screen">
      <BandWorkspaceHeader
        bandId={bandId}
        bandName={track.band.name}
        bandStatus={track.band.status as BandStatus}
        publicBandHref={publicBandHref}
        canManage={canManage}
        activeSection="demos"
        eyebrow="Herramientas privadas · Reproductor"
        description="Detalle del audio, notas y acciones privadas de la banda."
        actions={
          track.canEdit ? (
            <>
              <TrackEditSheet bandId={bandId} track={track} initialOpen={initialEditOpen} />
              <PlaylistFormSheet
                bandId={bandId}
                triggerLabel="Nueva playlist"
                onSuccess={(nextPlaylist) => {
                  setPlaylists((current) => upsertPlaylist(current, nextPlaylist))
                }}
              />
            </>
          ) : null
        }
      />

      <BandWorkspaceNav bandId={bandId} active="demos" />

      <TrackDetailPlayer
        bandId={bandId}
        track={track}
        playlists={playlists}
        queueTracks={queueTracks}
        source={source}
        sourceHref={sourceHref}
        sourceLabel={sourceLabel}
      />
    </div>
  )
}
