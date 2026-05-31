import {describe, expect, it} from 'vitest'

import {appendQueryParams, resolveSafeReturnTo} from './return-to'

describe('resolveSafeReturnTo', () => {
  it('accepts internal relative routes', () => {
    expect(resolveSafeReturnTo('/invite/demo-token')).toBe('/invite/demo-token')
    expect(resolveSafeReturnTo('/dashboard?message=ok')).toBe('/dashboard?message=ok')
  })

  it('falls back for external or malformed values', () => {
    expect(resolveSafeReturnTo('https://evil.example')).toBe('/dashboard')
    expect(resolveSafeReturnTo('//evil.example')).toBe('/dashboard')
    expect(resolveSafeReturnTo('javascript:alert(1)')).toBe('/dashboard')
    expect(resolveSafeReturnTo('')).toBe('/dashboard')
    expect(resolveSafeReturnTo(null)).toBe('/dashboard')
  })
})

describe('appendQueryParams', () => {
  it('adds and replaces query params on relative paths', () => {
    expect(appendQueryParams('/login', {message: 'invite-expired', next: '/invite/demo'})).toBe(
      '/login?message=invite-expired&next=%2Finvite%2Fdemo'
    )

    expect(appendQueryParams('/login?message=old', {message: 'new'})).toBe('/login?message=new')
  })
})
