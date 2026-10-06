import {notFound} from 'next/navigation'

import {PlaylistDetailWorkspace} from '@/components/demos/PlaylistDetailWorkspace'
import {requireUser} from '@/lib/auth/session'
import {getBandEditorPayload} from '@/server/bands/editor-payload'
import {getBandPlaylist} from '@/server/demos/playlists'

type PageProps = {
  params: Promise<{
    bandId: string
    playlistId: string
  }>
}

export default async function BandPlaylistDetailPage({params}: PageProps) {
  const {bandId, playlistId} = await params
  const user = await requireUser()
  const [payload, editorPayload] = await Promise.all([
    getBandPlaylist(user.id, bandId, playlistId),
    getBandEditorPayload(user.id, bandId),
  ])

  if (!payload || !editorPayload) {
    notFound()
  }

  return (
    <PlaylistDetailWorkspace
      key={`${payload.id}:${payload.title}:${payload.description || ''}:${payload.coverSignedUrl || ''}:${payload.tracks.length}`}
      bandId={bandId}
      initialPlaylist={payload}
      publicBandHref={editorPayload.publicBandHref}
      canManage={editorPayload.canManage}
    />
  )
}
