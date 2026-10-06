'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import {usePathname, useSearchParams} from 'next/navigation'

import {markClientMetric, recordMeasuredClientMetric} from '@/lib/performance/client-metrics'

const DEFAULT_PENDING_LABEL = 'Abriendo...'
const MIN_PENDING_VISIBLE_MS = 220
const MAX_PENDING_VISIBLE_MS = 8000

type DashboardNavigationContextValue = {
  isPending: boolean
  pendingLabel: string
  beginNavigation: (label?: string, href?: string) => void
  endNavigation: () => void
}

type PendingNavigationMetric = {
  href: string | null
  label: string
  fromRoute: string
}

const DashboardNavigationContext = createContext<DashboardNavigationContextValue | null>(null)

function clearTimer(timerRef: MutableRefObject<number | null>) {
  if (timerRef.current !== null) {
    window.clearTimeout(timerRef.current)
    timerRef.current = null
  }
}

export function DashboardNavigationProvider({children}: {children: ReactNode}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routeKey = `${pathname}?${searchParams.toString()}`
  const lastRouteKeyRef = useRef(routeKey)
  const startedAtRef = useRef(0)
  const metricRef = useRef<PendingNavigationMetric | null>(null)
  const settleTimerRef = useRef<number | null>(null)
  const watchdogTimerRef = useRef<number | null>(null)
  const [state, setState] = useState({
    isPending: false,
    pendingLabel: DEFAULT_PENDING_LABEL,
  })

  const endNavigation = (targetRoute?: string) => {
    clearTimer(watchdogTimerRef)

    if (startedAtRef.current > 0) {
      recordMeasuredClientMetric('dashboard_navigation_complete', startedAtRef.current, {
        context: {
          from: metricRef.current?.fromRoute || lastRouteKeyRef.current,
          to: targetRoute || routeKey,
          href: metricRef.current?.href,
          label: metricRef.current?.label || state.pendingLabel,
        },
      })
    }

    metricRef.current = null

    const elapsed = Math.max(0, markClientMetric() - startedAtRef.current)
    const remaining = Math.max(0, MIN_PENDING_VISIBLE_MS - elapsed)

    clearTimer(settleTimerRef)
    settleTimerRef.current = window.setTimeout(() => {
      setState({
        isPending: false,
        pendingLabel: DEFAULT_PENDING_LABEL,
      })
      settleTimerRef.current = null
    }, remaining)
  }

  const beginNavigation = (label = DEFAULT_PENDING_LABEL, href?: string) => {
    clearTimer(settleTimerRef)
    clearTimer(watchdogTimerRef)
    startedAtRef.current = markClientMetric()
    metricRef.current = {
      href: href || null,
      label,
      fromRoute: routeKey,
    }
    setState({
      isPending: true,
      pendingLabel: label,
    })
    watchdogTimerRef.current = window.setTimeout(() => {
      if (startedAtRef.current > 0) {
        recordMeasuredClientMetric('dashboard_navigation_timeout', startedAtRef.current, {
          context: {
            from: metricRef.current?.fromRoute || routeKey,
            href: metricRef.current?.href,
            label: metricRef.current?.label || label,
          },
        })
      }

      metricRef.current = null
      setState({
        isPending: false,
        pendingLabel: DEFAULT_PENDING_LABEL,
      })
      watchdogTimerRef.current = null
    }, MAX_PENDING_VISIBLE_MS)
  }

  useEffect(() => {
    if (lastRouteKeyRef.current === routeKey) {
      return
    }

    endNavigation(routeKey)
    lastRouteKeyRef.current = routeKey
  }, [routeKey])

  useEffect(() => {
    return () => {
      clearTimer(settleTimerRef)
      clearTimer(watchdogTimerRef)
    }
  }, [])

  return (
    <DashboardNavigationContext.Provider
      value={{
        isPending: state.isPending,
        pendingLabel: state.pendingLabel,
        beginNavigation,
        endNavigation,
      }}
    >
      {children}
    </DashboardNavigationContext.Provider>
  )
}

export function useDashboardNavigationProgress() {
  return useContext(DashboardNavigationContext)
}

export function DashboardNavigationFeedback() {
  const navigation = useDashboardNavigationProgress()

  if (!navigation) {
    return null
  }

  return (
    <div
      className={`dashboard-navigation-feedback${
        navigation.isPending ? ' dashboard-navigation-feedback--visible' : ''
      }`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-hidden={!navigation.isPending}
    >
      <div className="dashboard-navigation-feedback__bar" aria-hidden="true">
        <span />
      </div>
      <span className="dashboard-navigation-feedback__label">{navigation.pendingLabel}</span>
    </div>
  )
}
