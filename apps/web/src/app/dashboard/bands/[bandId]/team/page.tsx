import {notFound} from 'next/navigation'

import {BandWorkspaceHeader} from '@/components/dashboard/BandWorkspaceHeader'
import {BandTeamPanel} from '@/components/dashboard/BandTeamPanel'
import {requireUser} from '@/lib/auth/session'
import {getBandEditorPayload} from '@/server/bands/editor-payload'

type PageProps = {
  params: Promise<{
    bandId: string
  }>
}

export default async function BandTeamPage({params}: PageProps) {
  const {bandId} = await params
  const user = await requireUser()
  const payload = await getBandEditorPayload(user.id, bandId)

  if (!payload || !payload.canManage) {
    notFound()
  }

  return (
    <>
      <BandWorkspaceHeader
        bandId={payload.band.id}
        bandName={payload.band.name}
        bandStatus={payload.band.status}
        publicBandHref={payload.publicBandHref}
        canManage={payload.canManage}
        activeSection="team"
        eyebrow="Administracion · Equipo"
        description="Invitaciones, roles y acceso privado para quienes gestionan la banda."
      />

      <BandTeamPanel
        bandId={payload.band.id}
        currentUserId={user.id}
        managerRole={payload.role as NonNullable<typeof payload.role>}
        members={payload.teamMembers}
        invites={payload.pendingInvites}
        returnTo={`/dashboard/bands/${payload.band.id}/team`}
      />
    </>
  )
}
