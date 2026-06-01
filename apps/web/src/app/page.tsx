import {BandDirectoryExplorer} from '@/components/bands/BandDirectoryExplorer'
import {getPublishedBands} from '@/lib/sanity/queries'
import type {PublicBandListItem} from '@/types/band'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let bands: PublicBandListItem[] = []
  let error = false

  try {
    bands = await getPublishedBands()
  } catch {
    error = true
  }

  return (
    <main>
      <section className="hero-band hero-band--home">
        <div className="hero-orbit hero-orbit--primary" aria-hidden="true" />
        <div className="hero-orbit hero-orbit--secondary" aria-hidden="true" />
        <div className="container hero-band__home-grid reveal reveal--visible">
          <div className="hero-band__copy">
            <p className="eyebrow">Directorio Web Bands</p>
            <h1 className="hero-title">Bandas listas para descubrir</h1>
            <p className="lead">
              Explora proyectos con identidad propia, perfiles vivos y una presencia visual lista
              para tocar fuerte en cada pantalla.
            </p>
            <div className="hero-actions">
              <a href="#directory" className="button button--primary">
                Explorar bandas
              </a>
              <a href="/dashboard" className="button button--ghost">
                Ir al dashboard
              </a>
            </div>
          </div>
          <div className="hero-panel reveal reveal--visible">
            <div className="hero-panel__header">
              <span className="eyebrow eyebrow--muted">Curated surface</span>
              <span className="status-dot" aria-hidden="true" />
            </div>
            <div className="hero-panel__wave" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="hero-panel__stats">
              <article className="metric-card">
                <span className="metric-card__label">Bandas</span>
                <strong>{bands.length}</strong>
              </article>
              <article className="metric-card">
                <span className="metric-card__label">Publicadas</span>
                <strong>{bands.length}</strong>
              </article>
              <article className="metric-card">
                <span className="metric-card__label">Escena</span>
                <strong>Activa</strong>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section id="directory" className="section section--surface">
        <div className="container">
          <div className="section-heading-row reveal reveal--visible">
            <div>
              <p className="eyebrow">Catalogo publico</p>
              <h2 className="section-heading">Bandas publicadas</h2>
            </div>
            <p className="muted section-heading-row__copy">
              Busqueda rapida, filtros por genero y tarjetas con una presencia mucho mas
              cinematica.
            </p>
          </div>
          {error ? (
            <div className="status status--error">
              No se pudieron cargar las bandas desde Sanity. Revisa las variables publicas de
              Sanity.
            </div>
          ) : null}
          {!error && bands.length === 0 ? (
            <div className="empty-state">
              <h2>No hay bandas publicadas todavia</h2>
              <p className="muted">
                Cuando una banda tenga estado publicado y visibilidad publica aparecera aca.
              </p>
            </div>
          ) : (
            <BandDirectoryExplorer bands={bands} />
          )}
        </div>
      </section>
    </main>
  )
}
