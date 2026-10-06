import {notFound} from 'next/navigation'

import {BandWorkspaceHeader} from '@/components/dashboard/BandWorkspaceHeader'
import {BandWorkspaceNav} from '@/components/demos/BandWorkspaceNav'
import {DemoUploadForm} from '@/components/demos/DemoUploadForm'
import {requireUser} from '@/lib/auth/session'
import {getBandEditorPayload} from '@/server/bands/editor-payload'
import {getBandPlaylistSummaries} from '@/server/demos/playlists'
import {getBandDemosAccess} from '@/server/demos/shared'

type PageProps = {
  params: Promise<{
    bandId: string
  }>
}

export default async function UploadBandDemoPage({params}: PageProps) {
  const {bandId} = await params
  const user = await requireUser()
  const [access, editorPayload] = await Promise.all([
    getBandDemosAccess(user.id, bandId),
    getBandEditorPayload(user.id, bandId),
  ])

  if (!access || !editorPayload) {
    notFound()
  }

  const playlists = await getBandPlaylistSummaries(user.id, bandId)

  return (
    <div className="demos-screen">
      <BandWorkspaceHeader
        bandId={bandId}
        bandName={access.band.name}
        bandStatus={access.band.status}
        publicBandHref={editorPayload.publicBandHref}
        canManage={editorPayload.canManage}
        activeSection="demos"
        eyebrow="Herramientas privadas · Subir demo"
        description="Guarda audios privados en Supabase Storage sin exponerlos publicamente."
      />

      <BandWorkspaceNav bandId={bandId} active="upload" />

      <section className="demos-form-card">
        <DemoUploadForm bandId={bandId} playlists={playlists} />
      </section>
    </div>
  )
}
