import {getCurrentUserSummary} from '@/lib/auth/user-summary'

import {SiteHeaderNav} from './SiteHeaderNav'

export async function SiteHeader() {
  const user = await getCurrentUserSummary()

  return <SiteHeaderNav user={user} />
}
