import type {ReactNode} from 'react'

import {DashboardNav} from '@/components/dashboard/DashboardNav'
import {isSupabaseConfigured} from '@/lib/env'
import {requireUser} from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({children}: {children: ReactNode}) {
  if (isSupabaseConfigured()) {
    await requireUser()
  }

  return (
    <main className="container dashboard-layout">
      <DashboardNav />
      <section>{children}</section>
    </main>
  )
}
