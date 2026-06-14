import {signIn, signUp} from '@/app/login/actions'

import {PasswordField} from './PasswordField'

export function AuthEmailPasswordForm({
  returnTo,
  defaultEmail = '',
  emailHelper,
  submitClassName = '',
}: {
  returnTo: string
  defaultEmail?: string
  emailHelper?: string
  submitClassName?: string
}) {
  return (
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
          defaultValue={defaultEmail}
        />
        {emailHelper ? <span className="form-helper">{emailHelper}</span> : null}
      </label>

      <PasswordField />

      <div className="row-actions row-actions--stack-mobile form-field--full">
        <button className={`button button--primary ${submitClassName}`.trim()} type="submit">
          Entrar
        </button>
        <button className="button" formAction={signUp} type="submit">
          Crear cuenta
        </button>
      </div>
    </form>
  )
}
