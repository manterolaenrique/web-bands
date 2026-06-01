import Image from 'next/image'

import {Reveal} from '@/components/ui/Reveal'
import {buildBandThemeStyle} from '@/lib/bands/theme'
import {getSanityImageUrl} from '@/lib/sanity/image'
import type {BandSocialLinks, PublicBand} from '@/types/band'

function formatLongDate(date: string | undefined) {
  if (!date) return null

  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return null

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

function formatYear(date: string | undefined) {
  if (!date) return null

  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return null

  return parsed.getFullYear()
}

function splitParagraphs(value: string | undefined) {
  if (!value) {
    return []
  }

  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function getSocialEntries(redes: BandSocialLinks | undefined) {
  if (!redes) return []

  return [
    {label: 'Instagram', href: redes.instagram},
    {label: 'YouTube', href: redes.youtube},
    {label: 'Facebook', href: redes.facebook},
    {label: 'Spotify', href: redes.spotify},
    {label: 'TikTok', href: redes.tiktok},
    {label: 'X / Twitter', href: redes.twitter},
  ].filter((entry) => entry.href)
}

function getShowStatusLabel(status: string | undefined) {
  if (status === 'sold-out') return 'Agotado'
  if (status === 'soon') return 'Proximamente'
  return 'Entradas'
}

export function PublicBandView({band}: {band: PublicBand}) {
  const heroImage = getSanityImageUrl(band.hero?.imagen, {width: 1600, height: 1200, fit: 'crop'})
  const aboutImage = getSanityImageUrl(band.about?.imagen, {width: 960, height: 1080, fit: 'crop'})
  const logoImage = getSanityImageUrl(band.logo, {width: 280, height: 280, fit: 'max'})
  const featuredCover = getSanityImageUrl(band.featuredRelease?.coverImage, {
    width: 640,
    height: 640,
    fit: 'crop',
  })
  const timelineEvents = (band.timelineSection?.events || [])
    .filter((event) => event?.name && event?.date)
    .sort((left, right) => new Date(left.date || '').getTime() - new Date(right.date || '').getTime())
  const shows = (band.showsSection?.shows || [])
    .filter((show) => show?.date && show?.venue && show?.location)
    .sort((left, right) => new Date(left.date || '').getTime() - new Date(right.date || '').getTime())
  const galleryItems = (band.gallerySection?.items || []).filter((item) => item?.image?.asset?._ref)
  const socials = getSocialEntries(band.contacto?.redes)
  const aboutParagraphs = splitParagraphs(band.about?.contenido)
  const spotlightImage = featuredCover || heroImage || aboutImage || logoImage
  const hasListenSection =
    Boolean(
      band.featuredRelease?.spotifyUrl ||
        band.featuredRelease?.youtubeUrl ||
        band.featuredRelease?.appleMusicUrl ||
        band.escuchanos?.spotify?.perfil_url ||
        band.escuchanos?.youtube?.videos?.length
    )

  return (
    <main className="public-band-shell" style={buildBandThemeStyle(band.colores)}>
      <section className="public-hero">
        <div className="public-hero__media">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={band.nombre ? `Escena principal de ${band.nombre}` : 'Escena principal de la banda'}
              fill
              priority
              sizes="100vw"
            />
          ) : null}
          <div className="public-hero__overlay" />
        </div>

        <div className="container public-hero__content">
          <Reveal className="public-hero__copy" delay={80}>
            <div className="public-hero__chips">
              {band.genero ? <span className="band-chip">{band.genero}</span> : null}
              {band.slug?.current ? <span className="band-chip band-chip--soft">/{band.slug.current}</span> : null}
            </div>
            <h1 className="public-hero__title">{band.hero?.titulo || band.nombre}</h1>
            {band.hero?.subtitulo ? <p className="public-hero__subtitle">{band.hero.subtitulo}</p> : null}
            {band.hero?.descripcion ? <p className="lead">{band.hero.descripcion}</p> : null}
            <div className="hero-actions">
              <a href="#historia" className="button button--band-primary">
                Conocer banda
              </a>
              {hasListenSection ? (
                <a href="#musica" className="button button--band-ghost">
                  Escuchar ahora
                </a>
              ) : null}
            </div>
          </Reveal>

          <Reveal className="public-hero__aside" delay={180}>
            <div className="spotlight-card">
              <div className="spotlight-card__header">
                <span className="eyebrow eyebrow--muted">
                  {band.featuredRelease?.eyebrow || 'Perfil activo'}
                </span>
                <span className="status-dot" aria-hidden="true" />
              </div>
              <div className="spotlight-card__body">
                {spotlightImage ? (
                  <div className="spotlight-card__visual">
                    <Image
                      src={spotlightImage}
                      alt={band.nombre ? `Vista previa de ${band.nombre}` : 'Vista previa de la banda'}
                      width={640}
                      height={420}
                      sizes="(max-width: 980px) 100vw, 22rem"
                    />
                  </div>
                ) : null}
                <strong>{band.featuredRelease?.title || band.nombre}</strong>
                <p className="muted">
                  {band.featuredRelease?.description ||
                    band.hero?.descripcion ||
                    'Identidad visual, historia y plataformas en una sola experiencia.'}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {(band.featuredRelease?.title || hasListenSection) && (
        <Reveal as="section" className="public-section">
          <div className="container public-featured" id="musica">
            <div className={`public-featured__record${featuredCover ? '' : ' public-featured__record--single'}`}>
              {featuredCover ? (
                <div className="public-featured__cover">
                  <Image
                    src={featuredCover}
                    alt={band.featuredRelease?.title || `Portada de ${band.nombre || 'la banda'}`}
                    width={640}
                    height={640}
                    sizes="(max-width: 900px) 100vw, 24rem"
                  />
                </div>
              ) : null}
              <div className="public-featured__copy">
                <p className="eyebrow">{band.featuredRelease?.eyebrow || 'Lanzamiento destacado'}</p>
                <h2 className="section-heading">
                  {band.featuredRelease?.title || band.escuchanos?.titulo || 'Escuchanos'}
                </h2>
                <p className="lead">
                  {band.featuredRelease?.description ||
                    band.escuchanos?.descripcion ||
                    'Accede a los lanzamientos, videos y plataformas principales de la banda.'}
                </p>
                <div className="public-link-grid">
                  {band.featuredRelease?.spotifyUrl ? (
                    <a
                      className="button button--band-primary"
                      href={band.featuredRelease.spotifyUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Spotify
                    </a>
                  ) : null}
                  {band.featuredRelease?.youtubeUrl ? (
                    <a
                      className="button button--band-ghost"
                      href={band.featuredRelease.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      YouTube
                    </a>
                  ) : null}
                  {band.featuredRelease?.appleMusicUrl ? (
                    <a
                      className="button button--ghost"
                      href={band.featuredRelease.appleMusicUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Apple Music
                    </a>
                  ) : null}
                  {!band.featuredRelease?.spotifyUrl && band.escuchanos?.spotify?.perfil_url ? (
                    <a
                      className="button button--band-primary"
                      href={band.escuchanos.spotify.perfil_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir Spotify
                    </a>
                  ) : null}
                  {!band.featuredRelease?.youtubeUrl && band.escuchanos?.youtube?.videos?.[0]?.url ? (
                    <a
                      className="button button--band-ghost"
                      href={band.escuchanos.youtube.videos[0].url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver video
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      <Reveal as="section" className="public-section public-section--surface" delay={80}>
        <div className="container public-story" id="historia">
          <div>
            <p className="eyebrow">Historia</p>
            <h2 className="section-heading">{band.about?.titulo || 'Quienes Somos'}</h2>
            <div className="story-copy">
              {aboutParagraphs.length > 0 ? (
                aboutParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
              ) : (
                <p>{band.about?.contenido || 'La historia de esta banda se esta preparando.'}</p>
              )}
            </div>
          </div>
          {aboutImage ? (
            <div className="story-frame">
              <Image
                src={aboutImage}
                alt={`Imagen de ${band.nombre || 'la banda'}`}
                width={960}
                height={1080}
                sizes="(max-width: 900px) 100vw, 38vw"
              />
            </div>
          ) : null}
        </div>
      </Reveal>

      {band.about?.integrantes?.length ? (
        <Reveal as="section" className="public-section" delay={120}>
          <div className="container">
            <p className="eyebrow">Integrantes</p>
            <h2 className="section-heading">La formacion actual</h2>
            <div className="public-grid public-grid--members">
              {band.about.integrantes.map((member, index) => (
                <article className="glass-panel member-panel" key={`${member.nombre}-${index}`}>
                  <strong>{member.nombre}</strong>
                  {member.instrumento ? <p className="muted">{member.instrumento}</p> : null}
                </article>
              ))}
            </div>
          </div>
        </Reveal>
      ) : null}

      {shows.length > 0 ? (
        <Reveal as="section" className="public-section" delay={140}>
          <div className="container">
            <p className="eyebrow">Proximas fechas</p>
            <h2 className="section-heading">
              {band.showsSection?.titulo || 'Upcoming voltage drops'}
            </h2>
            {band.showsSection?.descripcion ? <p className="lead">{band.showsSection.descripcion}</p> : null}
            <div className="show-list">
              {shows.map((show) => (
                <article className="show-card" key={`${show._key || show.venue}-${show.date}`}>
                  <div>
                    <span className="eyebrow eyebrow--muted">{formatLongDate(show.date) || 'Fecha por confirmar'}</span>
                    <h3>{show.venue}</h3>
                    <p className="muted">{show.location}</p>
                  </div>
                  <div className="show-card__actions">
                    {show.status ? <span className="band-chip band-chip--soft">{getShowStatusLabel(show.status)}</span> : null}
                    {show.ticketUrl ? (
                      <a className="button button--band-ghost" href={show.ticketUrl} target="_blank" rel="noreferrer">
                        Ver entradas
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Reveal>
      ) : null}

      {timelineEvents.length > 0 ? (
        <Reveal as="section" className="public-section public-section--surface" delay={160}>
          <div className="container">
            <p className="eyebrow">Archivo</p>
            <h2 className="section-heading">{band.timelineSection?.titulo || 'Linea de tiempo'}</h2>
            {band.timelineSection?.descripcion ? <p className="lead">{band.timelineSection.descripcion}</p> : null}
            <ol className="timeline-list timeline-list--band">
              {timelineEvents.map((event, index) => (
                <li className="timeline-item timeline-item--band" key={`${event.name}-${event.date}-${index}`}>
                  <div className="timeline-item__year">{formatYear(event.date) || 'Sin fecha'}</div>
                  <div className="timeline-item__content">
                    <div className="timeline-item__header">
                      <span className="band-chip">{event.icon || '•'}</span>
                      <h3>{event.name}</h3>
                    </div>
                    {event.descripcion ? <p className="muted">{event.descripcion}</p> : null}
                    {event.link ? (
                      <a className="button button--band-ghost" href={event.link} target="_blank" rel="noreferrer">
                        Ver mas
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      ) : null}

      {galleryItems.length > 0 ? (
        <Reveal as="section" className="public-section" delay={180}>
          <div className="container">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow">Galeria</p>
                <h2 className="section-heading">{band.gallerySection?.titulo || 'Visual archive'}</h2>
              </div>
            </div>
            <div className="gallery-grid">
              {galleryItems.map((item, index) => {
                const imageUrl = getSanityImageUrl(item.image, {width: 900, height: 900, fit: 'crop'})
                if (!imageUrl) {
                  return null
                }

                return (
                  item.link ? (
                    <a
                      className={`gallery-card${index % 3 === 1 ? ' gallery-card--offset' : ''}`}
                      key={item._key || `${item.caption}-${index}`}
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Image
                        src={imageUrl}
                        alt={item.alt || item.caption || `Galeria de ${band.nombre || 'la banda'}`}
                        width={900}
                        height={900}
                        sizes="(max-width: 820px) 50vw, 24vw"
                      />
                      {item.caption ? <span className="gallery-card__caption">{item.caption}</span> : null}
                    </a>
                  ) : (
                    <div className={`gallery-card${index % 3 === 1 ? ' gallery-card--offset' : ''}`} key={item._key || `${item.caption}-${index}`}>
                      <Image
                        src={imageUrl}
                        alt={item.alt || item.caption || `Galeria de ${band.nombre || 'la banda'}`}
                        width={900}
                        height={900}
                        sizes="(max-width: 820px) 50vw, 24vw"
                      />
                      {item.caption ? <span className="gallery-card__caption">{item.caption}</span> : null}
                    </div>
                  )
                )
              })}
            </div>
          </div>
        </Reveal>
      ) : null}

      {(hasListenSection || band.contacto) && (
        <Reveal as="section" className="public-section public-section--surface" delay={200}>
          <div className="container public-contact">
            <div>
              <p className="eyebrow">Contacto y redes</p>
              <h2 className="section-heading">Seguir, escuchar y contratar</h2>
              <p className="lead">
                Toda la presencia digital de la banda queda reunida en un mismo punto de contacto.
              </p>
            </div>

            <div className="public-grid public-grid--contact">
              {band.contacto?.email ? (
                <a className="glass-panel contact-panel" href={`mailto:${band.contacto.email}`}>
                  <strong>Email</strong>
                  <p className="muted">{band.contacto.email}</p>
                </a>
              ) : null}
              {band.contacto?.telefono ? (
                <a className="glass-panel contact-panel" href={`tel:${band.contacto.telefono}`}>
                  <strong>Telefono</strong>
                  <p className="muted">{band.contacto.telefono}</p>
                </a>
              ) : null}
              {band.contacto?.ubicacion ? (
                <div className="glass-panel contact-panel">
                  <strong>Ubicacion</strong>
                  <p className="muted">{band.contacto.ubicacion}</p>
                </div>
              ) : null}
              {socials.map((social) => (
                <a
                  className="glass-panel contact-panel"
                  href={social.href}
                  key={social.label}
                  target="_blank"
                  rel="noreferrer"
                >
                  <strong>{social.label}</strong>
                  <p className="muted">Abrir perfil</p>
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </main>
  )
}
