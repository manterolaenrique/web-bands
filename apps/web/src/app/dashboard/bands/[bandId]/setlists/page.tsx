import {notFound, redirect} from 'next/navigation'

import {BandWorkspaceHeader} from '@/components/dashboard/BandWorkspaceHeader'
import {BandSetlistsWorkspace} from '@/components/dashboard/BandSetlistsWorkspace'
import {requireUser} from '@/lib/auth/session'
import {getBandSetlistsHubPayload} from '@/server/bands/setlists'

type PageProps = {
  params: Promise<{
    bandId: string
  }>
  searchParams: Promise<{
    compose?: string
    mode?: string
  }>
}

export default async function BandSetlistsPage({params, searchParams}: PageProps) {
  const {bandId} = await params
  const resolvedSearchParams = await searchParams

  if (resolvedSearchParams.compose) {
    const modeSuffix = resolvedSearchParams.mode === 'new' ? '?mode=new' : ''
    redirect(`/dashboard/bands/${bandId}/setlists/${resolvedSearchParams.compose}${modeSuffix}`)
  }

  const user = await requireUser()
  const payload = await getBandSetlistsHubPayload(user.id, bandId)

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
        activeSection="setlists"
        eyebrow="Herramientas privadas · Setlists"
        description="Biblioteca fija de temas y hojas A4 listas para imprimir o guardar como PDF antes de cada fecha."
      />

      <BandSetlistsWorkspace bandId={payload.band.id} payload={payload} />
    </>
  )
}
