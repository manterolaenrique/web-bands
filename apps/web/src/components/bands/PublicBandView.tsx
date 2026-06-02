import Image from 'next/image'

import {
  FacebookIcon,
  InstagramIcon,
  SpotifyIcon,
  TikTokIcon,
  TwitterXIcon,
  YouTubeIcon,
} from '@/components/bands/SocialIcons'
import {Reveal} from '@/components/ui/Reveal'
import {resolveSpotifyEmbedUrl, resolveYouTubeEmbedUrl} from '@/lib/bands/embeds'
import {buildBandThemeStyle} from '@/lib/bands/theme'
import {getSanityImageUrl} from '@/lib/sanity/image'
import type {BandSocialLinks, PublicBand} from '@/types/band'

type SocialNetwork = 'instagram' | 'youtube' | 'facebook' | 'spotify' | 'tiktok' | 'twitter'

type SocialEntry = {
  label: string
  href: string
  network: SocialNetwork
}

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

function getSocialEntries(redes: BandSocialLinks | undefined): SocialEntry[] {
  if (!redes) return []

  return [
    {label: 'Instagram', href: redes.instagram, network: 'instagram'},
    {label: 'YouTube', href: redes.youtube, network: 'youtube'},
    {label: 'Facebook', href: redes.facebook, network: 'facebook'},
    {label: 'Spotify', href: redes.spotify, network: 'spotify'},
    {label: 'TikTok', href: redes.tiktok, network: 'tiktok'},
    {label: 'X / Twitter', href: redes.twitter, network: 'twitter'},
  ].filter((entry): entry is SocialEntry => Boolean(entry.href))
}

function getShowStatusLabel(status: string | undefined) {
  if (status === 'sold-out') return 'Agotado'
  if (status === 'soon') return 'Proximamente'
  return 'Entradas'
}

function getTimelineImportanceLabel(importance: string | undefined) {
  if (importance === 'principal') return 'Evento principal'
  if (importance === 'tercero') return 'Momento de archivo'
  return 'Hito de la banda'
}

function getTimelineImportanceClassName(importance: string | undefined) {
  if (importance === 'principal') return 'timeline-item--principal'
  if (importance === 'tercero') return 'timeline-item--tercero'
  return 'timeline-item--secundario'
}

function getInitials(value: string | undefined) {
  if (!value) {
    return 'WB'
  }

  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')

  return initials || 'WB'
}

function getSocialIcon(network: SocialNetwork) {
  if (network === 'instagram') return InstagramIcon
  if (network === 'youtube') return YouTubeIcon
  if (network === 'facebook') return FacebookIcon
  if (network === 'spotify') return SpotifyIcon
  if (network === 'tiktok') return TikTokIcon
  return TwitterXIcon
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
  const timelineEvents =
    band.timelineSection?.enabled === true
      ? (band.timelineSection?.events || [])
          .filter((event) => event?.name && event?.date)
          .sort((left, right) => new Date(left.date || '').getTime() - new Date(right.date || '').getTime())
      : []
  const shows = (band.showsSection?.shows || [])
    .filter((show) => show?.date && show?.venue && show?.location)
    .sort((left, right) => new Date(left.date || '').getTime() - new Date(right.date || '').getTime())
  const galleryItems = (band.gallerySection?.items || []).filter((item) => item?.image?.asset?._ref)
  const socials = getSocialEntries(band.contacto?.redes)
  const aboutParagraphs = splitParagraphs(band.about?.contenido)
  const memberCards = (band.about?.integrantes || []).filter((member) => member?.nombre)
  const youtubeVideos = (band.escuchanos?.youtube?.videos || []).filter((video) => video?.titulo && video?.url)
  const spotifyPlaylists = (band.escuchanos?.spotify?.playlists || []).filter(
    (playlist) => playlist?.titulo && playlist?.url
  )
  const youtubeEmbeds = youtubeVideos.map((video) => ({
    ...video,
    embedUrl: resolveYouTubeEmbedUrl(video.url),
  }))
  const spotifyProfileEmbed = resolveSpotifyEmbedUrl(band.escuchanos?.spotify?.perfil_url)
  const spotifyPlaylistEmbeds = spotifyPlaylists.map((playlist) => ({
    ...playlist,
    embed: resolveSpotifyEmbedUrl(playlist.url),
  }))
  const showYoutube = Boolean(band.escuchanos?.youtube?.habilitado && youtubeVideos.length > 0)
  const showSpotify = Boolean(
    band.escuchanos?.spotify?.habilitado &&
      (band.escuchanos?.spotify?.perfil_url || spotifyPlaylists.length > 0)
  )
  const showListenDetails = showYoutube || showSpotify
  const showHeroSpotlightCard = band.hero?.showSpotlightCard !== false
  const spotlightImage = featuredCover || heroImage || aboutImage
  const hasFeaturedRelease = Boolean(
    band.featuredRelease?.title ||
      band.featuredRelease?.description ||
      band.featuredRelease?.spotifyUrl ||
      band.featuredRelease?.youtubeUrl ||
      band.featuredRelease?.appleMusicUrl ||
      featuredCover
  )
  const hasListenSection = hasFeaturedRelease || showListenDetails
  const hasContactSection = Boolean(
    band.contacto?.email || band.contacto?.telefono || band.contacto?.ubicacion || socials.length > 0
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

        <div
          className={`container public-hero__content${showHeroSpotlightCard ? '' : ' public-hero__content--single'}`}
        >
          <Reveal className="public-hero__copy" delay={80}>
            {logoImage ? (
              <div className="public-hero__identity">
                <div className="public-hero__logo">
                  <Image
                    src={logoImage}
                    alt={band.nombre ? `Logo de ${band.nombre}` : 'Logo de la banda'}
                    width={160}
                    height={160}
                    sizes="5rem"
                  />
                </div>
                <div>
                  <p className="eyebrow eyebrow--muted">Identidad oficial</p>
                  <p className="muted">La marca visual configurada desde el panel ya vive en la web publica.</p>
                </div>
              </div>
            ) : null}
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

          {showHeroSpotlightCard ? (
            <Reveal className="public-hero__aside" delay={180}>
              <div className="spotlight-card glass-panel">
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
                  <div className="spotlight-card__meta">
                    {logoImage ? (
                      <div className="spotlight-card__avatar">
                        <Image
                          src={logoImage}
                          alt={band.nombre ? `Logo de ${band.nombre}` : 'Logo de la banda'}
                          width={120}
                          height={120}
                          sizes="3.25rem"
                        />
                      </div>
                    ) : (
                      <div className="spotlight-card__avatar spotlight-card__avatar--fallback">
                        <span>{getInitials(band.nombre)}</span>
                      </div>
                    )}
                    <div>
                      <strong>{band.featuredRelease?.title || band.nombre}</strong>
                      <p className="muted">
                        {band.featuredRelease?.description ||
                          band.hero?.descripcion ||
                          'Identidad visual, historia y plataformas reunidas en una sola experiencia.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ) : null}
        </div>
      </section>

      {hasListenSection ? (
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
      ) : null}

      <Reveal as="section" className="public-section public-section--surface" delay={80}>
        <div className="container public-story" id="historia">
          <div>
            <p className="eyebrow">Historia</p>
            <h2 className="section-heading">{band.about?.titulo || 'Quienes somos'}</h2>
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

      {memberCards.length > 0 ? (
        <Reveal as="section" className="public-section" delay={120}>
          <div className="container">
            <p className="eyebrow">Integrantes</p>
            <h2 className="section-heading">La formacion actual</h2>
            <div className="public-grid public-grid--members">
              {memberCards.map((member, index) => {
                const memberImage = getSanityImageUrl(member.foto, {width: 480, height: 480, fit: 'crop'})

                return (
                  <article className="glass-panel member-panel" key={`${member._key || member.nombre}-${index}`}>
                    <div className="member-panel__media">
                      {memberImage ? (
                        <Image
                          src={memberImage}
                          alt={member.nombre ? `Foto de ${member.nombre}` : 'Integrante de la banda'}
                          width={320}
                          height={320}
                          sizes="(max-width: 760px) 100vw, 16rem"
                        />
                      ) : (
                        <div className="member-panel__fallback" aria-hidden="true">
                          <span>{getInitials(member.nombre)}</span>
                        </div>
                      )}
                    </div>
                    <div className="member-panel__copy">
                      <strong>{member.nombre}</strong>
                      {member.instrumento ? <p className="muted">{member.instrumento}</p> : null}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </Reveal>
      ) : null}

      {shows.length > 0 ? (
        <Reveal as="section" className="public-section" delay={140}>
          <div className="container">
            <p className="eyebrow">Proximas fechas</p>
            <h2 className="section-heading">{band.showsSection?.titulo || 'Proximas fechas'}</h2>
            {band.showsSection?.descripcion ? <p className="lead">{band.showsSection.descripcion}</p> : null}
            <div className="show-list">
              {shows.map((show) => (
                <article className="show-card glass-panel" key={`${show._key || show.venue}-${show.date}`}>
                  <div>
                    <span className="eyebrow eyebrow--muted">{formatLongDate(show.date) || 'Fecha por confirmar'}</span>
                    <h3>{show.venue}</h3>
                    <p className="muted">{show.location}</p>
                  </div>
                  <div className="show-card__actions">
                    {show.status ? (
                      <span className="band-chip band-chip--soft">{getShowStatusLabel(show.status)}</span>
                    ) : null}
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
              {timelineEvents.map((event, index) => {
                const eventImage = getSanityImageUrl(event.image, {width: 720, height: 420, fit: 'crop'})

                return (
                  <li
                    className={`timeline-item timeline-item--band ${getTimelineImportanceClassName(event.importance)}`}
                    key={`${event.name}-${event.date}-${index}`}
                  >
                    <div className="timeline-item__year">{formatYear(event.date) || 'Sin fecha'}</div>
                    <div className="timeline-item__content">
                      <div className="timeline-item__header">
                        <span className="band-chip">{event.icon || '*'}</span>
                        <span className="timeline-item__eyebrow">
                          {getTimelineImportanceLabel(event.importance)}
                        </span>
                      </div>
                      <h3>{event.name}</h3>
                      {eventImage ? (
                        <div className="timeline-item__media">
                          <Image
                            src={eventImage}
                            alt={event.name ? `Imagen de ${event.name}` : 'Imagen del evento'}
                            width={720}
                            height={420}
                            sizes="(max-width: 760px) 100vw, 38rem"
                          />
                        </div>
                      ) : null}
                      {event.descripcion ? <p className="muted">{event.descripcion}</p> : null}
                      {event.link ? (
                        <a className="button button--band-ghost" href={event.link} target="_blank" rel="noreferrer">
                          Ver mas
                        </a>
                      ) : null}
                    </div>
                  </li>
                )
              })}
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
                <h2 className="section-heading">{band.gallerySection?.titulo || 'Archivo visual'}</h2>
              </div>
            </div>
            <div className="gallery-grid">
              {galleryItems.map((item, index) => {
                const imageUrl = getSanityImageUrl(item.image, {width: 900, height: 900, fit: 'crop'})
                if (!imageUrl) {
                  return null
                }

                return item.link ? (
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
                  <div
                    className={`gallery-card${index % 3 === 1 ? ' gallery-card--offset' : ''}`}
                    key={item._key || `${item.caption}-${index}`}
                  >
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
              })}
            </div>
          </div>
        </Reveal>
      ) : null}

      {showListenDetails ? (
        <Reveal as="section" className="public-section" delay={190}>
          <div className="container">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow">Escuchanos</p>
                <h2 className="section-heading">{band.escuchanos?.titulo || 'Plataformas activas'}</h2>
              </div>
              {band.escuchanos?.descripcion ? (
                <p className="muted section-heading-row__copy">{band.escuchanos.descripcion}</p>
              ) : null}
            </div>
            <div className="public-grid public-grid--listen">
              {showYoutube ? (
                <article className="glass-panel listen-panel">
                  <div className="listen-panel__header">
                    <p className="eyebrow">YouTube</p>
                    <h3>{band.escuchanos?.youtube?.titulo || 'Videos destacados'}</h3>
                  </div>
                  <div className="listen-panel__list">
                    {youtubeEmbeds.map((video) => (
                      <article className="listen-item listen-item--embed" key={video._key || video.url}>
                        <div className="listen-item__media listen-item__media--video">
                          {video.embedUrl ? (
                            <iframe
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="strict-origin-when-cross-origin"
                              src={video.embedUrl}
                              title={`YouTube: ${video.titulo}`}
                            />
                          ) : (
                            <a
                              className="listen-item__fallback"
                              href={video.url}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <strong>No se pudo embeber este video</strong>
                              <span className="listen-item__cta">Abrir en YouTube</span>
                            </a>
                          )}
                        </div>
                        <div className="listen-item__copy">
                          <strong>{video.titulo}</strong>
                          {video.descripcion ? <p className="muted">{video.descripcion}</p> : null}
                          {!video.embedUrl ? (
                            <a className="listen-item__cta" href={video.url} rel="noreferrer" target="_blank">
                              Abrir video
                            </a>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </article>
              ) : null}

              {showSpotify ? (
                <article className="glass-panel listen-panel">
                  <div className="listen-panel__header">
                    <p className="eyebrow">Spotify</p>
                    <h3>{band.escuchanos?.spotify?.titulo || 'Playlists y perfil oficial'}</h3>
                  </div>
                  <div className="listen-panel__list">
                    {band.escuchanos?.spotify?.perfil_url ? (
                      <article className="listen-item listen-item--embed listen-item--profile">
                        <div className="listen-item__media listen-item__media--spotify">
                          {spotifyProfileEmbed ? (
                            <iframe
                              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                              loading="lazy"
                              src={spotifyProfileEmbed.embedUrl}
                              title="Spotify: perfil oficial"
                            />
                          ) : (
                            <a
                              className="listen-item__fallback"
                              href={band.escuchanos.spotify.perfil_url}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <strong>No se pudo embeber este perfil</strong>
                              <span className="listen-item__cta">Abrir en Spotify</span>
                            </a>
                          )}
                        </div>
                        <div className="listen-item__copy">
                          <strong>Perfil oficial</strong>
                          <p className="muted">Artista o perfil principal configurado desde el panel.</p>
                          {!spotifyProfileEmbed ? (
                            <a
                              className="listen-item__cta"
                              href={band.escuchanos.spotify.perfil_url}
                              rel="noreferrer"
                              target="_blank"
                            >
                              Abrir Spotify
                            </a>
                          ) : null}
                        </div>
                      </article>
                    ) : null}
                    {spotifyPlaylistEmbeds.map((playlist) => (
                      <article className="listen-item listen-item--embed" key={playlist._key || playlist.url}>
                        <div className="listen-item__media listen-item__media--spotify">
                          {playlist.embed ? (
                            <iframe
                              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                              loading="lazy"
                              src={playlist.embed.embedUrl}
                              title={`Spotify: ${playlist.titulo}`}
                            />
                          ) : (
                            <a
                              className="listen-item__fallback"
                              href={playlist.url}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <strong>No se pudo embeber esta playlist</strong>
                              <span className="listen-item__cta">Abrir en Spotify</span>
                            </a>
                          )}
                        </div>
                        <div className="listen-item__copy">
                          <strong>{playlist.titulo}</strong>
                          {playlist.descripcion ? <p className="muted">{playlist.descripcion}</p> : null}
                          {!playlist.embed ? (
                            <a className="listen-item__cta" href={playlist.url} rel="noreferrer" target="_blank">
                              Abrir playlist
                            </a>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </article>
              ) : null}
            </div>
          </div>
        </Reveal>
      ) : null}

      {hasContactSection ? (
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
              {socials.map((social) => {
                const Icon = getSocialIcon(social.network)

                return (
                  <a
                    className="glass-panel contact-panel contact-panel--social"
                    data-network={social.network}
                    href={social.href}
                    key={social.label}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="contact-panel__icon" aria-hidden="true">
                      <Icon />
                    </span>
                    <div className="contact-panel__copy">
                      <strong>{social.label}</strong>
                      <p className="muted">Abrir perfil</p>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        </Reveal>
      ) : null}
    </main>
  )
}
