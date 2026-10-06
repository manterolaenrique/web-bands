import {notFound} from 'next/navigation'

import {BandWorkspaceHeader} from '@/components/dashboard/BandWorkspaceHeader'
import {BandWorkspaceNav} from '@/components/demos/BandWorkspaceNav'
import {EmptyState} from '@/components/demos/EmptyState'
import {PlaylistCard} from '@/components/demos/PlaylistCard'
import {PlaylistFormSheet} from '@/components/demos/PlaylistFormSheet'
import {TrackCard} from '@/components/demos/TrackCard'
import {PlayTrackButton} from '@/components/demos/PlayTrackButton'
import {UploadIcon} from '@/components/demos/DemoIcons'
import {PendingLink} from '@/components/ui/PendingLink'
import {getBandEditorPayload} from '@/server/bands/editor-payload'
import {formatTrackDuration, getTrackTypeLabel} from '@/lib/demos/format'
import {requireUser} from '@/lib/auth/session'
import {getBandDemosHome} from '@/server/demos/home'

type PageProps = {
  params: Promise<{
    bandId: string
  }>
  searchParams: Promise<{
    q?: string
  }>
}

export default async function BandDemosPage({params, searchParams}: PageProps) {
  const {bandId} = await params
  const {q} = await searchParams
  const user = await requireUser()
  const [payload, editorPayload] = await Promise.all([
    getBandDemosHome(user.id, bandId, q),
    getBandEditorPayload(user.id, bandId),
  ])

  if (!payload || !editorPayload) {
    notFound()
  }

  const hasQuery = payload.query.length > 0

  return (
    <div className="demos-screen">
      <BandWorkspaceHeader
        bandId={bandId}
        bandName={payload.band.name}
        bandStatus={payload.band.status}
        publicBandHref={editorPayload.publicBandHref}
        canManage={editorPayload.canManage}
        activeSection="demos"
        eyebrow="Herramientas privadas · Demos"
        description={`Audios privados de ${payload.band.name} para ideas, ensayos, mezclas y versiones finales.`}
        actions={
          payload.canEdit ? (
            <>
              <PendingLink
                className="button button--primary"
                href={`/dashboard/bands/${bandId}/demos/upload`}
                pendingLabel="Abriendo subida de demo..."
              >
                Subir demo
              </PendingLink>
              <PlaylistFormSheet bandId={bandId} triggerLabel="Nueva playlist" />
            </>
          ) : null
        }
      />

      <BandWorkspaceNav bandId={bandId} active="demos" />

      <section className="demos-toolbar">
        <form className="demos-search" action={`/dashboard/bands/${bandId}/demos`}>
          <input defaultValue={payload.query} name="q" placeholder="Buscar audios o versiones..." type="search" />
          <button className="button" type="submit">
            Buscar
          </button>
        </form>

        {payload.canEdit ? (
          <div className="demos-toolbar__actions">
            <PendingLink
              className="button button--primary"
              href={`/dashboard/bands/${bandId}/demos/upload`}
              pendingLabel="Abriendo subida de demo..."
            >
              <UploadIcon />
              Subir demo
            </PendingLink>
            <PlaylistFormSheet bandId={bandId} triggerLabel="Nueva playlist" />
          </div>
        ) : null}
      </section>

      {payload.featuredTrack ? (
        <section className="demos-featured-card">
          <div className="demos-featured-card__copy">
            <p className="eyebrow">Ultimo audio cargado</p>
            <h2>{payload.featuredTrack.title}</h2>
            <p>
              {getTrackTypeLabel(payload.featuredTrack.trackType)} · {formatTrackDuration(payload.featuredTrack.durationSeconds)}
            </p>
          </div>
          <PlayTrackButton
            className="button button--primary"
            tracks={payload.recentTracks}
            trackId={payload.featuredTrack.id}
            source={{sourceType: 'featured'}}
            sourceHref={`/dashboard/bands/${bandId}/demos`}
            sourceLabel="Demos"
          >
            Reproducir
          </PlayTrackButton>
        </section>
      ) : null}

      {payload.recentTracks.length === 0 ? (
        <EmptyState
          title={hasQuery ? 'Sin resultados para esta busqueda.' : 'No hay demos todavia.'}
          copy={
            hasQuery
              ? 'Prueba con otro termino o vuelve a la lista completa.'
              : 'Subi el primer audio privado de la banda para empezar a ordenar ideas y ensayos.'
          }
          ctaLabel={payload.canEdit ? 'Subir demo' : 'Volver al dashboard'}
          ctaHref={payload.canEdit ? `/dashboard/bands/${bandId}/demos/upload` : '/dashboard'}
        />
      ) : (
        <>
          <section className="demos-section">
            <div className="demos-section__header">
              <div>
                <h2>Playlists</h2>
                <p>{payload.totalPlaylists} colecciones privadas</p>
              </div>
              <PendingLink
                className="button"
                href={`/dashboard/bands/${bandId}/demos/playlists`}
                pendingLabel="Abriendo playlists..."
              >
                Ver todas
              </PendingLink>
            </div>
            {payload.playlists.length > 0 ? (
              <div className="demos-playlist-grid">
                {payload.playlists.slice(0, 4).map((playlist) => (
                  <PlaylistCard key={playlist.id} bandId={bandId} playlist={playlist} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No hay playlists todavia."
                copy="Crea una playlist privada para ordenar demos, ensayos o setlists internos."
                ctaLabel={payload.canEdit ? 'Crear playlist' : 'Seguir explorando'}
                ctaHref={payload.canEdit ? `/dashboard/bands/${bandId}/demos/playlists` : `/dashboard/bands/${bandId}/demos`}
              />
            )}
          </section>

          <section className="demos-section">
            <div className="demos-section__header">
              <div>
                <h2>Ultimos audios</h2>
                <p>{payload.totalTracks} audios privados en esta banda</p>
              </div>
            </div>
            <div className="demos-track-list">
              {payload.recentTracks.map((track) => (
                <TrackCard
                  key={track.id}
                  bandId={bandId}
                  track={track}
                  playlists={payload.playlists}
                  canEdit={payload.canEdit}
                  queueTracks={payload.recentTracks}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
