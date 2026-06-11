import Link from 'next/link'

import {acceptBandInvite} from '@/app/dashboard/team-actions'
import {getRoleLabel} from '@/lib/bands/members'
import type {BandInviteSummary} from '@/types/band'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function PendingInvitesPanel({invites}: {invites: BandInviteSummary[]}) {
  if (invites.length === 0) {
    return null
  }

  return (
    <section className="dashboard-card dashboard-card--invites">
      <div className="dashboard-section-heading">
        <div>
          <p className="eyebrow">Invitaciones</p>
          <h2>Pendientes para tu cuenta</h2>
          <p className="muted">Acepta accesos a otras bandas desde el mismo dashboard.</p>
        </div>
      </div>
      <div className="member-list">
        {invites.map((invite) => (
          <article className="member-card" key={invite.id}>
            <div className="member-card__header">
              <div>
                <h3>{invite.band?.name || 'Banda pendiente'}</h3>
                <p className="muted">/{invite.band?.slug || 'sin-slug'}</p>
              </div>
              <span className="pill">{getRoleLabel(invite.role)}</span>
            </div>
            <p className="muted">Expira el {formatDate(invite.expiresAt)}</p>
            <div className="member-card__actions">
              <Link href={`/invite/${invite.token}`} className="button">
                Ver invitacion
              </Link>
              <form action={acceptBandInvite}>
                <input type="hidden" name="inviteId" value={invite.id} />
                <input type="hidden" name="returnTo" value="/dashboard" />
                <button className="button button--primary" type="submit">
                  Aceptar invitacion
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
