export function PublicMobileFooter() {
  return (
    <footer className="public-mobile-footer">
      <span className="public-mobile-footer__brand">Web Bands</span>
      <p className="public-mobile-footer__copy">
        Perfiles publicos, gestion privada y una app mobile lista para compartir y editar.
      </p>
      <div className="public-mobile-footer__chips" aria-label="Capacidades de la plataforma">
        <span className="public-mobile-footer__chip">Perfiles</span>
        <span className="public-mobile-footer__chip">Dashboard</span>
        <span className="public-mobile-footer__chip">Multiusuario</span>
      </div>
    </footer>
  )
}
