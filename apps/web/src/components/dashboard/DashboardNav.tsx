import Link from 'next/link'

import {signOut} from '@/app/login/actions'

export function DashboardNav() {
  return (
    <aside className="dashboard-sidebar">
      <Link className="dashboard-sidebar__link" href="/dashboard">
        Mis bandas
      </Link>
      <Link className="dashboard-sidebar__link" href="/studio">
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
