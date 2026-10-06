'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

function isBandsRoute(pathname: string) {
  return pathname === '/' || pathname.startsWith('/bandas/') || pathname.startsWith('/banda/')
}

export function SiteHeaderNav() {
  const pathname = usePathname()
  const isBandsActive = isBandsRoute(pathname)
  const isDashboardActive = pathname.startsWith('/dashboard')
  const isAccountActive = pathname.startsWith('/dashboard/account')
  const isLoginActive = pathname.startsWith('/login')
  const accountHref = isDashboardActive ? '/dashboard/account' : '/login'
  const accountLabel = isDashboardActive ? 'Cuenta' : 'Login'
  const accountClassName = isAccountActive || isLoginActive ? 'button button--primary' : 'button button--ghost'

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
          <Link href="/dashboard" className={`nav-link${isDashboardActive ? ' nav-link--active' : ''}`}>
            Dashboard
          </Link>
          <Link href={accountHref} className={accountClassName}>
            {accountLabel}
          </Link>
        </nav>
      </div>
    </header>
  )
}
