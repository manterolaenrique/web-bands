'use client'
import {usePathname} from 'next/navigation'

import {signOut} from '@/app/login/actions'
import {DashboardIcon, EditIcon, UserIcon} from '@/components/layout/MobileNavIcons'
import {PendingLink} from '@/components/ui/PendingLink'
import type {CurrentUserSummary} from '@/lib/auth/user-summary'

import {LAST_EDITOR_HREF_STORAGE_KEY} from './editor-navigation-state'
import {getUserInitials} from './user-initials'

function isEditBandRoute(pathname: string) {
  return /^\/dashboard\/bands\/[^/]+(?:\/.*)?$/.test(pathname)
}

function resolveEditorHref(pathname: string) {
  if (isEditBandRoute(pathname)) {
    return pathname
  }

  if (typeof window === 'undefined') {
    return '/dashboard#dashboard-management'
  }

  return window.sessionStorage.getItem(LAST_EDITOR_HREF_STORAGE_KEY) || '/dashboard#dashboard-management'
}

export function DashboardNav({
  currentUser,
}: {
  currentUser?: CurrentUserSummary | null
}) {
  const pathname = usePathname()
  const isEditRoute = isEditBandRoute(pathname)
  const editorHref = resolveEditorHref(pathname)
  const dashboardActive = pathname === '/dashboard'
  const editorActive = isEditRoute
  const accountActive = pathname === '/dashboard/account'
  const studioActive = pathname.startsWith('/studio')
  const displayName = currentUser?.displayName || 'Mi cuenta'
  const email = currentUser?.email || null

  return (
    <>
      <div className="dashboard-mobile-appbar">
        <PendingLink href="/dashboard" className="dashboard-mobile-appbar__brand" pendingLabel="Volviendo al dashboard...">
          <span className="dashboard-mobile-appbar__mark">WB</span>
          <div className="dashboard-mobile-appbar__copy">
            <strong>Web Bands</strong>
          </div>
        </PendingLink>
        <PendingLink
          className={`dashboard-user-trigger${accountActive ? ' dashboard-user-trigger--active' : ''}`}
          href="/dashboard/account"
          aria-label="Ir a cuenta"
          pendingLabel="Abriendo cuenta..."
        >
          <span className="dashboard-user-trigger__avatar">{getUserInitials(displayName)}</span>
        </PendingLink>
      </div>

      <nav
        className={`dashboard-mobile-nav${isEditRoute ? ' dashboard-mobile-nav--editor' : ''}`}
        aria-label="Navegacion mobile del dashboard"
      >
        <PendingLink
          className={`dashboard-mobile-nav__item${dashboardActive ? ' dashboard-mobile-nav__item--active' : ''}`}
          href="/dashboard"
          pendingLabel="Volviendo al dashboard..."
        >
          <span className="dashboard-mobile-nav__item-icon" aria-hidden="true">
            <DashboardIcon />
          </span>
          <span className="dashboard-mobile-nav__item-label">Bandas</span>
        </PendingLink>
        <PendingLink
          className={`dashboard-mobile-nav__item${editorActive ? ' dashboard-mobile-nav__item--active' : ''}`}
          href={editorHref}
          pendingLabel="Abriendo workspace..."
        >
          <span className="dashboard-mobile-nav__item-icon" aria-hidden="true">
            <EditIcon />
          </span>
          <span className="dashboard-mobile-nav__item-label">Workspace</span>
        </PendingLink>
        <PendingLink
          className={`dashboard-mobile-nav__item${accountActive ? ' dashboard-mobile-nav__item--active' : ''}`}
          href="/dashboard/account"
          pendingLabel="Abriendo cuenta..."
        >
          <span className="dashboard-mobile-nav__item-icon" aria-hidden="true">
            <UserIcon />
          </span>
          <span className="dashboard-mobile-nav__item-label">Cuenta</span>
        </PendingLink>
      </nav>

      <div className="dashboard-desktop-toolbar" aria-label="Comandos del dashboard">
        <div className="dashboard-desktop-toolbar__nav">
          <PendingLink
            className={`dashboard-desktop-toolbar__link${dashboardActive ? ' dashboard-desktop-toolbar__link--active' : ''}`}
            href="/dashboard"
            pendingLabel="Volviendo al dashboard..."
          >
            Mis bandas
          </PendingLink>
          <PendingLink
            className={`dashboard-desktop-toolbar__link${studioActive ? ' dashboard-desktop-toolbar__link--active' : ''}`}
            href="/studio"
            pendingLabel="Abriendo studio..."
          >
            Studio interno
          </PendingLink>
          <PendingLink
            className={`dashboard-desktop-toolbar__link${accountActive ? ' dashboard-desktop-toolbar__link--active' : ''}`}
            href="/dashboard/account"
            pendingLabel="Abriendo cuenta..."
          >
            Cuenta
          </PendingLink>
          {editorActive ? <span className="dashboard-desktop-toolbar__pill">Workspace activo</span> : null}
        </div>

        <div className="dashboard-desktop-toolbar__actions">
          {currentUser ? (
            <PendingLink
              className={`dashboard-desktop-toolbar__account${accountActive ? ' dashboard-desktop-toolbar__account--active' : ''}`}
              href="/dashboard/account"
              aria-label="Cuenta actual"
              pendingLabel="Abriendo cuenta..."
            >
              <strong>{currentUser.displayName}</strong>
              <span>
                {currentUser.roleLabel}
                {email ? ` | ${email}` : ''}
              </span>
            </PendingLink>
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
