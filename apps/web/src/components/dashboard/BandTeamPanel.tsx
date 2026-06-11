import Link from 'next/link'

import {
  createBandInvite,
  removeBandMember,
  revokeBandInvite,
  updateBandMemberRole,
} from '@/app/dashboard/team-actions'
import {
  canAssignMemberRole,
  canRemoveMemberRole,
  getManageableRoleOptions,
  getRoleLabel,
} from '@/lib/bands/members'
import {isBandInviteEmailConfigured} from '@/lib/email/resend'
import type {BandInviteSummary, BandMemberRole, BandMemberSummary} from '@/types/band'

import {InviteLinkActions} from './InviteLinkActions'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function BandTeamPanel({
  bandId,
  currentUserId,
  managerRole,
  members,
  invites,
  returnTo,
}: {
  bandId: string
  currentUserId: string
  managerRole: BandMemberRole
  members: BandMemberSummary[]
  invites: BandInviteSummary[]
  returnTo: string
}) {
  const manageableInviteRoles = getManageableRoleOptions(managerRole)
  const emailDeliveryEnabled = isBandInviteEmailConfigured()

  return (
    <section className="dashboard-card dashboard-card--team">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Equipo</p>
          <h2 className="dashboard-title">Miembros e invitaciones</h2>
          <p className="muted">Gestiona acceso por banda sin abrir Sanity Studio a clientes.</p>
        </div>
      </div>

      <div className="form-section form-section--compact">
        <h3>Invitar miembro</h3>
        {!emailDeliveryEnabled ? (
          <div className="status status--warning">
            El envio automatico no esta configurado. Crea la invitacion y comparte el enlace manualmente.
          </div>
        ) : null}
        <form action={createBandInvite} className="form-grid">
          <input type="hidden" name="bandId" value={bandId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="form-field">
            <span className="form-label">Email</span>
            <input className="form-input" name="email" type="email" placeholder="invitado@ejemplo.com" required />
          </label>
          <label className="form-field">
            <span className="form-label">Rol</span>
            <select className="form-select" name="role" defaultValue={manageableInviteRoles[0]}>
              {manageableInviteRoles.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>
          </label>
          <div className="row-actions form-field--full">
            <button className="button button--primary" type="submit">
              Enviar invitacion
            </button>
          </div>
        </form>
      </div>

      <div className="form-section form-section--compact">
        <h3>Miembros actuales</h3>
        {members.length === 0 ? (
          <p className="muted">Todavia no hay miembros asignados a esta banda.</p>
        ) : (
          <div className="member-list">
            {members.map((member) => {
              const editableRoles = getManageableRoleOptions(managerRole).filter((nextRole) =>
                canAssignMemberRole(managerRole, member.role, nextRole)
              )
              const canRemove = canRemoveMemberRole(managerRole, member.role) && member.userId !== currentUserId

              return (
                <article className="member-card" key={member.userId}>
                  <div className="member-card__header">
                    <div>
                      <h4>{member.profile?.display_name || member.profile?.email || member.userId}</h4>
                      <p className="muted">{member.profile?.email || member.userId}</p>
                    </div>
                    <span className="pill">{getRoleLabel(member.role)}</span>
                  </div>
                  <p className="muted">Asignado el {formatDate(member.createdAt)}</p>
                  {member.userId === currentUserId ? (
                    <div className="status status--warning">Tu propio rol se mantiene fijo desde esta pantalla.</div>
                  ) : editableRoles.length > 0 ? (
                    <form action={updateBandMemberRole} className="member-card__actions">
                      <input type="hidden" name="bandId" value={bandId} />
                      <input type="hidden" name="memberUserId" value={member.userId} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <select className="form-select" name="role" defaultValue={member.role}>
                        {editableRoles.map((role) => (
                          <option key={role} value={role}>
                            {getRoleLabel(role)}
                          </option>
                        ))}
                      </select>
                      <button className="button" type="submit">
                        Guardar rol
                      </button>
                    </form>
                  ) : null}
                  {canRemove ? (
                    <form action={removeBandMember} className="member-card__actions">
                      <input type="hidden" name="bandId" value={bandId} />
                      <input type="hidden" name="memberUserId" value={member.userId} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button className="button button--danger" type="submit">
                        Quitar miembro
                      </button>
                    </form>
                  ) : null}
                </article>
              )
            })}
          </div>
        )}
      </div>

      <div className="form-section form-section--compact">
        <h3>Invitaciones pendientes</h3>
        {invites.length === 0 ? (
          <p className="muted">No hay invitaciones pendientes para esta banda.</p>
        ) : (
          <div className="member-list">
            {invites.map((invite) => {
              const canRevoke = canAssignMemberRole(managerRole, invite.role, invite.role)

              return (
                <article className="member-card" key={invite.id}>
                  <div className="member-card__header">
                    <div>
                      <h4>{invite.email}</h4>
                      <p className="muted">Invitado como {getRoleLabel(invite.role)}</p>
                    </div>
                    <span className="pill pill--muted">Pendiente</span>
                  </div>
                  <p className="muted">Expira el {formatDate(invite.expiresAt)}</p>
                  <div className="member-card__actions">
                    <Link href={`/invite/${invite.token}`} className="button">
                      Abrir enlace
                    </Link>
                    {canRevoke ? (
                      <form action={revokeBandInvite}>
                        <input type="hidden" name="bandId" value={bandId} />
                        <input type="hidden" name="inviteId" value={invite.id} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button className="button button--danger" type="submit">
                          Revocar invitacion
                        </button>
                      </form>
                    ) : null}
                    <InviteLinkActions invitePath={`/invite/${invite.token}`} />
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
