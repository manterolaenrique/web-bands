import {describe, expect, it} from 'vitest'

import {buildBandInviteEmail} from './resend'

describe('buildBandInviteEmail', () => {
  it('creates a stable subject and includes the invite url in html and text', () => {
    const result = buildBandInviteEmail({
      bandName: 'Viejas Runas',
      roleLabel: 'Editor',
      expiresAt: '2026-05-30T18:00:00.000Z',
      inviteUrl: 'https://example.com/invite/demo-token',
    })

    expect(result.subject).toBe('Te invitaron a colaborar en Viejas Runas')
    expect(result.html).toContain('https://example.com/invite/demo-token')
    expect(result.text).toContain('https://example.com/invite/demo-token')
    expect(result.html).toContain('Editor')
  })
})
