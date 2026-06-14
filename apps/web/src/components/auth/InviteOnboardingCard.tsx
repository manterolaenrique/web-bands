import {getRoleLabel} from '@/lib/bands/members'
import type {BandInviteSummary} from '@/types/band'

export function InviteOnboardingCard({
  invite,
  mode = 'desktop',
}: {
  invite: BandInviteSummary
  mode?: 'desktop' | 'mobile'
}) {
  return (
    <section className={`invite-onboarding-card invite-onboarding-card--${mode}`}>
      <div className="invite-onboarding-card__header">
        <div>
          <p className="eyebrow">Invitacion privada</p>
          <h2>Acceso para {invite.band?.name || 'tu banda'}</h2>
          <p className="muted">
            Entraras como <strong>{getRoleLabel(invite.role)}</strong> usando{' '}
            <strong>{invite.email}</strong>.
          </p>
        </div>
      </div>

      <ol className="invite-onboarding-card__steps">
        <li>Crea tu cuenta con el email invitado y una contraseña nueva.</li>
        <li>Revisa tu correo y confirma el email.</li>
        <li>Cuando confirmes el email, vuelve aqui, carga tu contraseña e ingresa al panel.</li>
      </ol>
    </section>
  )
}
