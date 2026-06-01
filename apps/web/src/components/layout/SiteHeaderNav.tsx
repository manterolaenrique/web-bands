'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

type SiteHeaderNavProps = {
  user: {
    displayName: string
    email: string | null
    roleLabel: string
  } | null
}

function isBandsRoute(pathname: string) {
  return pathname === '/' || pathname.startsWith('/bandas/') || pathname.startsWith('/banda/')
}

export function SiteHeaderNav({user}: SiteHeaderNavProps) {
  const pathname = usePathname()
  const isBandsActive = isBandsRoute(pathname)
  const isDashboardActive = pathname.startsWith('/dashboard')
  const isLoginActive = pathname.startsWith('/login')
  const accountHref = user ? '/dashboard' : '/login'
  const accountClassName = user
    ? `site-account${isDashboardActive ? ' site-account--active' : ''}`
    : isLoginActive
      ? 'button button--primary'
      : 'button button--ghost'

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand">
          <span className="brand__mark">WB</span>
          <span className="brand__copy">
            <strong>Web Bands</strong>
            <small>Plataforma para bandas</small>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Principal">
          <Link href="/" className={`nav-link${isBandsActive ? ' nav-link--active' : ''}`}>
            Bandas
          </Link>
          <Link
            href="/dashboard"
            className={`nav-link${isDashboardActive ? ' nav-link--active' : ''}`}
          >
            Dashboard
          </Link>
          <Link href={accountHref} className={accountClassName}>
            {user ? (
              <span className="site-account__content">
                <strong className="site-account__name">{user.displayName}</strong>
                <span className="site-account__meta">
                  {user.roleLabel}
                  {user.email ? ` • ${user.email}` : ''}
                </span>
              </span>
            ) : (
              'Login'
            )}
          </Link>
        </nav>
      </div>
    </header>
  )
}
