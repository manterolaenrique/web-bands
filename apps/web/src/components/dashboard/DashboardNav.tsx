'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

import {signOut} from '@/app/login/actions'
import {
  DashboardIcon,
  EditIcon,
  UserIcon,
} from '@/components/layout/MobileNavIcons'
import type {CurrentUserSummary} from '@/lib/auth/user-summary'

import {getUserInitials} from './user-initials'

function resolveEditorHref(pathname: string, initialEditorHref?: string | null) {
  if (/^\/dashboard\/bands\/[^/]+(?:\/.*)?$/.test(pathname)) {
    return pathname
  }

  return initialEditorHref || '/dashboard#dashboard-create-band'
}

export function DashboardNav({
  initialEditorHref,
  currentUser,
}: {
  initialEditorHref?: string | null
  currentUser?: CurrentUserSummary | null
}) {
  const pathname = usePathname()
  const isEditRoute = /^\/dashboard\/bands\/[^/]+(?:\/.*)?$/.test(pathname)
  const editorHref = resolveEditorHref(pathname, initialEditorHref)
  const dashboardActive = pathname === '/dashboard'
  const editorActive = isEditRoute
  const accountActive = pathname === '/dashboard/account'
  const studioActive = pathname.startsWith('/studio')
  const displayName = currentUser?.displayName || 'Mi cuenta'
  const email = currentUser?.email || null

  return (
    <>
      <div className="dashboard-mobile-appbar">
        <Link href="/dashboard" className="dashboard-mobile-appbar__brand">
          <span className="dashboard-mobile-appbar__mark">WB</span>
          <div className="dashboard-mobile-appbar__copy">
            <strong>Web Bands</strong>
          </div>
        </Link>
        <Link
          className={`dashboard-user-trigger${accountActive ? ' dashboard-user-trigger--active' : ''}`}
          href="/dashboard/account"
          aria-label="Ir a cuenta"
        >
          <span className="dashboard-user-trigger__avatar">{getUserInitials(displayName)}</span>
        </Link>
      </div>

      <nav className={`dashboard-mobile-nav${isEditRoute ? ' dashboard-mobile-nav--editor' : ''}`} aria-label="Navegacion mobile del dashboard">
        <Link
          className={`dashboard-mobile-nav__item${dashboardActive ? ' dashboard-mobile-nav__item--active' : ''}`}
          href="/dashboard"
        >
          <span className="dashboard-mobile-nav__item-icon" aria-hidden="true">
            <DashboardIcon />
          </span>
          <span className="dashboard-mobile-nav__item-label">Bandas</span>
        </Link>
        <Link
          className={`dashboard-mobile-nav__item${editorActive ? ' dashboard-mobile-nav__item--active' : ''}`}
          href={editorHref}
        >
          <span className="dashboard-mobile-nav__item-icon" aria-hidden="true">
            <EditIcon />
          </span>
          <span className="dashboard-mobile-nav__item-label">Editor</span>
        </Link>
        <Link
          className={`dashboard-mobile-nav__item${accountActive ? ' dashboard-mobile-nav__item--active' : ''}`}
          href="/dashboard/account"
        >
          <span className="dashboard-mobile-nav__item-icon" aria-hidden="true">
            <UserIcon />
          </span>
          <span className="dashboard-mobile-nav__item-label">Cuenta</span>
        </Link>
      </nav>

      <div className="dashboard-desktop-toolbar" aria-label="Comandos del dashboard">
        <div className="dashboard-desktop-toolbar__nav">
          <Link
            className={`dashboard-desktop-toolbar__link${dashboardActive ? ' dashboard-desktop-toolbar__link--active' : ''}`}
            href="/dashboard"
          >
            Mis bandas
          </Link>
          <Link
            className={`dashboard-desktop-toolbar__link${studioActive ? ' dashboard-desktop-toolbar__link--active' : ''}`}
            href="/studio"
          >
            Studio interno
          </Link>
          <Link
            className={`dashboard-desktop-toolbar__link${accountActive ? ' dashboard-desktop-toolbar__link--active' : ''}`}
            href="/dashboard/account"
          >
            Cuenta
          </Link>
          {editorActive ? <span className="dashboard-desktop-toolbar__pill">Editor activo</span> : null}
        </div>

        <div className="dashboard-desktop-toolbar__actions">
          {currentUser ? (
            <Link
              className={`dashboard-desktop-toolbar__account${accountActive ? ' dashboard-desktop-toolbar__account--active' : ''}`}
              href="/dashboard/account"
              aria-label="Cuenta actual"
            >
              <strong>{currentUser.displayName}</strong>
              <span>
                {currentUser.roleLabel}
                {email ? ` · ${email}` : ''}
              </span>
            </Link>
          ) : null}

          <form action={signOut}>
            <button className="button button--ghost" type="submit">
              Cerrar sesion
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
