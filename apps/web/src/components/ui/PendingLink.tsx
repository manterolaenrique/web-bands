'use client'

import Link, {type LinkProps} from 'next/link'
import {useRouter} from 'next/navigation'
import {forwardRef, useRef, type AnchorHTMLAttributes, type MouseEvent} from 'react'

import {useDashboardNavigationProgress} from '@/components/dashboard/dashboard-navigation-context'

type PendingLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    pendingLabel?: string
  }

function shouldTrackNavigation(event: MouseEvent<HTMLAnchorElement>, target?: string) {
  if (event.defaultPrevented || event.button !== 0) {
    return false
  }

  if (target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false
  }

  return true
}

function resolvePrefetchHref(href: PendingLinkProps['href']) {
  if (typeof href === 'string') {
    return href
  }

  if ('pathname' in href && typeof href.pathname === 'string') {
    const params = new URLSearchParams()

    if (href.query) {
      for (const [key, value] of Object.entries(href.query)) {
        if (Array.isArray(value)) {
          value.forEach((entry) => {
            if (typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean') {
              params.append(key, String(entry))
            }
          })
        } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          params.set(key, String(value))
        }
      }
    }

    const query = params.toString()
    return query ? `${href.pathname}?${query}` : href.pathname
  }

  return null
}

export const PendingLink = forwardRef<HTMLAnchorElement, PendingLinkProps>(function PendingLink(
  {pendingLabel, onClick, target, ...props},
  ref
) {
  const navigation = useDashboardNavigationProgress()
  const router = useRouter()
  const hasPrefetchedRef = useRef(false)
  const prefetchHref = resolvePrefetchHref(props.href)

  const prefetch = () => {
    if (!prefetchHref || hasPrefetchedRef.current || target === '_blank') {
      return
    }

    hasPrefetchedRef.current = true
    router.prefetch(prefetchHref)
  }

  return (
    <Link
      {...props}
      ref={ref}
      target={target}
      onMouseEnter={(event) => {
        props.onMouseEnter?.(event)
        prefetch()
      }}
      onFocus={(event) => {
        props.onFocus?.(event)
        prefetch()
      }}
      onTouchStart={(event) => {
        props.onTouchStart?.(event)
        prefetch()
      }}
      onClick={(event) => {
        onClick?.(event)

        if (navigation && shouldTrackNavigation(event, target)) {
          navigation.beginNavigation(pendingLabel, prefetchHref || undefined)
        }
      }}
    />
  )
})
