import {beforeEach, describe, expect, it, vi} from 'vitest'

const {mockCreateAdminClient, mockIsSupabaseAdminConfigured, mockLogServerError, mockLogServerInfo} = vi.hoisted(
  () => ({
    mockCreateAdminClient: vi.fn(),
    mockIsSupabaseAdminConfigured: vi.fn(),
    mockLogServerError: vi.fn(),
    mockLogServerInfo: vi.fn(),
  })
)

vi.mock('@/lib/env', () => ({
  isSupabaseAdminConfigured: mockIsSupabaseAdminConfigured,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mockCreateAdminClient,
}))

vi.mock('@/lib/server/log', () => ({
  logServerError: mockLogServerError,
  logServerInfo: mockLogServerInfo,
}))

import {serializeAuditLog, writeAuditLog} from './audit'

describe('audit helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsSupabaseAdminConfigured.mockReturnValue(true)
  })

  it('serializes metadata and hashes the ip before persisting', () => {
    const payload = serializeAuditLog({
      action: 'band.updated',
      actorUserId: 'user-1',
      bandId: 'band-1',
      ip: '127.0.0.1',
      metadata: {
        nested: {
          after: 'published',
          before: undefined,
        },
      },
      targetId: 'band-1',
      targetType: 'band',
      userAgent: 'Vitest Browser',
    })

    expect(payload).toMatchObject({
      action: 'band.updated',
      actor_user_id: 'user-1',
      band_id: 'band-1',
      metadata: {
        nested: {
          after: 'published',
        },
      },
      target_id: 'band-1',
      target_type: 'band',
      user_agent: 'Vitest Browser',
    })
    expect(payload.ip_hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('writes the serialized audit payload with the admin client', async () => {
    const insert = vi.fn().mockResolvedValue({error: null})
    mockCreateAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        insert,
      })),
    })

    const ok = await writeAuditLog({
      action: 'band.updated',
      actorUserId: 'user-1',
      bandId: 'band-1',
      targetId: 'band-1',
      targetType: 'band',
    })

    expect(ok).toBe(true)
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'band.updated',
        actor_user_id: 'user-1',
        band_id: 'band-1',
      })
    )
  })
})
