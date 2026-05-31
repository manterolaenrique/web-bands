import {normalizeInviteEmail, isInviteExpired} from '@/lib/bands/members'
import {createAdminClient} from '@/lib/supabase/admin'
import type {BandInviteSummary, BandMemberRole, SupabaseBand} from '@/types/band'

type BandInviteRow = {
  id: string
  band_id: string
  email: string
  role: BandMemberRole
  token: string
  expires_at: string
  accepted_at: string | null
  created_at: string
  bands:
    | Pick<SupabaseBand, 'id' | 'name' | 'slug' | 'status'>
    | Pick<SupabaseBand, 'id' | 'name' | 'slug' | 'status'>[]
    | null
}

export type InviteAccessState =
  | 'not-found'
  | 'accepted'
  | 'expired'
  | 'requires-login'
  | 'email-mismatch'
  | 'ready'

function resolveBand(row: BandInviteRow['bands']) {
  return Array.isArray(row) ? row[0] || null : row
}

export function mapBandInviteRow(row: BandInviteRow): BandInviteSummary {
  return {
    id: row.id,
    bandId: row.band_id,
    email: row.email,
    role: row.role,
    token: row.token,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
    band: resolveBand(row.bands) || undefined,
  }
}

export async function getBandInviteByToken(token: string) {
  const admin = createAdminClient()
  const {data, error} = await admin
    .from('band_invites')
    .select('id, band_id, email, role, token, expires_at, accepted_at, created_at, bands(id, name, slug, status)')
    .eq('token', token)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return mapBandInviteRow(data as BandInviteRow)
}

export function resolveInviteAccessState(invite: BandInviteSummary | null, userEmail?: string | null): InviteAccessState {
  if (!invite) {
    return 'not-found'
  }

  if (invite.acceptedAt) {
    return 'accepted'
  }

  if (isInviteExpired(invite.expiresAt)) {
    return 'expired'
  }

  if (!userEmail) {
    return 'requires-login'
  }

  if (normalizeInviteEmail(userEmail) !== normalizeInviteEmail(invite.email)) {
    return 'email-mismatch'
  }

  return 'ready'
}

