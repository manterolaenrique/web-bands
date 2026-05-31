import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="container section">
      <div className="empty-state">
        <p className="eyebrow">404</p>
        <h1>Pagina no encontrada</h1>
        <p className="muted">La pagina que buscas no existe o todavia no esta publicada.</p>
        <Link href="/" className="button button--primary">
          Volver a bandas
        </Link>
      </div>
    </main>
  )
}
