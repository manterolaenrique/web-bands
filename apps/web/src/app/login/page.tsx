import {redirect} from 'next/navigation'

import {signInWithGoogle} from '@/app/login/actions'
import {AuthEmailPasswordForm} from '@/components/auth/AuthEmailPasswordForm'
import {InviteOnboardingCard} from '@/components/auth/InviteOnboardingCard'
import {resolveAuthMessage} from '@/lib/auth/messages'
import {extractInviteTokenFromReturnTo} from '@/lib/auth/invite-login'
import {resolveSafeReturnTo} from '@/lib/auth/return-to'
import {isSupabaseConfigured} from '@/lib/env'
import {getCurrentUser} from '@/lib/auth/session'
import {getBandInviteByToken} from '@/lib/invites/service'

type LoginPageProps = {
  searchParams: Promise<{
    message?: string
    next?: string
    returnTo?: string
  }>
}

export default async function LoginPage({searchParams}: LoginPageProps) {
  const {message, next, returnTo: rawReturnTo} = await searchParams
  const returnTo = resolveSafeReturnTo(next || rawReturnTo)
  const authMessage = resolveAuthMessage(message)
  const user = await getCurrentUser()
  const inviteToken = extractInviteTokenFromReturnTo(returnTo)
  const invite =
    inviteToken
      ? await getBandInviteByToken(inviteToken).catch(() => null)
      : null
  const emailHelper = invite
    ? 'Usa exactamente este email para aceptar la invitacion.'
    : undefined

  if (user) {
    redirect(returnTo)
  }

  return (
    <main className="auth-wrap auth-wrap--immersive auth-wrap--app">
      <div className="auth-ambient auth-ambient--primary" aria-hidden="true" />
      <div className="auth-ambient auth-ambient--secondary" aria-hidden="true" />

      <section className="auth-card reveal reveal--visible desktop-surface">
        <div className="auth-card__intro">
          <div className="auth-card__app-row">
            <div>
              <p className="eyebrow">Web Bands App</p>
              <p className="auth-card__microcopy">Version mobile privada para gestion de bandas</p>
            </div>
          </div>
          <p className="eyebrow">Acceso privado</p>
          <h1>Entrar al dashboard</h1>
          <p className="muted">
            Cada banda entra a su panel con permisos reales en Supabase, validaciones server-side
            y una superficie pensada para editar sin friccion.
          </p>
        </div>

        {!isSupabaseConfigured() ? (
          <div className="status status--warning">
            Falta configurar Supabase. Completa `NEXT_PUBLIC_SUPABASE_URL` y
            `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local`.
          </div>
        ) : null}

        {authMessage ? (
          <div className={`status status--${authMessage.tone}`}>{authMessage.message}</div>
        ) : null}

        {invite ? <InviteOnboardingCard invite={invite} /> : null}

        <form action={signInWithGoogle} className="auth-oauth-form">
          <input type="hidden" name="returnTo" value={returnTo} />
          <button className="button button--ghost auth-oauth-button" type="submit">
            Continuar con Google
          </button>
        </form>

        <div className="auth-divider" aria-hidden="true">
          <span>o usa email y password</span>
        </div>

        <AuthEmailPasswordForm
          returnTo={returnTo}
          defaultEmail={invite?.email || ''}
          emailHelper={emailHelper}
        />
      </section>

      <section className="mobile-surface mobile-auth-screen">
        <div className="mobile-auth-screen__header">
          <span className="mobile-auth-screen__brand">Web Bands</span>
        </div>

        <div className="mobile-auth-card">
          <div className="mobile-auth-card__intro">
            <p className="eyebrow">Acceso privado</p>
            <h1>Entrar al dashboard</h1>
            <p className="muted">Gestiona bandas, roles y contenido publico desde una sola app.</p>
          </div>

          {!isSupabaseConfigured() ? (
            <div className="status status--warning">
              Falta configurar Supabase. Completa `NEXT_PUBLIC_SUPABASE_URL` y
              `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local`.
            </div>
          ) : null}

          {authMessage ? (
            <div className={`status status--${authMessage.tone}`}>{authMessage.message}</div>
          ) : null}

          {invite ? <InviteOnboardingCard invite={invite} mode="mobile" /> : null}

          <form action={signInWithGoogle} className="auth-oauth-form">
            <input type="hidden" name="returnTo" value={returnTo} />
            <button className="button button--ghost auth-oauth-button mobile-auth-card__oauth" type="submit">
              Continuar con Google
            </button>
          </form>

          <div className="auth-divider" aria-hidden="true">
            <span>o usa email y password</span>
          </div>

          <AuthEmailPasswordForm
            returnTo={returnTo}
            defaultEmail={invite?.email || ''}
            emailHelper={emailHelper}
            submitClassName="mobile-auth-card__submit"
          />
        </div>

        <footer className="mobile-auth-screen__footer">
          <span>Perfiles</span>
          <span>Dashboard</span>
          <span>Multiusuario</span>
        </footer>
      </section>
    </main>
  )
}
