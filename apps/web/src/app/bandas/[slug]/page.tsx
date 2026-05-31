import type {Metadata} from 'next'
import {notFound} from 'next/navigation'

import {PublicBandView} from '@/components/bands/PublicBandView'
import {getPublicBandBySlug} from '@/lib/sanity/queries'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {slug} = await params
  const band = await getPublicBandBySlug(slug)

  if (!band) {
    return {
      title: 'Banda no encontrada',
    }
  }

  return {
    title: band.seo?.titulo_seo || band.nombre || band.hero?.titulo || 'Banda',
    description: band.seo?.descripcion_seo || band.hero?.descripcion || undefined,
  }
}

export default async function BandPage({params}: PageProps) {
  const {slug} = await params
  const band = await getPublicBandBySlug(slug)

  if (!band) {
    notFound()
  }

  return <PublicBandView band={band} />
}
