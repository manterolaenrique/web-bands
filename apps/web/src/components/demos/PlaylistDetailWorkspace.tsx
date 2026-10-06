'use client'

import {useState} from 'react'

import type {
  BandAudioPlaylistDetail,
  BandAudioPlaylistSummary,
  BandAudioPlaylistTrack,
  BandStatus,
} from '@web-bands/bands-domain'

import {BandWorkspaceHeader} from '@/components/dashboard/BandWorkspaceHeader'
import {BandWorkspaceNav} from '@/components/demos/BandWorkspaceNav'
import {PlayPlaylistButton} from '@/components/demos/PlayPlaylistButton'
import {PlaylistFormSheet} from '@/components/demos/PlaylistFormSheet'
import {PlaylistTracksManager} from '@/components/demos/PlaylistTracksManager'

function mergePlaylistDetail(
  current: BandAudioPlaylistDetail,
  nextPlaylist: BandAudioPlaylistSummary
): BandAudioPlaylistDetail {
  return {
    ...current,
    ...nextPlaylist,
  }
}

export function PlaylistDetailWorkspace({
  bandId,
  initialPlaylist,
  publicBandHref = null,
  canManage = false,
}: {
  bandId: string
  initialPlaylist: BandAudioPlaylistDetail
  publicBandHref?: string | null
  canManage?: boolean
}) {
  const [playlist, setPlaylist] = useState(initialPlaylist)
  const [tracks, setTracks] = useState<BandAudioPlaylistTrack[]>(initialPlaylist.tracks)

  return (
    <div className="demos-screen">
      <BandWorkspaceHeader
        bandId={bandId}
        bandName={playlist.band.name}
        bandStatus={playlist.band.status as BandStatus}
        publicBandHref={publicBandHref}
        canManage={canManage}
        activeSection="demos"
        eyebrow="Herramientas privadas · Playlist"
        description={playlist.description || 'Coleccion privada para organizar audios y sesiones internas.'}
        actions={
          playlist.canEdit && !playlist.isLocked ? (
            <PlaylistFormSheet
              bandId={bandId}
              playlistId={playlist.id}
              triggerLabel="Editar playlist"
              title="Editar playlist"
              initialTitle={playlist.title}
              initialDescription={playlist.description || ''}
              initialCoverUrl={playlist.coverSignedUrl || ''}
              onSuccess={(nextPlaylist) => {
                setPlaylist((current) => mergePlaylistDetail(current, nextPlaylist))
              }}
            />
          ) : null
        }
      />

      <BandWorkspaceNav bandId={bandId} active="playlists" />

      <section className="demos-featured-card demos-featured-card--playlist">
        {playlist.coverSignedUrl ? (
          <div className="demos-featured-card__cover">
            <img src={playlist.coverSignedUrl} alt="" />
          </div>
        ) : null}
        <div className="demos-featured-card__copy">
          <p className="eyebrow">Coleccion actual</p>
          <div className="demos-playlist-card__title-row">
            <h2>{playlist.title}</h2>
            {playlist.isLocked ? <span className="demos-playlist-badge">Automatica</span> : null}
          </div>
          <p>{tracks.length} audios privados</p>
          {playlist.isLocked ? (
            <p className="demos-inline-note">Se completa automaticamente con cada audio nuevo de la banda.</p>
          ) : null}
        </div>
        <div className="demos-featured-card__actions">
          <PlayPlaylistButton
            bandId={bandId}
            playlistId={playlist.id}
            sourceHref={`/dashboard/bands/${bandId}/demos/playlists/${playlist.id}`}
            sourceLabel={playlist.title}
            className="button button--primary"
            disabled={tracks.length === 0}
          >
            Reproducir playlist
          </PlayPlaylistButton>
        </div>
      </section>

      <PlaylistTracksManager
        bandId={bandId}
        playlistId={playlist.id}
        playlistTitle={playlist.title}
        tracks={tracks}
        canEdit={playlist.canEdit}
        isLocked={playlist.isLocked}
        onTracksChange={setTracks}
      />
    </div>
  )
}
