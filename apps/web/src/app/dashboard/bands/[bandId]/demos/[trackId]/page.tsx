import {notFound} from 'next/navigation'

import {BandWorkspaceNav} from '@/components/demos/BandWorkspaceNav'
import {TrackDetailPlayer} from '@/components/demos/TrackDetailPlayer'
import {TrackEditSheet} from '@/components/demos/TrackEditSheet'
import {PlaylistFormSheet} from '@/components/demos/PlaylistFormSheet'
import {requireUser} from '@/lib/auth/session'
import {getBandPlaylists} from '@/server/demos/playlists'
import {getBandTrack} from '@/server/demos/tracks'

type PageProps = {
  params: Promise<{
    bandId: string
    trackId: string
  }>
  searchParams: Promise<{
    sheet?: string
  }>
}

export default async function BandDemoTrackPage({params, searchParams}: PageProps) {
  const {bandId, trackId} = await params
  const {sheet} = await searchParams
  const user = await requireUser()
  const [track, playlistsData] = await Promise.all([
    getBandTrack(user.id, bandId, trackId),
    getBandPlaylists(user.id, bandId, null),
  ])

  if (!track) {
    notFound()
  }

  return (
    <div className="demos-screen">
      <header className="dashboard-header editor-page-header demos-page-header">
        <div>
          <p className="eyebrow">Reproductor privado</p>
          <h1 className="dashboard-title">{track.title}</h1>
          <p className="muted">Detalle del audio, notas y acciones privadas de la banda.</p>
        </div>
        <div className="row-actions row-actions--stack-mobile">
          {track.canEdit ? (
            <>
              <TrackEditSheet bandId={bandId} track={track} initialOpen={sheet === 'edit'} />
              <PlaylistFormSheet bandId={bandId} triggerLabel="Nueva playlist" />
            </>
          ) : null}
        </div>
      </header>

      <BandWorkspaceNav bandId={bandId} active="demos" />

      <TrackDetailPlayer bandId={bandId} track={track} playlists={playlistsData.playlists} />
    </div>
  )
}
