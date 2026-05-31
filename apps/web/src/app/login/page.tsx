import {redirect} from 'next/navigation'

import {signIn, signInWithGoogle, signUp} from '@/app/login/actions'
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
    <main className="auth-wrap">
      <section className="auth-card">
        <p className="eyebrow">Acceso privado</p>
        <h1>Entrar al dashboard</h1>
        <p className="muted">
          Cada banda accede a su propio panel. La autorizacion real vive en Supabase RLS y en
          validaciones server-side.
        </p>

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
          <button className="button auth-oauth-button" type="submit">
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
            <input className="form-input" type="email" name="email" required autoComplete="email" />
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
            />
          </label>
          <div className="row-actions form-field--full">
            <button className="button button--primary" type="submit">
              Entrar
            </button>
            <button className="button" formAction={signUp} type="submit">
              Crear cuenta
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
