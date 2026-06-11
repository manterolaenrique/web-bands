import {DashboardAccountScreen} from '@/components/dashboard/DashboardAccountScreen'
import {getCurrentUserSummary} from '@/lib/auth/user-summary'

export default async function DashboardAccountPage() {
  const currentUser = await getCurrentUserSummary().catch(() => null)

  return <DashboardAccountScreen currentUser={currentUser} />
}
