import Link from 'next/link'

import {acceptBandInvite} from '@/app/dashboard/team-actions'
import {getRoleLabel} from '@/lib/bands/members'
import {appendQueryParams} from '@/lib/auth/return-to'
import {getCurrentUser} from '@/lib/auth/session'
import {getBandInviteByToken, resolveInviteAccessState} from '@/lib/invites/service'

type InvitePageProps = {
  params: Promise<{
    token: string
  }>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default async function InvitePage({params}: InvitePageProps) {
  const {token} = await params
  const user = await getCurrentUser()
  let invite = null

  try {
    invite = await getBandInviteByToken(token)
  } catch {
    invite = null
  }

  const state = resolveInviteAccessState(invite, user?.email)
  const loginHref = appendQueryParams('/login', {next: `/invite/${token}`})
  const dashboardHref = '/dashboard'

  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <p className="eyebrow">Invitacion privada</p>
        <h1>Unite a una banda</h1>
        <p className="muted">
          Este acceso se valida con token, cuenta autenticada y permisos server-side.
        </p>

        {invite ? (
          <div className="form-section form-section--compact">
            <div className="pill-row">
              <span className="pill">{getRoleLabel(invite.role)}</span>
              <span className="pill pill--muted">Expira {formatDate(invite.expiresAt)}</span>
            </div>
            <h2>{invite.band?.name || 'Banda invitada'}</h2>
            <p className="muted">/{invite.band?.slug || 'sin-slug'}</p>
            <p className="muted">Invitacion enviada a {invite.email}</p>
          </div>
        ) : null}

        {state === 'not-found' ? (
          <div className="status status--error">
            La invitacion no existe o ya no esta disponible.
          </div>
        ) : null}

        {state === 'accepted' ? (
          <div className="status status--success">
            Esta invitacion ya fue aceptada. Puedes continuar desde tu dashboard.
          </div>
        ) : null}

        {state === 'expired' ? (
          <div className="status status--warning">
            La invitacion expiro. Pidele a la banda que genere una nueva.
          </div>
        ) : null}

        {state === 'requires-login' ? (
          <div className="status status--warning">
            Inicia sesion con el email invitado para aceptar esta invitacion.
          </div>
        ) : null}

        {state === 'email-mismatch' ? (
          <div className="status status--warning">
            La sesion actual corresponde a <strong>{user?.email || 'otra cuenta'}</strong>, pero la
            invitacion esta dirigida a <strong>{invite?.email}</strong>.
          </div>
        ) : null}

        {state === 'ready' ? (
          <div className="status status--success">
            Todo listo. Acepta la invitacion para sumar esta banda a tu dashboard.
          </div>
        ) : null}

        <div className="row-actions">
          {state === 'requires-login' ? (
            <Link className="button button--primary" href={loginHref}>
              Entrar para continuar
            </Link>
          ) : null}

          {state === 'ready' && invite ? (
            <form action={acceptBandInvite}>
              <input type="hidden" name="inviteId" value={invite.id} />
              <input type="hidden" name="returnTo" value={dashboardHref} />
              <button className="button button--primary" type="submit">
                Aceptar invitacion
              </button>
            </form>
          ) : null}

          <Link className="button" href={dashboardHref}>
            Ir al dashboard
          </Link>
        </div>
      </section>
    </main>
  )
}
