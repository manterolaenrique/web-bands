import type {Metadata} from 'next'
import {notFound} from 'next/navigation'

import {PublicBandView} from '@/components/bands/PublicBandView'
import {getSanityImageUrl} from '@/lib/sanity/image'
import {getPublicBandBySlug, getPublishedBands} from '@/lib/sanity/queries'

export const revalidate = 300

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const bands = await getPublishedBands().catch(() => [])

  return bands
    .map((band) => band.slug?.current)
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({slug}))
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
    keywords: band.seo?.palabras_clave || undefined,
    icons: (() => {
      const faviconUrl = getSanityImageUrl(band.logo_favicon, {width: 96, height: 96, fit: 'max'})
      return faviconUrl ? {icon: faviconUrl} : undefined
    })(),
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
