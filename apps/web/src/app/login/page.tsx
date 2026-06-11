import {redirect} from 'next/navigation'

import {signIn, signInWithGoogle, signUp} from '@/app/login/actions'
import {PwaInstallPrompt} from '@/components/pwa/PwaInstallPrompt'
import {resolveAuthMessage} from '@/lib/auth/messages'
import {resolveSafeReturnTo} from '@/lib/auth/return-to'
import {isSupabaseConfigured} from '@/lib/env'
import {getCurrentUser} from '@/lib/auth/session'

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
            <PwaInstallPrompt variant="chip" className="auth-card__install-chip" />
          </div>
          <p className="eyebrow">Acceso privado</p>
          <h1>Entrar al dashboard</h1>
          <p className="muted">
            Cada banda entra a su panel con permisos reales en Supabase, validaciones server-side
            y una superficie pensada para editar sin friccion.
          </p>
        </div>

        <PwaInstallPrompt variant="card" className="auth-card__install-card" />

        {!isSupabaseConfigured() ? (
          <div className="status status--warning">
            Falta configurar Supabase. Completa `NEXT_PUBLIC_SUPABASE_URL` y
            `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local`.
          </div>
        ) : null}

        {authMessage ? (
          <div className={`status status--${authMessage.tone}`}>{authMessage.message}</div>
        ) : null}

        <form action={signInWithGoogle} className="auth-oauth-form">
          <input type="hidden" name="returnTo" value={returnTo} />
          <button className="button button--ghost auth-oauth-button" type="submit">
            Continuar con Google
          </button>
        </form>

        <div className="auth-divider" aria-hidden="true">
          <span>o usa email y password</span>
        </div>

        <form action={signIn} className="form-grid">
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="form-field form-field--full">
            <span className="form-label">Email</span>
            <input
              className="form-input"
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="nombre@ejemplo.com"
            />
          </label>
          <label className="form-field form-field--full">
            <span className="form-label">Password</span>
            <input
              className="form-input"
              type="password"
              name="password"
              minLength={8}
              required
              autoComplete="current-password"
              placeholder="********"
            />
          </label>
          <div className="row-actions row-actions--stack-mobile form-field--full">
            <button className="button button--primary" type="submit">
              Entrar
            </button>
            <button className="button" formAction={signUp} type="submit">
              Crear cuenta
            </button>
          </div>
        </form>
      </section>

      <section className="mobile-surface mobile-auth-screen">
        <div className="mobile-auth-screen__header">
          <span className="mobile-auth-screen__brand">Web Bands</span>
          <PwaInstallPrompt variant="chip" className="mobile-auth-screen__install" />
        </div>

        <div className="mobile-auth-card">
          <div className="mobile-auth-card__intro">
            <p className="eyebrow">Acceso privado</p>
            <h1>Entrar al dashboard</h1>
            <p className="muted">Gestiona bandas, roles y contenido publico desde una sola app.</p>
          </div>

          <PwaInstallPrompt variant="card" className="auth-card__install-card" />

          {!isSupabaseConfigured() ? (
            <div className="status status--warning">
              Falta configurar Supabase. Completa `NEXT_PUBLIC_SUPABASE_URL` y
              `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local`.
            </div>
          ) : null}

          {authMessage ? (
            <div className={`status status--${authMessage.tone}`}>{authMessage.message}</div>
          ) : null}

          <form action={signInWithGoogle} className="auth-oauth-form">
            <input type="hidden" name="returnTo" value={returnTo} />
            <button className="button button--ghost auth-oauth-button mobile-auth-card__oauth" type="submit">
              Continuar con Google
            </button>
          </form>

          <div className="auth-divider" aria-hidden="true">
            <span>o usa email y password</span>
          </div>

          <form action={signIn} className="form-grid">
            <input type="hidden" name="returnTo" value={returnTo} />
            <label className="form-field form-field--full">
              <span className="form-label">Email</span>
              <input
                className="form-input"
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="nombre@ejemplo.com"
              />
            </label>
            <label className="form-field form-field--full">
              <span className="form-label">Password</span>
              <input
                className="form-input"
                type="password"
                name="password"
                minLength={8}
                required
                autoComplete="current-password"
                placeholder="********"
              />
            </label>
            <div className="row-actions row-actions--stack-mobile form-field--full">
              <button className="button button--primary mobile-auth-card__submit" type="submit">
                Entrar
              </button>
              <button className="button" formAction={signUp} type="submit">
                Crear cuenta
              </button>
            </div>
          </form>
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
