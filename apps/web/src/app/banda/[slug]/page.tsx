import {permanentRedirect} from 'next/navigation'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function LegacyBandRedirect({params}: PageProps) {
  const {slug} = await params
  permanentRedirect(`/bandas/${slug}`)
}
