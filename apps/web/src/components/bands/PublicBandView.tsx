import Image from 'next/image'

import {getSanityImageUrl} from '@/lib/sanity/image'
import type {PublicBand} from '@/types/band'

function formatYear(date: string | undefined) {
  if (!date) return null

  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return null

  return parsed.getFullYear()
}

export function PublicBandView({band}: {band: PublicBand}) {
  const heroImage = getSanityImageUrl(band.hero?.imagen, {width: 1100, height: 760, fit: 'crop'})
  const aboutImage = getSanityImageUrl(band.about?.imagen, {width: 760, height: 540, fit: 'crop'})
  const timelineEvents = band.timelineSection?.events
    ?.filter((event) => event?.name && event?.date)
    .sort((left, right) => new Date(left.date || '').getTime() - new Date(right.date || '').getTime())

  return (
    <main>
      <section className="hero-band">
        <div className="container hero-band__grid">
          <div>
            <p className="eyebrow">{band.genero || 'Banda'}</p>
            <h1 className="hero-title">{band.hero?.titulo || band.nombre}</h1>
            {band.hero?.subtitulo ? <p className="lead">{band.hero.subtitulo}</p> : null}
            {band.hero?.descripcion ? <p className="muted">{band.hero.descripcion}</p> : null}
            <div className="public-band-nav">
              <a href="#about" className="button button--primary">
                Conocer banda
              </a>
              {band.escuchanos ? (
                <a href="#listen" className="button">
                  Escuchar
                </a>
              ) : null}
              {band.contacto ? (
                <a href="#contact" className="button">
                  Contacto
                </a>
              ) : null}
            </div>
          </div>
          <div className="hero-media">
            {heroImage ? (
              <Image
                src={heroImage}
                alt={band.nombre || 'Banda'}
                width={1100}
                height={760}
                sizes="(max-width: 820px) 100vw, 50vw"
                priority
              />
            ) : null}
          </div>
        </div>
      </section>

      <section id="about" className="public-band-section section--surface">
        <div className="container split">
          <div>
            <p className="eyebrow">Sobre la banda</p>
            <h2 className="section-heading">{band.about?.titulo || 'Quienes Somos'}</h2>
            {band.about?.contenido ? <p className="lead">{band.about.contenido}</p> : null}
          </div>
          {aboutImage ? (
            <div className="hero-media">
              <Image
                src={aboutImage}
                alt={`Imagen de ${band.nombre || 'la banda'}`}
                width={760}
                height={540}
                sizes="(max-width: 820px) 100vw, 40vw"
              />
            </div>
          ) : null}
        </div>
      </section>

      {band.about?.integrantes?.length ? (
        <section className="public-band-section">
          <div className="container">
            <h2 className="section-heading">Integrantes</h2>
            <div className="band-grid">
              {band.about.integrantes.map((member, index) => (
                <article className="dashboard-card" key={`${member.nombre}-${index}`}>
                  <h3>{member.nombre}</h3>
                  {member.instrumento ? <p className="muted">{member.instrumento}</p> : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {timelineEvents?.length ? (
        <section className="public-band-section section--surface">
          <div className="container">
            <p className="eyebrow">Historia</p>
            <h2 className="section-heading">{band.timelineSection?.titulo || 'Linea de tiempo'}</h2>
            {band.timelineSection?.descripcion ? (
              <p className="lead">{band.timelineSection.descripcion}</p>
            ) : null}
            <ol className="timeline-list">
              {timelineEvents.map((event, index) => (
                <li className="timeline-item" key={`${event.name}-${event.date}-${index}`}>
                  <span className="pill">{formatYear(event.date) || 'Sin fecha'}</span>
                  <h3>{event.name}</h3>
                  {event.descripcion ? <p className="muted">{event.descripcion}</p> : null}
                  {event.link ? (
                    <a className="button" href={event.link} target="_blank" rel="noreferrer">
                      Ver mas
                    </a>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {band.escuchanos ? (
        <section id="listen" className="public-band-section">
          <div className="container">
            <p className="eyebrow">Musica</p>
            <h2 className="section-heading">{band.escuchanos.titulo || 'Escuchanos'}</h2>
            {band.escuchanos.descripcion ? <p className="lead">{band.escuchanos.descripcion}</p> : null}
            <div className="band-grid">
              {band.escuchanos.youtube?.videos?.map((video, index) => (
                <article className="dashboard-card" key={`${video.url}-${index}`}>
                  <h3>{video.titulo || 'Video'}</h3>
                  {video.descripcion ? <p className="muted">{video.descripcion}</p> : null}
                  {video.url ? (
                    <a href={video.url} target="_blank" rel="noreferrer" className="button">
                      Abrir YouTube
                    </a>
                  ) : null}
                </article>
              ))}
              {band.escuchanos.spotify?.perfil_url ? (
                <article className="dashboard-card">
                  <h3>{band.escuchanos.spotify.titulo || 'Spotify'}</h3>
                  <a href={band.escuchanos.spotify.perfil_url} target="_blank" rel="noreferrer" className="button">
                    Abrir Spotify
                  </a>
                </article>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {band.contacto ? (
        <section id="contact" className="public-band-section section--surface">
          <div className="container">
            <p className="eyebrow">Contacto</p>
            <h2 className="section-heading">Contrataciones y redes</h2>
            <div className="band-grid">
              {band.contacto.email ? (
                <a className="dashboard-card" href={`mailto:${band.contacto.email}`}>
                  <strong>Email</strong>
                  <p className="muted">{band.contacto.email}</p>
                </a>
              ) : null}
              {band.contacto.telefono ? (
                <a className="dashboard-card" href={`tel:${band.contacto.telefono}`}>
                  <strong>Telefono</strong>
                  <p className="muted">{band.contacto.telefono}</p>
                </a>
              ) : null}
              {band.contacto.ubicacion ? (
                <div className="dashboard-card">
                  <strong>Ubicacion</strong>
                  <p className="muted">{band.contacto.ubicacion}</p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}
