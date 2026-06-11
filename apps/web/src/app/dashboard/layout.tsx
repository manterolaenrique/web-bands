import type {ReactNode} from 'react'

import {DashboardShell} from '@/components/dashboard/DashboardShell'
import {getCurrentUserSummary} from '@/lib/auth/user-summary'
import {isSupabaseConfigured} from '@/lib/env'
import {requireUser} from '@/lib/auth/session'
import {getDashboardBands} from '@/server/bands/dashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({children}: {children: ReactNode}) {
  let initialEditorHref: string | null = null
  let currentUser = null

  if (isSupabaseConfigured()) {
    const user = await requireUser()
    const [dashboardData, userSummary] = await Promise.all([
      getDashboardBands(user.id, user.email).catch(() => null),
      getCurrentUserSummary().catch(() => null),
    ])
    const firstBandId = dashboardData?.memberships[0]?.band.id

    initialEditorHref = firstBandId ? `/dashboard/bands/${firstBandId}` : null
    currentUser = userSummary
  }

  return (
    <DashboardShell initialEditorHref={initialEditorHref} currentUser={currentUser}>
      {children}
    </DashboardShell>
  )
}
