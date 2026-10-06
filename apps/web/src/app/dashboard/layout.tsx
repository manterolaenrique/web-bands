import type {ReactNode} from 'react'

import {DashboardShell} from '@/components/dashboard/DashboardShell'
import {getCurrentUserSummary} from '@/lib/auth/user-summary'
import {isSupabaseConfigured} from '@/lib/env'
import {requireUser} from '@/lib/auth/session'

export default async function DashboardLayout({children}: {children: ReactNode}) {
  let currentUser = null

  if (isSupabaseConfigured()) {
    await requireUser()
    currentUser = await getCurrentUserSummary().catch(() => null)
  }

  return <DashboardShell currentUser={currentUser}>{children}</DashboardShell>
}
