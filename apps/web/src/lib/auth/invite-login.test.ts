import {describe, expect, it} from 'vitest'

import {extractInviteTokenFromReturnTo, isInviteReturnTo} from './invite-login'

describe('invite login helpers', () => {
  it('extracts the invite token from a safe return path', () => {
    expect(extractInviteTokenFromReturnTo('/invite/demo-token')).toBe('demo-token')
    expect(extractInviteTokenFromReturnTo('/invite/demo-token?foo=bar')).toBe('demo-token')
  })

  it('returns null for non-invite routes', () => {
    expect(extractInviteTokenFromReturnTo('/dashboard')).toBeNull()
    expect(extractInviteTokenFromReturnTo('/dashboard/account')).toBeNull()
  })

  it('detects invite return paths', () => {
    expect(isInviteReturnTo('/invite/demo-token')).toBe(true)
    expect(isInviteReturnTo('/dashboard')).toBe(false)
  })
})
