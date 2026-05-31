import {describe, expect, it} from 'vitest'

import {
  canAssignMemberRole,
  canRemoveMemberRole,
  compareMemberRoles,
  getManageableRoleOptions,
  isInviteExpired,
  normalizeInviteEmail,
} from '@/lib/bands/members'

describe('normalizeInviteEmail', () => {
  it('normalizes whitespace and casing', () => {
    expect(normalizeInviteEmail('  Demo@Example.COM  ')).toBe('demo@example.com')
  })
})

describe('getManageableRoleOptions', () => {
  it('returns all roles for owners', () => {
    expect(getManageableRoleOptions('owner')).toEqual(['viewer', 'editor', 'admin', 'owner'])
  })

  it('does not let admins assign owner', () => {
    expect(getManageableRoleOptions('admin')).toEqual(['viewer', 'editor', 'admin'])
  })
})

describe('member role guards', () => {
  it('lets owners assign any role', () => {
    expect(canAssignMemberRole('owner', 'viewer', 'owner')).toBe(true)
    expect(canRemoveMemberRole('owner', 'owner')).toBe(true)
  })

  it('prevents admins from touching owners or promoting to owner', () => {
    expect(canAssignMemberRole('admin', 'owner', 'editor')).toBe(false)
    expect(canAssignMemberRole('admin', 'viewer', 'owner')).toBe(false)
    expect(canRemoveMemberRole('admin', 'owner')).toBe(false)
    expect(canRemoveMemberRole('admin', 'editor')).toBe(true)
  })
})

describe('compareMemberRoles', () => {
  it('orders roles by privilege', () => {
    expect(compareMemberRoles('admin', 'editor')).toBeGreaterThan(0)
    expect(compareMemberRoles('viewer', 'owner')).toBeLessThan(0)
  })
})

describe('isInviteExpired', () => {
  it('detects expiration against a given clock', () => {
    const now = new Date('2026-05-25T12:00:00.000Z')

    expect(isInviteExpired('2026-05-24T12:00:00.000Z', now)).toBe(true)
    expect(isInviteExpired('2026-05-26T12:00:00.000Z', now)).toBe(false)
  })
})
