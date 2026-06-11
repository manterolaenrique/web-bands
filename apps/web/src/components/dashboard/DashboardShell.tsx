'use client'

import {usePathname} from 'next/navigation'
import type {ReactNode} from 'react'

import {DashboardNav} from '@/components/dashboard/DashboardNav'
import {DashboardAudioProvider, useDashboardAudio} from '@/components/demos/DashboardAudioProvider'
import {MiniPlayer} from '@/components/demos/MiniPlayer'
import type {CurrentUserSummary} from '@/lib/auth/user-summary'

function isEditBandRoute(pathname: string) {
  return /^\/dashboard\/bands\/[^/]+(?:\/.*)?$/.test(pathname)
}

export function DashboardShell({
  children,
  initialEditorHref,
  currentUser,
}: {
  children: ReactNode
  initialEditorHref?: string | null
  currentUser?: CurrentUserSummary | null
}) {
  return (
    <DashboardAudioProvider>
      <DashboardShellFrame initialEditorHref={initialEditorHref} currentUser={currentUser}>
        {children}
      </DashboardShellFrame>
    </DashboardAudioProvider>
  )
}

function DashboardShellFrame({
  children,
  initialEditorHref,
  currentUser,
}: {
  children: ReactNode
  initialEditorHref?: string | null
  currentUser?: CurrentUserSummary | null
}) {
  const pathname = usePathname()
  const {currentTrack} = useDashboardAudio()
  const compactEditingLayout = isEditBandRoute(pathname)

  return (
    <main
      className={`container dashboard-layout${compactEditingLayout ? ' dashboard-layout--editor' : ''}${
        currentTrack ? ' dashboard-layout--has-player' : ''
      }`}
      data-dashboard-layout={compactEditingLayout ? 'editor' : 'default'}
    >
      <DashboardNav initialEditorHref={initialEditorHref} currentUser={currentUser} />
      <section className="dashboard-content">{children}</section>
      <MiniPlayer />
    </main>
  )
}
