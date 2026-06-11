import {beforeEach, describe, expect, it, vi} from 'vitest'

const {
  mockRedirect,
  mockGetMembershipRole,
  mockCanManageBand,
  mockRequireUser,
  mockCreateClient,
  mockCreateAdminClient,
  mockSendBandInviteEmail,
  mockIsBandInviteEmailConfigured,
  mockLogServerError,
  mockGetServerActionRequestContext,
  mockConsumeRateLimit,
  mockWriteAuditLog,
} = vi.hoisted(() => ({
  mockRedirect: vi.fn((location: string) => {
    const error = new Error(`NEXT_REDIRECT:${location}`) as Error & {digest: string}
    error.digest = `NEXT_REDIRECT;push;${location};307;`
    throw error
  }),
  mockGetMembershipRole: vi.fn(),
  mockCanManageBand: vi.fn(),
  mockRequireUser: vi.fn(),
  mockCreateClient: vi.fn(),
  mockCreateAdminClient: vi.fn(),
  mockSendBandInviteEmail: vi.fn(),
  mockIsBandInviteEmailConfigured: vi.fn(),
  mockLogServerError: vi.fn(),
  mockGetServerActionRequestContext: vi.fn(),
  mockConsumeRateLimit: vi.fn(),
  mockWriteAuditLog: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

vi.mock('@/lib/auth/permissions', () => ({
  canManageBand: mockCanManageBand,
  getMembershipRole: mockGetMembershipRole,
}))

vi.mock('@/lib/auth/session', () => ({
  requireUser: mockRequireUser,
}))

vi.mock('@/lib/email/resend', () => ({
  isBandInviteEmailConfigured: mockIsBandInviteEmailConfigured,
  sendBandInviteEmail: mockSendBandInviteEmail,
}))

vi.mock('@/lib/server/log', () => ({
  logServerError: mockLogServerError,
  logServerWarning: vi.fn(),
}))

vi.mock('@/lib/server/request-context', () => ({
  getServerActionRequestContext: mockGetServerActionRequestContext,
}))

vi.mock('@/lib/server/rate-limit', () => ({
  RATE_LIMIT_POLICIES: {
    teamActions: {
      bucket: 'bands.team_actions',
      maxAttempts: 20,
      windowSeconds: 300,
    },
  },
  consumeRateLimit: mockConsumeRateLimit,
}))

vi.mock('@/lib/server/audit', () => ({
  writeAuditLog: mockWriteAuditLog,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mockCreateAdminClient,
}))

vi.mock('@/lib/env', () => ({
  siteUrl: 'https://web-bands-v2.vercel.app',
}))

import {acceptBandInvite, createBandInvite} from './team-actions'

function createFormData(values: Record<string, string>) {
  const formData = new FormData()

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value)
  }

  return formData
}

function createAdminMock({
  existingProfile = null,
  existingInvite = null,
  insertInvite = {token: 'invite-token'},
  band = {
    id: 'band-1',
    name: 'Viejas Runas',
    slug: 'viejas-runas',
    status: 'published',
  },
  inviteForAccept = null,
  membershipForAccept = null,
}: {
  existingProfile?: {id: string; email: string} | null
  existingInvite?: {id: string; token: string} | null
  insertInvite?: {token: string} | null
  band?: {id: string; name: string; slug: string; status: string} | null
  inviteForAccept?: {
    id: string
    band_id: string
    email: string
    role: 'viewer' | 'editor' | 'admin' | 'owner'
    expires_at: string
    accepted_at: string | null
  } | null
  membershipForAccept?: {role: 'viewer' | 'editor' | 'admin' | 'owner'} | null
} = {}) {
  return {
    from(table: string) {
      if (table === 'bands') {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: vi.fn().mockResolvedValue({data: band, error: null}),
                }
              },
            }
          },
        }
      }

      if (table === 'profiles') {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: vi.fn().mockResolvedValue({data: existingProfile, error: null}),
                }
              },
            }
          },
        }
      }

      if (table === 'band_invites') {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      is() {
                        return {
                          maybeSingle: vi.fn().mockResolvedValue({
                            data: existingInvite ?? inviteForAccept,
                            error: null,
                          }),
                        }
                      },
                    }
                  },
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: inviteForAccept,
                    error: null,
                  }),
                }
              },
            }
          },
          insert() {
            return {
              select() {
                return {
                  single: vi.fn().mockResolvedValue({data: insertInvite, error: null}),
                }
              },
            }
          },
          update() {
            return {
              eq() {
                return Promise.resolve({error: null})
              },
            }
          },
        }
      }

      if (table === 'band_memberships') {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: membershipForAccept,
                        error: null,
                      }),
                    }
                  },
                }
              },
            }
          },
          insert: vi.fn().mockResolvedValue({error: null}),
          update() {
            return {
              eq() {
                return {
                  eq() {
                    return Promise.resolve({error: null})
                  },
                }
              },
            }
          },
        }
      }

      throw new Error(`Unexpected table mock: ${table}`)
    },
  }
}

describe('team actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireUser.mockResolvedValue({id: 'user-1', email: 'owner@example.com'})
    mockCreateClient.mockResolvedValue({})
    mockGetMembershipRole.mockResolvedValue('owner')
    mockCanManageBand.mockReturnValue(true)
    mockIsBandInviteEmailConfigured.mockReturnValue(true)
    mockGetServerActionRequestContext.mockResolvedValue({
      ip: '127.0.0.1',
      requestId: 'req-1',
      userAgent: 'Vitest',
    })
    mockConsumeRateLimit.mockResolvedValue({
      allowed: true,
      keyHash: 'team-action-key',
      remaining: 19,
      resetAt: null,
      retryAfterSeconds: 0,
    })
    mockWriteAuditLog.mockResolvedValue(true)
  })

  it('creates an invite and redirects with success when email delivery works', async () => {
    mockCreateAdminClient.mockReturnValue(createAdminMock())
    mockSendBandInviteEmail.mockResolvedValue({id: 'email-1'})

    await expect(
      createBandInvite(
        createFormData({
          bandId: 'band-1',
          email: 'invitee@example.com',
          role: 'editor',
          returnTo: '/dashboard/bands/band-1',
        })
      )
    ).rejects.toThrow('NEXT_REDIRECT:/dashboard/bands/band-1?message=invite-sent')

    expect(mockSendBandInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'invitee@example.com',
        inviteUrl: 'https://web-bands-v2.vercel.app/invite/invite-token',
      })
    )
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'band.invite.created',
        actorUserId: 'user-1',
        bandId: 'band-1',
        targetType: 'band_invite',
      })
    )
  })

  it('keeps the invite and redirects with warning when email delivery fails', async () => {
    mockCreateAdminClient.mockReturnValue(createAdminMock())
    mockSendBandInviteEmail.mockRejectedValue(new Error('Resend unavailable'))

    await expect(
      createBandInvite(
        createFormData({
          bandId: 'band-1',
          email: 'invitee@example.com',
          role: 'editor',
          returnTo: '/dashboard/bands/band-1',
        })
      )
    ).rejects.toThrow('NEXT_REDIRECT:/dashboard/bands/band-1?message=invite-sent-email-failed')

    expect(mockLogServerError).toHaveBeenCalledWith(
      'band-invite-email-send-failed',
      expect.any(Error),
      expect.objectContaining({
        bandId: 'band-1',
        inviteEmail: 'invitee@example.com',
      })
    )
  })

  it('keeps the invite and skips email delivery when resend is not configured', async () => {
    mockCreateAdminClient.mockReturnValue(createAdminMock())
    mockIsBandInviteEmailConfigured.mockReturnValue(false)

    await expect(
      createBandInvite(
        createFormData({
          bandId: 'band-1',
          email: 'invitee@example.com',
          role: 'admin',
          returnTo: '/dashboard/bands/band-1/team',
        })
      )
    ).rejects.toThrow('NEXT_REDIRECT:/dashboard/bands/band-1/team?message=invite-sent-email-failed')

    expect(mockSendBandInviteEmail).not.toHaveBeenCalled()
  })

  it('blocks invite creation when the team action rate limit is exceeded', async () => {
    mockCreateAdminClient.mockReturnValue(createAdminMock())
    mockConsumeRateLimit.mockResolvedValue({
      allowed: false,
      keyHash: 'blocked-team-action',
      remaining: 0,
      resetAt: '2099-01-01T00:05:00.000Z',
      retryAfterSeconds: 300,
    })

    await expect(
      createBandInvite(
        createFormData({
          bandId: 'band-1',
          email: 'invitee@example.com',
          role: 'editor',
          returnTo: '/dashboard/bands/band-1',
        })
      )
    ).rejects.toThrow('NEXT_REDIRECT:/dashboard/bands/band-1?message=team-action-rate-limited')
  })

  it('rejects acceptance when the authenticated email does not match the invite', async () => {
    mockRequireUser.mockResolvedValue({id: 'user-2', email: 'other@example.com'})
    mockCreateAdminClient.mockReturnValue(
      createAdminMock({
        inviteForAccept: {
          id: 'invite-1',
          band_id: 'band-1',
          email: 'invitee@example.com',
          role: 'editor',
          expires_at: '2099-05-30T18:00:00.000Z',
          accepted_at: null,
        },
      })
    )

    await expect(
      acceptBandInvite(
        createFormData({
          inviteId: 'invite-1',
          returnTo: '/dashboard',
        })
      )
    ).rejects.toThrow('NEXT_REDIRECT:/dashboard?message=invite-email-mismatch')
  })
})
