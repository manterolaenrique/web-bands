import {BandCard} from '@/components/bands/BandCard'
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
      <section className="hero-band">
        <div className="container">
          <p className="eyebrow">Directorio publico</p>
          <h1 className="hero-title">Bandas listas para descubrir</h1>
          <p className="lead">
            La V2 mantiene la lectura publica desde Sanity y prepara el camino para perfiles
            administrables por cada banda.
          </p>
        </div>
      </section>

      <section className="section section--surface">
        <div className="container">
          <h2 className="section-heading">Bandas publicadas</h2>
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
            <div className="band-grid">
              {bands.map((band) => (
                <BandCard key={band._id} band={band} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
