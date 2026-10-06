import {notFound} from 'next/navigation'

import {BandSetlistEditorWorkspace} from '@/components/dashboard/BandSetlistEditorWorkspace'
import {requireUser} from '@/lib/auth/session'
import {getBandSetlistEditorPayload} from '@/server/bands/setlists'

type PageProps = {
  params: Promise<{
    bandId: string
    setlistId: string
  }>
  searchParams: Promise<{
    mode?: string
  }>
}

export default async function BandSetlistEditorPage({params, searchParams}: PageProps) {
  const {bandId, setlistId} = await params
  const resolvedSearchParams = await searchParams
  const user = await requireUser()
  const payload = await getBandSetlistEditorPayload(user.id, bandId, setlistId)

  if (!payload) {
    notFound()
  }

  return (
    <BandSetlistEditorWorkspace
      bandId={bandId}
      payload={payload}
      isNewSession={resolvedSearchParams.mode === 'new'}
    />
  )
}
