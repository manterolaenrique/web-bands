import {BandSiteOverviewScreen} from '../BandSiteOverviewScreen'

type PageProps = {
  params: Promise<{
    bandId: string
  }>
}

export default async function BandSiteOverviewPage({params}: PageProps) {
  const {bandId} = await params
  return <BandSiteOverviewScreen bandId={bandId} />
}
