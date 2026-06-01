'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

import {signOut} from '@/app/login/actions'

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <aside className="dashboard-sidebar">
      <Link className={`dashboard-sidebar__link${pathname === '/dashboard' ? ' dashboard-sidebar__link--active' : ''}`} href="/dashboard">
        Mis bandas
      </Link>
      <Link className={`dashboard-sidebar__link${pathname.startsWith('/studio') ? ' dashboard-sidebar__link--active' : ''}`} href="/studio">
        Studio interno
      </Link>
      <form action={signOut}>
        <button className="dashboard-sidebar__link button--danger" type="submit">
          Cerrar sesion
        </button>
      </form>
    </aside>
  )
}
