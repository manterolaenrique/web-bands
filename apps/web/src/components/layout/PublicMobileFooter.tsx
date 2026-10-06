import Link from 'next/link'

export function PublicMobileFooter() {
  return (
    <footer className="public-mobile-footer">
      <nav className="public-mobile-footer__links" aria-label="Enlaces de navegacion principal">
        <Link className="public-mobile-footer__link" href="/">
          Bandas
        </Link>
        <Link className="public-mobile-footer__link" href="/dashboard">
          Dashboard
        </Link>
        <Link className="public-mobile-footer__link" href="/login">
          Login
        </Link>
      </nav>
    </footer>
  )
}
