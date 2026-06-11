import type {
  DashboardBandsData,
  DashboardBandSummary,
  SupabaseBand,
  BandInviteSummary,
  BandMemberRole,
} from '@web-bands/bands-domain'

import {isBandPublic} from '@/lib/bands/publication'
import {normalizeInviteEmail} from '@/lib/bands/members'
import {createAdminClient} from '@/lib/supabase/admin'
import {createClient} from '@/lib/supabase/server'

type MembershipRow = {
  role: BandMemberRole
  bands:
    | {
        id: string
        name: string
        slug: string
        status: string
        sanity_document_id: string | null
        updated_at: string
      }
    | {
        id: string
        name: string
        slug: string
        status: string
        sanity_document_id: string | null
        updated_at: string
      }[]
    | null
}

function getBandFromMembership(row: MembershipRow) {
  return Array.isArray(row.bands) ? row.bands[0] : row.bands
}

function mapMemberships(rows: MembershipRow[]): DashboardBandSummary[] {
  return rows
    .map((membership) => {
      const band = getBandFromMembership(membership)
      if (!band) {
        return null
      }

      return {
        role: membership.role,
        band: band as DashboardBandSummary['band'],
        publicBandHref: isBandPublic(band.status) ? `/bandas/${band.slug}` : null,
      } satisfies DashboardBandSummary
    })
    .filter((membership): membership is DashboardBandSummary => membership !== null)
}

export async function getDashboardBands(userId: string, userEmail?: string | null): Promise<DashboardBandsData> {
  const supabase = await createClient()
  const {data, error} = await supabase
    .from('band_memberships')
    .select('role, bands(id, name, slug, status, sanity_document_id, updated_at)')
    .eq('user_id', userId)
    .order('created_at', {ascending: true})

  const memberships = mapMemberships((data || []) as MembershipRow[])
  let pendingInvites: BandInviteSummary[] = []

  if (userEmail) {
    try {
      const admin = createAdminClient()
      const normalizedEmail = normalizeInviteEmail(userEmail)
      const {data: inviteRows} = await admin
        .from('band_invites')
        .select('id, band_id, email, role, token, expires_at, accepted_at, created_at')
        .eq('email', normalizedEmail)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', {ascending: false})

      const rawInvites = (inviteRows || []) as Array<{
        id: string
        band_id: string
        email: string
        role: BandInviteSummary['role']
        token: string
        expires_at: string
        accepted_at: string | null
        created_at: string
      }>

      if (rawInvites.length > 0) {
        const bandIds = Array.from(new Set(rawInvites.map((invite) => invite.band_id)))
        const {data: bandRows} = await admin.from('bands').select('id, name, slug, status').in('id', bandIds)

        const bandMap = new Map(
          ((bandRows || []) as Array<Pick<SupabaseBand, 'id' | 'name' | 'slug' | 'status'>>).map((band) => [
            band.id,
            band,
          ])
        )

        pendingInvites = rawInvites.map((invite) => ({
          id: invite.id,
          bandId: invite.band_id,
          email: invite.email,
          role: invite.role,
          token: invite.token,
          expiresAt: invite.expires_at,
          acceptedAt: invite.accepted_at,
          createdAt: invite.created_at,
          band: bandMap.get(invite.band_id),
        }))
      }
    } catch {
      pendingInvites = []
    }
  }

  return {
    memberships,
    pendingInvites,
    loadError: Boolean(error),
  }
}
