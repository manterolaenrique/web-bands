import {notFound} from 'next/navigation'

import {BandWorkspaceHeader} from '@/components/dashboard/BandWorkspaceHeader'
import {BandWorkspaceNav} from '@/components/demos/BandWorkspaceNav'
import {EmptyState} from '@/components/demos/EmptyState'
import {PlaylistCard} from '@/components/demos/PlaylistCard'
import {PlaylistFormSheet} from '@/components/demos/PlaylistFormSheet'
import {requireUser} from '@/lib/auth/session'
import {getBandEditorPayload} from '@/server/bands/editor-payload'
import {getBandPlaylists} from '@/server/demos/playlists'

type PageProps = {
  params: Promise<{
    bandId: string
  }>
  searchParams: Promise<{
    q?: string
  }>
}

export default async function BandPlaylistsPage({params, searchParams}: PageProps) {
  const {bandId} = await params
  const {q} = await searchParams
  const user = await requireUser()
  const [payload, editorPayload] = await Promise.all([
    getBandPlaylists(user.id, bandId, q),
    getBandEditorPayload(user.id, bandId),
  ])

  if (!payload || !editorPayload) {
    notFound()
  }

  return (
    <div className="demos-screen">
      <BandWorkspaceHeader
        bandId={bandId}
        bandName={payload.band.name}
        bandStatus={payload.band.status}
        publicBandHref={editorPayload.publicBandHref}
        canManage={editorPayload.canManage}
        activeSection="demos"
        eyebrow="Herramientas privadas · Playlists"
        description="Ordena demos, ensayos y grabaciones internas por contexto sin salir del workspace de la banda."
        actions={payload.canEdit ? <PlaylistFormSheet bandId={bandId} triggerLabel="Nueva playlist" /> : null}
      />

      <BandWorkspaceNav bandId={bandId} active="playlists" />

      <section className="demos-toolbar">
        <form className="demos-search" action={`/dashboard/bands/${bandId}/demos/playlists`}>
          <input defaultValue={payload.query} name="q" placeholder="Buscar playlists..." type="search" />
          <button className="button" type="submit">
            Buscar
          </button>
        </form>
      </section>

      {payload.playlists.length === 0 ? (
        <EmptyState
          title={payload.query ? 'No encontramos playlists.' : 'No hay playlists todavia.'}
          copy={
            payload.query
              ? 'Prueba con otro termino o vuelve a la lista completa.'
              : 'Crea la primera playlist privada para agrupar demos o ensayos.'
          }
          ctaLabel={payload.canEdit ? 'Crear playlist' : 'Volver a demos'}
          ctaHref={`/dashboard/bands/${bandId}/demos`}
        />
      ) : (
        <div className="demos-playlist-grid">
          {payload.playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} bandId={bandId} playlist={playlist} />
          ))}
        </div>
      )}
    </div>
  )
}
