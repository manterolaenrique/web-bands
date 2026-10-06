'use client'

import {useRouter} from 'next/navigation'
import {useTransition} from 'react'

import {useDashboardNavigationProgress} from '@/components/dashboard/dashboard-navigation-context'

type NavigationOptions = {
  scroll?: boolean
}

export function usePendingNavigation() {
  const router = useRouter()
  const dashboardNavigation = useDashboardNavigationProgress()
  const [isPending, startTransition] = useTransition()

  const push = (href: string, options?: NavigationOptions, pendingLabel?: string) => {
    dashboardNavigation?.beginNavigation(pendingLabel, href)
    startTransition(() => {
      router.push(href, options)
    })
  }

  const replace = (href: string, options?: NavigationOptions, pendingLabel?: string) => {
    dashboardNavigation?.beginNavigation(pendingLabel, href)
    startTransition(() => {
      router.replace(href, options)
    })
  }

  const refresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  return {
    isPending,
    push,
    replace,
    refresh,
    startNavigation: startTransition,
  }
}
