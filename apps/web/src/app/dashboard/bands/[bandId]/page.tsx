import {BandWorkspaceHomeScreen} from './BandWorkspaceHomeScreen'

type PageProps = {
  params: Promise<{
    bandId: string
  }>
  searchParams: Promise<{
    message?: string
  }>
}

export default async function EditBandPage({params, searchParams}: PageProps) {
  const {bandId} = await params
  const {message} = await searchParams
  return <BandWorkspaceHomeScreen bandId={bandId} message={message} />
}
