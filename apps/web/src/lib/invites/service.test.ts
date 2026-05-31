import {describe, expect, it} from 'vitest'

import {resolveInviteAccessState} from './service'
import type {BandInviteSummary} from '@/types/band'

function createInvite(overrides: Partial<BandInviteSummary> = {}): BandInviteSummary {
  return {
    id: 'invite-1',
    bandId: 'band-1',
    email: 'invitee@example.com',
    role: 'editor',
    token: 'token-1',
    expiresAt: '2099-05-30T18:00:00.000Z',
    acceptedAt: null,
    createdAt: '2026-05-25T18:00:00.000Z',
    band: {
      id: 'band-1',
      name: 'Viejas Runas',
      slug: 'viejas-runas',
      status: 'published',
    },
    ...overrides,
  }
}

describe('resolveInviteAccessState', () => {
  it('resolves the main invite landing states', () => {
    expect(resolveInviteAccessState(null)).toBe('not-found')
    expect(resolveInviteAccessState(createInvite({acceptedAt: '2026-05-25T19:00:00.000Z'}))).toBe('accepted')
    expect(resolveInviteAccessState(createInvite({expiresAt: '2020-05-25T19:00:00.000Z'}))).toBe('expired')
    expect(resolveInviteAccessState(createInvite())).toBe('requires-login')
    expect(resolveInviteAccessState(createInvite(), 'other@example.com')).toBe('email-mismatch')
    expect(resolveInviteAccessState(createInvite(), 'INVITEE@example.com')).toBe('ready')
  })
})
