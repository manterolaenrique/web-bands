import Link from 'next/link'

import {BandDirectoryExplorer} from '@/components/bands/BandDirectoryExplorer'
import {PublicMobileChrome} from '@/components/layout/PublicMobileChrome'
import {PublicMobileFooter} from '@/components/layout/PublicMobileFooter'
import {getCurrentUser} from '@/lib/auth/session'
import {getPublishedBands} from '@/lib/sanity/queries'
import type {PublicBandListItem} from '@/types/band'

export const dynamic = 'force-dynamic'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    focus?: string
  }>
}) {
  let bands: PublicBandListItem[] = []
  let error = false
  const {focus} = await searchParams
  const user = await getCurrentUser()
  const accountHref = user ? '/dashboard' : '/login'
  const accountLabel = user ? 'Cuenta' : 'Login'
  const shouldFocusSearch = focus === 'search'

  try {
    bands = await getPublishedBands()
  } catch {
    error = true
  }

  return (
    <main>
      <div className="desktop-surface">
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
              <BandDirectoryExplorer bands={bands} autoFocusSearch={shouldFocusSearch} searchInputId="directory-search" />
            )}
          </div>
        </section>
      </div>

      <div className="mobile-surface home-mobile-screen">
        <PublicMobileChrome accountHref={accountHref} accountLabel={accountLabel} />
        <section className="home-mobile-hero">
          <p className="eyebrow">Directorio Web Bands</p>
          <h1 className="home-mobile-hero__title">Bandas listas para descubrir</h1>
          <p className="home-mobile-hero__copy">
            Una vitrina mobile con perfiles vivos, identidades fuertes y una escena lista para
            sonar en cada pantalla.
          </p>
          <div className="home-mobile-hero__actions">
            <a href="#mobile-directory" className="button button--primary">
              Explorar bandas
            </a>
            <Link href="/dashboard" className="button button--ghost">
              Ir al dashboard
            </Link>
          </div>
        </section>

        <section className="home-mobile-stats" aria-label="Metricas del directorio">
          <article className="home-mobile-stat-card">
            <span className="metric-card__label">Bandas</span>
            <strong>{bands.length}</strong>
          </article>
          <article className="home-mobile-stat-card">
            <span className="metric-card__label">Publicadas</span>
            <strong>{bands.length}</strong>
          </article>
          <article className="home-mobile-stat-card">
            <span className="metric-card__label">Escena</span>
            <strong>Activa</strong>
          </article>
        </section>

        <section className="home-mobile-directory" id="mobile-directory">
          <div className="home-mobile-directory__intro">
            <p className="eyebrow">Catalogo publico</p>
            <h2 className="home-mobile-directory__title">Bandas publicadas</h2>
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
            <BandDirectoryExplorer
              bands={bands}
              variant="mobile"
              autoFocusSearch={shouldFocusSearch}
              searchInputId="mobile-directory-search"
            />
          )}
        </section>

        <section className="home-mobile-cta">
          <p className="eyebrow">Sumar proyecto</p>
          <h2>Tu banda tambien puede estar aca</h2>
          <p className="muted">
            Entra al dashboard, crea tu banda y empieza a darle forma al perfil publico.
          </p>
          <Link href={accountHref} className="button button--primary">
            {user ? 'Abrir mi cuenta' : 'Entrar para empezar'}
          </Link>
        </section>

        <PublicMobileFooter />
      </div>
    </main>
  )
}
