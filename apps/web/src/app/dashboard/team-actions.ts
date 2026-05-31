'use server'

import {redirect} from 'next/navigation'
import {isRedirectError} from 'next/dist/client/components/redirect-error'

import {canManageBand, getMembershipRole} from '@/lib/auth/permissions'
import {
  canAssignMemberRole,
  canRemoveMemberRole,
  compareMemberRoles,
  getManageableRoleOptions,
  getRoleLabel,
  isInviteExpired,
  normalizeInviteEmail,
} from '@/lib/bands/members'
import {sendBandInviteEmail} from '@/lib/email/resend'
import {siteUrl} from '@/lib/env'
import {requireUser} from '@/lib/auth/session'
import {writeAuditLog} from '@/lib/server/audit'
import {logServerError, logServerWarning} from '@/lib/server/log'
import {getServerActionRequestContext} from '@/lib/server/request-context'
import {consumeRateLimit, RATE_LIMIT_POLICIES} from '@/lib/server/rate-limit'
import {createAdminClient} from '@/lib/supabase/admin'
import {createClient} from '@/lib/supabase/server'
import type {BandMemberRole, SupabaseBand} from '@/types/band'

const VALID_MEMBER_ROLES = new Set<BandMemberRole>(['owner', 'admin', 'editor', 'viewer'])
const INVITE_WINDOW_IN_DAYS = 7

function parseMemberRole(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return null
  }

  return VALID_MEMBER_ROLES.has(value as BandMemberRole) ? (value as BandMemberRole) : null
}

function appendMessage(pathname: string, message: string) {
  const [base, rawQuery] = pathname.split('?')
  const params = new URLSearchParams(rawQuery || '')
  params.set('message', message)
  const query = params.toString()
  return query ? `${base}?${query}` : base
}

function redirectWithMessage(returnTo: string, message: string): never {
  redirect(appendMessage(returnTo, message))
}

async function enforceTeamActionRateLimit({
  action,
  bandId,
  requestId,
  returnTo,
  userId,
}: {
  action: string
  bandId: string
  requestId: string | null
  returnTo: string
  userId: string
}) {
  const rateLimitResult = await consumeRateLimit(RATE_LIMIT_POLICIES.teamActions, [userId, bandId])

  if (!rateLimitResult.allowed) {
    logServerWarning('rate_limit.blocked', {
      action,
      bandId,
      bucket: RATE_LIMIT_POLICIES.teamActions.bucket,
      keyHash: rateLimitResult.keyHash,
      requestId,
      retryAfterSeconds: rateLimitResult.retryAfterSeconds,
      userId,
    })

    redirectWithMessage(returnTo, 'team-action-rate-limited')
  }
}

async function getManagerContext(bandId: string, returnTo: string) {
  const user = await requireUser()
  const supabase = await createClient()
  const managerRole = await getMembershipRole(supabase, bandId, user.id)

  if (!managerRole || !canManageBand(managerRole)) {
    redirectWithMessage(returnTo, 'invite-role-forbidden')
  }

  return {
    user,
    managerRole: managerRole as BandMemberRole,
  }
}

async function countOwners(admin: ReturnType<typeof createAdminClient>, bandId: string) {
  const {count, error} = await admin
    .from('band_memberships')
    .select('*', {count: 'exact', head: true})
    .eq('band_id', bandId)
    .eq('role', 'owner')

  if (error) {
    throw error
  }

  return count || 0
}

function buildInviteUrl(token: string) {
  return new URL(`/invite/${token}`, siteUrl).toString()
}

async function sendInviteEmailOrLog({
  email,
  role,
  band,
  token,
  expiresAt,
}: {
  email: string
  role: BandMemberRole
  band: Pick<SupabaseBand, 'id' | 'name' | 'slug' | 'status'>
  token: string
  expiresAt: string
}) {
  try {
    await sendBandInviteEmail({
      to: email,
      bandName: band.name,
      roleLabel: getRoleLabel(role),
      expiresAt,
      inviteUrl: buildInviteUrl(token),
    })

    return true
  } catch (error) {
    logServerError('band-invite-email-send-failed', error, {
      bandId: band.id,
      inviteEmail: email,
      inviteRole: role,
    })

    return false
  }
}

export async function createBandInvite(formData: FormData) {
  const bandId = String(formData.get('bandId') || '')
  const returnTo = String(formData.get('returnTo') || `/dashboard/bands/${bandId}`)
  const rawEmail = String(formData.get('email') || '')
  const inviteRole = parseMemberRole(formData.get('role'))
  const requestContext = await getServerActionRequestContext()

  if (!bandId) {
    redirectWithMessage('/dashboard', 'invite-create-error')
  }

  if (!inviteRole) {
    redirectWithMessage(returnTo, 'invite-role-invalid')
  }

  const email = normalizeInviteEmail(rawEmail)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirectWithMessage(returnTo, 'invite-email-invalid')
  }

  const {user, managerRole} = await getManagerContext(bandId, returnTo)
  await enforceTeamActionRateLimit({
    action: 'band.invite.create',
    bandId,
    requestId: requestContext.requestId,
    returnTo,
    userId: user.id,
  })

  if (!getManageableRoleOptions(managerRole).includes(inviteRole)) {
    redirectWithMessage(returnTo, 'invite-role-forbidden')
  }

  if (user.email && email === normalizeInviteEmail(user.email)) {
    redirectWithMessage(returnTo, 'invite-self-forbidden')
  }

  try {
    const admin = createAdminClient()
    const {data: band, error: bandError} = await admin
      .from('bands')
      .select('id, name, slug, status')
      .eq('id', bandId)
      .maybeSingle()

    if (bandError) {
      throw bandError
    }

    if (!band) {
      redirectWithMessage(returnTo, 'invite-create-error')
    }

    const {data: existingProfile, error: profileError} = await admin
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()

    if (profileError) {
      throw profileError
    }

    if (existingProfile) {
      const {data: existingMembership, error: membershipError} = await admin
        .from('band_memberships')
        .select('role')
        .eq('band_id', bandId)
        .eq('user_id', existingProfile.id)
        .maybeSingle()

      if (membershipError) {
        throw membershipError
      }

      if (existingMembership) {
        redirectWithMessage(returnTo, 'invite-membership-exists')
      }
    }

    const {data: existingInvite, error: inviteLookupError} = await admin
      .from('band_invites')
      .select('id, token')
      .eq('band_id', bandId)
      .eq('email', email)
      .is('accepted_at', null)
      .maybeSingle()

    if (inviteLookupError) {
      throw inviteLookupError
    }

    const expiresAt = new Date(Date.now() + INVITE_WINDOW_IN_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const typedBand = band as Pick<SupabaseBand, 'id' | 'name' | 'slug' | 'status'>

    if (existingInvite) {
      const {error: updateError} = await admin
        .from('band_invites')
        .update({
          role: inviteRole,
          expires_at: expiresAt,
          created_by: user.id,
        })
        .eq('id', existingInvite.id)

      if (updateError) {
        throw updateError
      }

      const emailSent = await sendInviteEmailOrLog({
        email,
        role: inviteRole,
        band: typedBand,
        token: existingInvite.token,
        expiresAt,
      })

      await writeAuditLog({
        action: 'band.invite.updated',
        actorUserId: user.id,
        bandId,
        ip: requestContext.ip,
        metadata: {
          email,
          expiresAt,
          requestId: requestContext.requestId,
          role: inviteRole,
        },
        targetId: existingInvite.id,
        targetType: 'band_invite',
        userAgent: requestContext.userAgent,
      })

      redirectWithMessage(returnTo, emailSent ? 'invite-updated' : 'invite-updated-email-failed')
    }

    const {data: insertedInvite, error: insertError} = await admin
      .from('band_invites')
      .insert({
        band_id: bandId,
        email,
        role: inviteRole,
        created_by: user.id,
        expires_at: expiresAt,
      })
      .select('id, token')
      .single()

    if (insertError || !insertedInvite) {
      throw insertError
    }

    const emailSent = await sendInviteEmailOrLog({
      email,
      role: inviteRole,
      band: typedBand,
      token: insertedInvite.token,
      expiresAt,
    })

    await writeAuditLog({
      action: 'band.invite.created',
      actorUserId: user.id,
      bandId,
      ip: requestContext.ip,
      metadata: {
        email,
        expiresAt,
        requestId: requestContext.requestId,
        role: inviteRole,
      },
      targetId: insertedInvite.id,
      targetType: 'band_invite',
      userAgent: requestContext.userAgent,
    })

    redirectWithMessage(returnTo, emailSent ? 'invite-sent' : 'invite-sent-email-failed')
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }

    logServerError('band.invite.create_failed', error, {
      bandId,
      requestId: requestContext.requestId,
      userId: user.id,
    })
    redirectWithMessage(returnTo, 'invite-create-error')
  }
}

export async function updateBandMemberRole(formData: FormData) {
  const bandId = String(formData.get('bandId') || '')
  const memberUserId = String(formData.get('memberUserId') || '')
  const returnTo = String(formData.get('returnTo') || `/dashboard/bands/${bandId}`)
  const nextRole = parseMemberRole(formData.get('role'))
  const requestContext = await getServerActionRequestContext()

  if (!bandId || !memberUserId || !nextRole) {
    redirectWithMessage(returnTo, 'member-update-error')
  }

  const {user, managerRole} = await getManagerContext(bandId, returnTo)
  await enforceTeamActionRateLimit({
    action: 'band.member.role_update',
    bandId,
    requestId: requestContext.requestId,
    returnTo,
    userId: user.id,
  })

  if (memberUserId === user.id) {
    redirectWithMessage(returnTo, 'member-self-manage-forbidden')
  }

  try {
    const admin = createAdminClient()
    const {data: currentMembership, error: membershipError} = await admin
      .from('band_memberships')
      .select('role')
      .eq('band_id', bandId)
      .eq('user_id', memberUserId)
      .maybeSingle()

    if (membershipError) {
      throw membershipError
    }

    if (!currentMembership) {
      redirectWithMessage(returnTo, 'member-update-error')
    }

    const currentRole = currentMembership.role as BandMemberRole
    if (!canAssignMemberRole(managerRole, currentRole, nextRole)) {
      redirectWithMessage(returnTo, 'invite-role-forbidden')
    }

    if (currentRole === 'owner' && nextRole !== 'owner') {
      const owners = await countOwners(admin, bandId)
      if (owners <= 1) {
        redirectWithMessage(returnTo, 'owner-last-required')
      }
    }

    const {error: updateError} = await admin
      .from('band_memberships')
      .update({
        role: nextRole,
      })
      .eq('band_id', bandId)
      .eq('user_id', memberUserId)

    if (updateError) {
      throw updateError
    }

    await writeAuditLog({
      action: 'band.member.role_updated',
      actorUserId: user.id,
      bandId,
      ip: requestContext.ip,
      metadata: {
        nextRole,
        previousRole: currentRole,
        requestId: requestContext.requestId,
      },
      targetId: memberUserId,
      targetType: 'band_membership',
      userAgent: requestContext.userAgent,
    })

    redirectWithMessage(returnTo, 'member-updated')
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }

    logServerError('band.member.role_update_failed', error, {
      bandId,
      requestId: requestContext.requestId,
      userId: user.id,
    })
    redirectWithMessage(returnTo, 'member-update-error')
  }
}

export async function removeBandMember(formData: FormData) {
  const bandId = String(formData.get('bandId') || '')
  const memberUserId = String(formData.get('memberUserId') || '')
  const returnTo = String(formData.get('returnTo') || `/dashboard/bands/${bandId}`)
  const requestContext = await getServerActionRequestContext()

  if (!bandId || !memberUserId) {
    redirectWithMessage(returnTo, 'member-remove-error')
  }

  const {user, managerRole} = await getManagerContext(bandId, returnTo)
  await enforceTeamActionRateLimit({
    action: 'band.member.remove',
    bandId,
    requestId: requestContext.requestId,
    returnTo,
    userId: user.id,
  })

  if (memberUserId === user.id) {
    redirectWithMessage(returnTo, 'member-self-manage-forbidden')
  }

  try {
    const admin = createAdminClient()
    const {data: currentMembership, error: membershipError} = await admin
      .from('band_memberships')
      .select('role')
      .eq('band_id', bandId)
      .eq('user_id', memberUserId)
      .maybeSingle()

    if (membershipError) {
      throw membershipError
    }

    if (!currentMembership) {
      redirectWithMessage(returnTo, 'member-remove-error')
    }

    const currentRole = currentMembership.role as BandMemberRole
    if (!canRemoveMemberRole(managerRole, currentRole)) {
      redirectWithMessage(returnTo, 'invite-role-forbidden')
    }

    if (currentRole === 'owner') {
      const owners = await countOwners(admin, bandId)
      if (owners <= 1) {
        redirectWithMessage(returnTo, 'owner-last-required')
      }
    }

    const {error: deleteError} = await admin
      .from('band_memberships')
      .delete()
      .eq('band_id', bandId)
      .eq('user_id', memberUserId)

    if (deleteError) {
      throw deleteError
    }

    await writeAuditLog({
      action: 'band.member.removed',
      actorUserId: user.id,
      bandId,
      ip: requestContext.ip,
      metadata: {
        removedRole: currentRole,
        requestId: requestContext.requestId,
      },
      targetId: memberUserId,
      targetType: 'band_membership',
      userAgent: requestContext.userAgent,
    })

    redirectWithMessage(returnTo, 'member-removed')
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }

    logServerError('band.member.remove_failed', error, {
      bandId,
      requestId: requestContext.requestId,
      userId: user.id,
    })
    redirectWithMessage(returnTo, 'member-remove-error')
  }
}

export async function revokeBandInvite(formData: FormData) {
  const bandId = String(formData.get('bandId') || '')
  const inviteId = String(formData.get('inviteId') || '')
  const returnTo = String(formData.get('returnTo') || `/dashboard/bands/${bandId}`)
  const requestContext = await getServerActionRequestContext()

  if (!bandId || !inviteId) {
    redirectWithMessage(returnTo, 'invite-revoke-error')
  }

  const {user, managerRole} = await getManagerContext(bandId, returnTo)
  await enforceTeamActionRateLimit({
    action: 'band.invite.revoke',
    bandId,
    requestId: requestContext.requestId,
    returnTo,
    userId: user.id,
  })

  try {
    const admin = createAdminClient()
    const {data: invite, error: inviteError} = await admin
      .from('band_invites')
      .select('role')
      .eq('id', inviteId)
      .eq('band_id', bandId)
      .maybeSingle()

    if (inviteError) {
      throw inviteError
    }

    if (!invite) {
      redirectWithMessage(returnTo, 'invite-not-found')
    }

    if (!canAssignMemberRole(managerRole, invite.role as BandMemberRole, invite.role as BandMemberRole)) {
      redirectWithMessage(returnTo, 'invite-role-forbidden')
    }

    const {error: deleteError} = await admin.from('band_invites').delete().eq('id', inviteId).eq('band_id', bandId)

    if (deleteError) {
      throw deleteError
    }

    await writeAuditLog({
      action: 'band.invite.revoked',
      actorUserId: user.id,
      bandId,
      ip: requestContext.ip,
      metadata: {
        inviteRole: invite.role,
        requestId: requestContext.requestId,
      },
      targetId: inviteId,
      targetType: 'band_invite',
      userAgent: requestContext.userAgent,
    })

    redirectWithMessage(returnTo, 'invite-revoked')
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }

    logServerError('band.invite.revoke_failed', error, {
      bandId,
      requestId: requestContext.requestId,
      userId: user.id,
    })
    redirectWithMessage(returnTo, 'invite-revoke-error')
  }
}

export async function acceptBandInvite(formData: FormData) {
  const inviteId = String(formData.get('inviteId') || '')
  const returnTo = String(formData.get('returnTo') || '/dashboard')
  const requestContext = await getServerActionRequestContext()

  if (!inviteId) {
    redirectWithMessage(returnTo, 'invite-accept-error')
  }

  const user = await requireUser()
  const userEmail = normalizeInviteEmail(user.email || '')

  if (!userEmail) {
    redirectWithMessage(returnTo, 'invite-accept-error')
  }

  try {
    const admin = createAdminClient()
    const {data: invite, error: inviteError} = await admin
      .from('band_invites')
      .select('id, band_id, email, role, expires_at, accepted_at')
      .eq('id', inviteId)
      .maybeSingle()

    if (inviteError) {
      throw inviteError
    }

    if (!invite) {
      redirectWithMessage(returnTo, 'invite-not-found')
    }

    if (normalizeInviteEmail(invite.email) !== userEmail) {
      redirectWithMessage(returnTo, 'invite-email-mismatch')
    }

    if (invite.accepted_at) {
      redirectWithMessage(returnTo, 'invite-already-accepted')
    }

    if (isInviteExpired(invite.expires_at)) {
      redirectWithMessage(returnTo, 'invite-expired')
    }

    await enforceTeamActionRateLimit({
      action: 'band.invite.accept',
      bandId: invite.band_id,
      requestId: requestContext.requestId,
      returnTo,
      userId: user.id,
    })

    const {data: currentMembership, error: membershipError} = await admin
      .from('band_memberships')
      .select('role')
      .eq('band_id', invite.band_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError) {
      throw membershipError
    }

    if (currentMembership) {
      const currentRole = currentMembership.role as BandMemberRole
      const invitedRole = invite.role as BandMemberRole

      if (compareMemberRoles(invitedRole, currentRole) > 0) {
        const {error: roleUpdateError} = await admin
          .from('band_memberships')
          .update({
            role: invitedRole,
          })
          .eq('band_id', invite.band_id)
          .eq('user_id', user.id)

        if (roleUpdateError) {
          throw roleUpdateError
        }
      }
    } else {
      const {error: insertError} = await admin.from('band_memberships').insert({
        band_id: invite.band_id,
        user_id: user.id,
        role: invite.role as BandMemberRole,
      })

      if (insertError) {
        throw insertError
      }
    }

    const {error: acceptedError} = await admin
      .from('band_invites')
      .update({
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite.id)

    if (acceptedError) {
      throw acceptedError
    }

    await writeAuditLog({
      action: 'band.invite.accepted',
      actorUserId: user.id,
      bandId: invite.band_id,
      ip: requestContext.ip,
      metadata: {
        requestId: requestContext.requestId,
        role: invite.role,
      },
      targetId: invite.id,
      targetType: 'band_invite',
      userAgent: requestContext.userAgent,
    })

    redirectWithMessage(returnTo, 'invite-accepted')
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }

    logServerError('band.invite.accept_failed', error, {
      inviteId,
      requestId: requestContext.requestId,
      userId: user.id,
    })
    redirectWithMessage(returnTo, 'invite-accept-error')
  }
}
