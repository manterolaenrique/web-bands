'use client'

import Link from 'next/link'
import {usePathname, useSearchParams} from 'next/navigation'

import {HomeIcon, SearchIcon, UserIcon} from '@/components/layout/MobileNavIcons'

type PublicMobileChromeProps = {
  accountHref: string
  accountLabel: string
}

type PublicNavItem = {
  href: string
  label: string
  kind: 'home' | 'search' | 'account'
}

function getNavItems(accountHref: string, accountLabel: string): PublicNavItem[] {
  return [
    {href: '/', label: 'Inicio', kind: 'home'},
    {href: '/?focus=search#mobile-directory-search', label: 'Buscar', kind: 'search'},
    {href: accountHref, label: accountLabel, kind: 'account'},
  ]
}

function getItemIcon(kind: PublicNavItem['kind']) {
  if (kind === 'search') {
    return SearchIcon
  }

  if (kind === 'account') {
    return UserIcon
  }

  return HomeIcon
}

export function PublicMobileChrome({accountHref, accountLabel}: PublicMobileChromeProps) {
  const pathname = usePathname() || ''
  const searchParams = useSearchParams()
  const navItems = getNavItems(accountHref, accountLabel)
  const focusMode = searchParams?.get('focus')

  return (
    <>
      <header className="public-mobile-topbar" aria-label="Cabecera mobile publica">
        <Link href="/" className="public-mobile-topbar__brand">
          <span className="public-mobile-topbar__brand-mark">WB</span>
          <span className="public-mobile-topbar__brand-copy">
            <strong>Web Bands</strong>
            <small>Directorio + app privada</small>
          </span>
        </Link>
        <div className="public-mobile-topbar__actions">
          <Link
            className="public-mobile-topbar__icon-button"
            href="/?focus=search#mobile-directory-search"
            aria-label="Ir a la busqueda"
          >
            <SearchIcon />
          </Link>
          <Link className="public-mobile-topbar__button public-mobile-topbar__button--primary" href={accountHref}>
            <span className="public-mobile-topbar__button-copy">{accountLabel}</span>
          </Link>
        </div>
      </header>

      <nav className="public-mobile-bottomnav" aria-label="Navegacion mobile publica">
        {navItems.map((item) => {
          const isActive = (() => {
            if (item.kind === 'home') {
              return pathname === '/' && focusMode !== 'search'
            }

            if (item.kind === 'search') {
              return pathname === '/' && focusMode === 'search'
            }

            return pathname === accountHref || (accountHref === '/dashboard' && pathname.startsWith('/dashboard'))
          })()
          const Icon = getItemIcon(item.kind)

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={`public-mobile-bottomnav__item${isActive ? ' public-mobile-bottomnav__item--active' : ''}`}
            >
              <span className="public-mobile-bottomnav__item-icon" aria-hidden="true">
                <Icon />
              </span>
              <span className="public-mobile-bottomnav__item-label">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
