'use client'

import Link from 'next/link'
import Image from 'next/image'

import {getSanityImageUrl} from '@/lib/sanity/image'
import type {PublicBandListItem} from '@/types/band'
import {Reveal} from '@/components/ui/Reveal'

export function BandCard({
  band,
  index = 0,
  variant = 'desktop',
}: {
  band: PublicBandListItem
  index?: number
  variant?: 'desktop' | 'mobile'
}) {
  const slug = band.slug?.current
  const imageUrl = getSanityImageUrl(band.heroImage, {width: 640, height: 360, fit: 'crop'})
  const logoUrl = getSanityImageUrl(band.logo, {width: 120, height: 120, fit: 'max'})

  if (variant === 'mobile') {
    return (
      <Reveal as="article" className="mobile-band-card" delay={Math.min(index * 70, 420)}>
        <Link href={slug ? `/bandas/${slug}` : '#'} aria-disabled={!slug}>
          <div className="mobile-band-card__media">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={band.nombre ? `Foto de ${band.nombre}` : 'Banda'}
                width={640}
                height={420}
                sizes="100vw"
              />
            ) : (
              <div className="mobile-band-card__media-fallback" aria-hidden="true">
                <span>{band.nombre?.slice(0, 2).toUpperCase() || 'WB'}</span>
              </div>
            )}
            <div className="mobile-band-card__veil" />
            <div className="mobile-band-card__chips">
              {band.genero ? <span className="mobile-band-card__chip">{band.genero}</span> : null}
              {slug ? <span className="mobile-band-card__chip mobile-band-card__chip--soft">/{slug}</span> : null}
            </div>
          </div>
          <div className="mobile-band-card__body">
            <div className="mobile-band-card__header">
              <div>
                <h2 className="mobile-band-card__title">{band.nombre || 'Banda sin nombre'}</h2>
                {band.heroTitle ? <p className="mobile-band-card__subtitle">{band.heroTitle}</p> : null}
              </div>
              {logoUrl ? (
                <div className="mobile-band-card__logo">
                  <Image
                    src={logoUrl}
                    alt={band.nombre ? `Logo de ${band.nombre}` : 'Logo de la banda'}
                    width={96}
                    height={96}
                    sizes="3rem"
                  />
                </div>
              ) : null}
            </div>
            <span className="mobile-band-card__cta">Ver perfil</span>
          </div>
        </Link>
      </Reveal>
    )
  }

  return (
    <Reveal as="article" className="band-card" delay={Math.min(index * 70, 420)}>
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
          <div className="band-card__veil" />
          {logoUrl ? (
            <div className="band-card__logo">
              <Image
                src={logoUrl}
                alt={band.nombre ? `Logo de ${band.nombre}` : 'Logo de la banda'}
                width={120}
                height={120}
                sizes="3.25rem"
              />
            </div>
          ) : null}
          {band.genero ? <span className="band-card__flag">{band.genero}</span> : null}
        </div>
        <div className="band-card__body">
          <div className="band-card__meta">
            {slug ? <span className="eyebrow eyebrow--muted">/{slug}</span> : null}
          </div>
          <h2 className="band-card__title">{band.nombre || 'Banda sin nombre'}</h2>
          {band.heroTitle ? <p className="muted">{band.heroTitle}</p> : null}
          <div className="band-card__footer">
            <span className="button button--ghost">Ver perfil</span>
          </div>
        </div>
      </Link>
    </Reveal>
  )
}
