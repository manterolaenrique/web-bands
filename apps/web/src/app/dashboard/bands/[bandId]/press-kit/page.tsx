import {notFound} from 'next/navigation'

import {BandWorkspaceHeader} from '@/components/dashboard/BandWorkspaceHeader'
import {BandPressKitWorkspace} from '@/components/dashboard/BandPressKitWorkspace'
import {requireUser} from '@/lib/auth/session'
import {getBandPressKitPayload} from '@/server/bands/press-kit'

type PageProps = {
  params: Promise<{
    bandId: string
  }>
}

export default async function BandPressKitPage({params}: PageProps) {
  const {bandId} = await params
  const user = await requireUser()
  const payload = await getBandPressKitPayload(user.id, bandId)

  if (!payload) {
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
        activeSection="press-kit"
        eyebrow="Herramientas privadas · Centro de prensa"
        description="Logos PNG, biografias y recursos privados listos para copiar o compartir con links temporales."
      />

      <BandPressKitWorkspace bandId={payload.band.id} payload={payload} />
    </>
  )
}
