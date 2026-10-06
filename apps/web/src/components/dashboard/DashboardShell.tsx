'use client'

import {usePathname} from 'next/navigation'
import {useEffect, type ReactNode} from 'react'

import {
  DashboardNavigationFeedback,
  DashboardNavigationProvider,
} from '@/components/dashboard/dashboard-navigation-context'
import {DashboardNav} from '@/components/dashboard/DashboardNav'
import {DashboardAudioProvider, useDashboardAudioHasCurrentTrack} from '@/components/demos/DashboardAudioProvider'
import {MiniPlayer} from '@/components/demos/MiniPlayer'
import type {CurrentUserSummary} from '@/lib/auth/user-summary'

import {LAST_EDITOR_HREF_STORAGE_KEY} from './editor-navigation-state'

function isEditBandRoute(pathname: string) {
  return /^\/dashboard\/bands\/[^/]+(?:\/.*)?$/.test(pathname)
}

export function DashboardShell({
  children,
  currentUser,
}: {
  children: ReactNode
  currentUser?: CurrentUserSummary | null
}) {
  return (
    <DashboardAudioProvider>
      <DashboardNavigationProvider>
        <DashboardShellFrame currentUser={currentUser}>{children}</DashboardShellFrame>
      </DashboardNavigationProvider>
    </DashboardAudioProvider>
  )
}

function DashboardShellFrame({
  children,
  currentUser,
}: {
  children: ReactNode
  currentUser?: CurrentUserSummary | null
}) {
  const pathname = usePathname()
  const hasCurrentTrack = useDashboardAudioHasCurrentTrack()
  const compactEditingLayout = isEditBandRoute(pathname)

  useEffect(() => {
    if (!compactEditingLayout) {
      return
    }

    window.sessionStorage.setItem(LAST_EDITOR_HREF_STORAGE_KEY, pathname)
  }, [compactEditingLayout, pathname])

  return (
    <main
      className={`container dashboard-layout${compactEditingLayout ? ' dashboard-layout--editor' : ''}${
        hasCurrentTrack ? ' dashboard-layout--has-player' : ''
      }`}
      data-dashboard-layout={compactEditingLayout ? 'editor' : 'default'}
    >
      <DashboardNavigationFeedback />
      <DashboardNav currentUser={currentUser} />
      <section className="dashboard-content">{children}</section>
      <MiniPlayer />
    </main>
  )
}
