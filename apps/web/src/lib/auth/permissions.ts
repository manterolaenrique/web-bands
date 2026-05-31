import type {BandMemberRole} from '@/types/band'

const EDIT_ROLES: BandMemberRole[] = ['owner', 'admin', 'editor']
const MANAGE_ROLES: BandMemberRole[] = ['owner', 'admin']

export function canEditBand(role: string | null | undefined) {
  return EDIT_ROLES.includes(role as BandMemberRole)
}

export function canManageBand(role: string | null | undefined) {
  return MANAGE_ROLES.includes(role as BandMemberRole)
}

export async function getMembershipRole(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  bandId: string,
  userId: string
) {
  const {data, error} = await supabase
    .from('band_memberships')
    .select('role')
    .eq('band_id', bandId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data?.role as BandMemberRole | undefined
}
