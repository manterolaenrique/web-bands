import type {BandMemberRole} from '@/types/band'

const ROLE_PRIORITY: Record<BandMemberRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  owner: 3,
}

export function normalizeInviteEmail(email: string) {
  return email.trim().toLowerCase()
}

export function getManageableRoleOptions(role: BandMemberRole) {
  if (role === 'owner') {
    return ['viewer', 'editor', 'admin', 'owner'] satisfies BandMemberRole[]
  }

  if (role === 'admin') {
    return ['viewer', 'editor', 'admin'] satisfies BandMemberRole[]
  }

  return [] satisfies BandMemberRole[]
}

export function canAssignMemberRole(
  managerRole: BandMemberRole | undefined,
  currentRole: BandMemberRole,
  nextRole: BandMemberRole
) {
  if (!managerRole) {
    return false
  }

  if (managerRole === 'owner') {
    return true
  }

  if (managerRole === 'admin') {
    return currentRole !== 'owner' && nextRole !== 'owner'
  }

  return false
}

export function canRemoveMemberRole(managerRole: BandMemberRole | undefined, currentRole: BandMemberRole) {
  if (!managerRole) {
    return false
  }

  if (managerRole === 'owner') {
    return true
  }

  if (managerRole === 'admin') {
    return currentRole !== 'owner'
  }

  return false
}

export function compareMemberRoles(left: BandMemberRole, right: BandMemberRole) {
  return ROLE_PRIORITY[left] - ROLE_PRIORITY[right]
}

export function isInviteExpired(expiresAt: string, now = new Date()) {
  return new Date(expiresAt).getTime() <= now.getTime()
}

export function getRoleLabel(role: BandMemberRole) {
  switch (role) {
    case 'owner':
      return 'Owner'
    case 'admin':
      return 'Admin'
    case 'editor':
      return 'Editor'
    case 'viewer':
      return 'Viewer'
    default:
      return role
  }
}
