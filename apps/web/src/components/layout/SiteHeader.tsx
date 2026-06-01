import {getRoleLabel} from '@/lib/bands/members'
import {isSupabaseConfigured} from '@/lib/env'
import {createClient} from '@/lib/supabase/server'
import type {BandMemberRole} from '@/types/band'

import {SiteHeaderNav} from './SiteHeaderNav'

type HeaderUser = {
  displayName: string
  email: string | null
  roleLabel: string
}

const ROLE_PRIORITY: BandMemberRole[] = ['owner', 'admin', 'editor', 'viewer']

function getFallbackDisplayName(email: string | null | undefined) {
  if (!email) {
    return 'Mi cuenta'
  }

  return email.split('@')[0] || 'Mi cuenta'
}

function getHighestRole(roles: Array<string | null | undefined>) {
  return ROLE_PRIORITY.find((role) => roles.includes(role))
}

async function getHeaderUser() {
  if (!isSupabaseConfigured()) {
    return null
  }

  const supabase = await createClient()
  const {
    data: {user},
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const [{data: profile}, {data: memberships}] = await Promise.all([
    supabase.from('profiles').select('display_name, email').eq('id', user.id).maybeSingle(),
    supabase.from('band_memberships').select('role').eq('user_id', user.id),
  ])

  const highestRole = getHighestRole((memberships || []).map((membership) => membership.role))
  const displayName =
    profile?.display_name ||
    (typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name : null) ||
    (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null) ||
    getFallbackDisplayName(user.email)

  const headerUser: HeaderUser = {
    displayName,
    email: profile?.email || user.email || null,
    roleLabel: highestRole ? getRoleLabel(highestRole) : 'Usuario',
  }

  return headerUser
}

export async function SiteHeader() {
  const user = await getHeaderUser()

  return <SiteHeaderNav user={user} />
}
