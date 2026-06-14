import Link from 'next/link'

import type {BandAudioPlaylistSummary} from '@web-bands/bands-domain'

import {PlayCircleIcon, PlaylistIcon} from './DemoIcons'
import {PlayPlaylistButton} from './PlayPlaylistButton'

export function PlaylistCard({
  bandId,
  playlist,
}: {
  bandId: string
  playlist: BandAudioPlaylistSummary
}) {
  return (
    <article className="demos-playlist-card">
      <div
        className={`demos-playlist-card__cover${playlist.coverSignedUrl ? ' demos-playlist-card__cover--image' : ''}`}
        aria-hidden="true"
      >
        {playlist.coverSignedUrl ? (
          <img src={playlist.coverSignedUrl} alt="" />
        ) : (
          <>
            <div />
            <div />
            <div />
            <div />
            <span className="demos-playlist-card__cover-icon">
              <PlaylistIcon />
            </span>
          </>
        )}
      </div>
      <div className="demos-playlist-card__body">
        <div>
          <div className="demos-playlist-card__title-row">
            <h3>{playlist.title}</h3>
            {playlist.isLocked ? <span className="demos-playlist-badge">Automatica</span> : null}
          </div>
          <p>{playlist.description || 'Coleccion privada de audios de la banda.'}</p>
        </div>
        <div className="demos-playlist-card__footer">
          <span>{playlist.trackCount} audios</span>
          <div className="demos-playlist-card__footer-actions">
            <PlayPlaylistButton
              bandId={bandId}
              playlistId={playlist.id}
              className="button button--ghost"
              aria-label={`Reproducir playlist ${playlist.title}`}
              disabled={playlist.trackCount === 0}
            >
              <PlayCircleIcon />
              Play
            </PlayPlaylistButton>
            <Link className="button button--ghost" href={`/dashboard/bands/${bandId}/demos/playlists/${playlist.id}`}>
              Abrir
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
