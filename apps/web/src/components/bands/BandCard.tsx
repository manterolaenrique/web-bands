import Link from 'next/link'
import Image from 'next/image'

import {getSanityImageUrl} from '@/lib/sanity/image'
import type {PublicBandListItem} from '@/types/band'

export function BandCard({band}: {band: PublicBandListItem}) {
  const slug = band.slug?.current
  const imageUrl = getSanityImageUrl(band.heroImage, {width: 640, height: 360, fit: 'crop'})

  return (
    <article className="band-card">
      <Link href={slug ? `/bandas/${slug}` : '#'} aria-disabled={!slug}>
        <div className="band-card__image">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={band.nombre ? `Foto de ${band.nombre}` : 'Banda'}
              width={640}
              height={360}
              sizes="(max-width: 820px) 100vw, 33vw"
            />
          ) : null}
        </div>
        <div className="band-card__body">
          <h2 className="band-card__title">{band.nombre || 'Banda sin nombre'}</h2>
          {band.heroTitle ? <p className="muted">{band.heroTitle}</p> : null}
          <div className="pill-row">
            {band.genero ? <span className="pill">{band.genero}</span> : null}
            {slug ? <span className="pill">/{slug}</span> : null}
          </div>
        </div>
      </Link>
    </article>
  )
}
