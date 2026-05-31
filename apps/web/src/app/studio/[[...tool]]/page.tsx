import Link from 'next/link'

import {isSupabaseConfigured} from '@/lib/env'
import {requireUser} from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export default async function StudioRoute() {
  if (isSupabaseConfigured()) {
    await requireUser()
  }

  return (
    <main className="container section">
      <div className="setup-card">
        <p className="eyebrow">Admin interno</p>
        <h1>Sanity Studio queda reservado para administradores</h1>
        <p className="muted">
          La V2 prioriza un dashboard propio para clientes. Esta ruta queda preparada para
          embeber Studio mas adelante o para enlazar el Studio desplegado sin exponerlo como
          panel multi-tenant.
        </p>
        <div className="row-actions">
          <a className="button button--primary" href="https://bandas-web.sanity.studio" target="_blank" rel="noreferrer">
            Abrir Studio actual
          </a>
          <Link className="button" href="/dashboard">
            Volver al dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
