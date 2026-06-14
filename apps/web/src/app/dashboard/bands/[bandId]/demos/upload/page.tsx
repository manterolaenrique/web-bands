import {notFound} from 'next/navigation'

import {BandWorkspaceNav} from '@/components/demos/BandWorkspaceNav'
import {DemoUploadForm} from '@/components/demos/DemoUploadForm'
import {requireUser} from '@/lib/auth/session'
import {getBandPlaylists} from '@/server/demos/playlists'
import {getBandDemosAccess} from '@/server/demos/shared'

type PageProps = {
  params: Promise<{
    bandId: string
  }>
}

export default async function UploadBandDemoPage({params}: PageProps) {
  const {bandId} = await params
  const user = await requireUser()
  const access = await getBandDemosAccess(user.id, bandId)

  if (!access) {
    notFound()
  }

  const playlistsData = await getBandPlaylists(user.id, bandId)

  return (
    <div className="demos-screen">
      <header className="dashboard-header editor-page-header demos-page-header">
        <div>
          <p className="eyebrow">Carga privada</p>
          <h1 className="dashboard-title">Subir demo</h1>
          <p className="muted">Guarda audios privados en Supabase Storage sin exponerlos publicamente.</p>
        </div>
      </header>

      <BandWorkspaceNav bandId={bandId} active="upload" />

      <section className="demos-form-card">
        <DemoUploadForm bandId={bandId} playlists={playlistsData.playlists} />
      </section>
    </div>
  )
}
