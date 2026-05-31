import {describe, expect, it} from 'vitest'

import {resolveAuthMessage, toAuthMessageCode} from './messages'

describe('auth message helpers', () => {
  it('maps known Supabase login errors to stable UI codes', () => {
    expect(toAuthMessageCode('Invalid login credentials')).toBe('invalid-login-credentials')
    expect(toAuthMessageCode('Email not confirmed')).toBe('email-not-confirmed')
    expect(toAuthMessageCode('Email rate limit exceeded')).toBe('email-rate-limit')
    expect(toAuthMessageCode('User already registered')).toBe('user-already-registered')
    expect(toAuthMessageCode('Email address "x" is invalid')).toBe('email-invalid')
  })

  it('returns friendly message metadata for known codes', () => {
    expect(resolveAuthMessage('signup-confirm-email')).toEqual({
      tone: 'success',
      message: 'Cuenta creada. Revisa tu email para confirmarla antes de iniciar sesion.',
    })
    expect(resolveAuthMessage('login-rate-limited')).toEqual({
      tone: 'warning',
      message: 'Demasiados intentos por ahora. Espera unos minutos antes de volver a intentar.',
    })
    expect(resolveAuthMessage('google-auth-cancelled')).toEqual({
      tone: 'warning',
      message: 'Cancelaste el acceso con Google antes de completar el inicio de sesion.',
    })
    expect(resolveAuthMessage('google-auth-unavailable')).toEqual({
      tone: 'error',
      message: 'Google no esta disponible para iniciar sesion en este momento. Intenta con email y password.',
    })
  })

  it('falls back to a raw error message when the code is unknown', () => {
    expect(resolveAuthMessage('Unexpected auth failure')).toEqual({
      tone: 'error',
      message: 'Unexpected auth failure',
    })
  })
})
