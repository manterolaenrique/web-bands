import {notFound} from 'next/navigation'

import {BandWorkspaceNav} from '@/components/demos/BandWorkspaceNav'
import {PlayPlaylistButton} from '@/components/demos/PlayPlaylistButton'
import {PlaylistFormSheet} from '@/components/demos/PlaylistFormSheet'
import {PlaylistTracksManager} from '@/components/demos/PlaylistTracksManager'
import {requireUser} from '@/lib/auth/session'
import {getBandPlaylist} from '@/server/demos/playlists'

type PageProps = {
  params: Promise<{
    bandId: string
    playlistId: string
  }>
}

export default async function BandPlaylistDetailPage({params}: PageProps) {
  const {bandId, playlistId} = await params
  const user = await requireUser()
  const payload = await getBandPlaylist(user.id, bandId, playlistId)

  if (!payload) {
    notFound()
  }

  return (
    <div className="demos-screen">
      <header className="dashboard-header editor-page-header demos-page-header">
        <div>
          <p className="eyebrow">Playlist privada</p>
          <h1 className="dashboard-title">{payload.title}</h1>
          <p className="muted">{payload.description || 'Coleccion privada para organizar audios y sesiones internas.'}</p>
        </div>
        {payload.canEdit && !payload.isLocked ? (
          <PlaylistFormSheet
            bandId={bandId}
            playlistId={playlistId}
            triggerLabel="Editar playlist"
            title="Editar playlist"
            initialTitle={payload.title}
            initialDescription={payload.description || ''}
            initialCoverUrl={payload.coverSignedUrl || ''}
          />
        ) : null}
      </header>

      <BandWorkspaceNav bandId={bandId} active="playlists" />

      <section className="demos-featured-card demos-featured-card--playlist">
        {payload.coverSignedUrl ? (
          <div className="demos-featured-card__cover">
            <img src={payload.coverSignedUrl} alt="" />
          </div>
        ) : null}
        <div className="demos-featured-card__copy">
          <p className="eyebrow">Coleccion actual</p>
          <div className="demos-playlist-card__title-row">
            <h2>{payload.title}</h2>
            {payload.isLocked ? <span className="demos-playlist-badge">Automatica</span> : null}
          </div>
          <p>{payload.tracks.length} audios privados</p>
          {payload.isLocked ? (
            <p className="demos-inline-note">Se completa automaticamente con cada audio nuevo de la banda.</p>
          ) : null}
        </div>
        <div className="demos-featured-card__actions">
          <PlayPlaylistButton
            bandId={bandId}
            playlistId={playlistId}
            className="button button--primary"
            disabled={payload.tracks.length === 0}
          >
            Reproducir playlist
          </PlayPlaylistButton>
        </div>
      </section>

      <PlaylistTracksManager
        bandId={bandId}
        playlistId={playlistId}
        tracks={payload.tracks}
        canEdit={payload.canEdit}
        isLocked={payload.isLocked}
      />
    </div>
  )
}
