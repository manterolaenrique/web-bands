export type AuthMessageTone = 'success' | 'warning' | 'error'

const AUTH_MESSAGE_CONTENT: Record<
  string,
  {
    tone: AuthMessageTone
    message: string
  }
> = {
  'supabase-not-configured': {
    tone: 'warning',
    message: 'Falta configurar Supabase antes de usar el acceso privado.',
  },
  'missing-credentials': {
    tone: 'error',
    message: 'Completa email y password para continuar.',
  },
  'invalid-login-credentials': {
    tone: 'error',
    message: 'El email o el password no coinciden con una cuenta valida.',
  },
  'login-rate-limited': {
    tone: 'warning',
    message: 'Demasiados intentos por ahora. Espera unos minutos antes de volver a intentar.',
  },
  'google-auth-unavailable': {
    tone: 'error',
    message: 'Google no esta disponible para iniciar sesion en este momento. Intenta con email y password.',
  },
  'google-auth-failed': {
    tone: 'error',
    message: 'No pudimos completar el inicio de sesion con Google. Intenta de nuevo.',
  },
  'google-auth-cancelled': {
    tone: 'warning',
    message: 'Cancelaste el acceso con Google antes de completar el inicio de sesion.',
  },
  'email-not-confirmed': {
    tone: 'warning',
    message: 'Confirma tu email antes de iniciar sesion.',
  },
  'email-rate-limit': {
    tone: 'warning',
    message: 'Superaste el limite de emails por ahora. Espera un momento antes de volver a probar.',
  },
  'email-invalid': {
    tone: 'error',
    message: 'El email ingresado no es valido.',
  },
  'user-already-registered': {
    tone: 'warning',
    message: 'Ya existe una cuenta con ese email. Puedes intentar iniciar sesion.',
  },
  'signup-confirm-email': {
    tone: 'success',
    message: 'Cuenta creada. Revisa tu email para confirmarla antes de iniciar sesion.',
  },
}

export function resolveAuthMessage(message: string | undefined) {
  if (!message) {
    return null
  }

  return (
    AUTH_MESSAGE_CONTENT[message] || {
      tone: 'error',
      message,
    }
  )
}

export function toAuthMessageCode(message: string) {
  const normalized = message.trim().toLowerCase()

  if (normalized.includes('invalid login credentials')) {
    return 'invalid-login-credentials'
  }

  if (normalized.includes('email not confirmed')) {
    return 'email-not-confirmed'
  }

  if (normalized.includes('email rate limit exceeded')) {
    return 'email-rate-limit'
  }

  if (normalized.includes('user already registered')) {
    return 'user-already-registered'
  }

  if (normalized.includes('email address') && normalized.includes('invalid')) {
    return 'email-invalid'
  }

  return message
}
