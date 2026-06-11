'use client'

import {usePathname} from 'next/navigation'
import {useEffect} from 'react'

const isProduction = process.env.NODE_ENV === 'production'
const PWA_CACHE_PREFIX = 'web-bands-app-'

function resolveRouteKind(pathname: string) {
  if (pathname === '/login' || pathname.startsWith('/dashboard')) {
    return 'app-private'
  }

  return 'site'
}

function resolveRouteSurface(pathname: string) {
  if (pathname === '/') {
    return 'public-home'
  }

  if (pathname.startsWith('/bandas/') || pathname.startsWith('/banda/')) {
    return 'public-band'
  }

  if (pathname === '/login') {
    return 'login'
  }

  if (/^\/dashboard\/bands\/[^/]+(?:\/.*)?$/.test(pathname)) {
    return 'dashboard-editor'
  }

  if (pathname.startsWith('/dashboard')) {
    return 'dashboard'
  }

  return 'site'
}

export function AppRuntimeBridge() {
  const pathname = usePathname()

  useEffect(() => {
    document.body.dataset.routeKind = resolveRouteKind(pathname)
    document.body.dataset.routeSurface = resolveRouteSurface(pathname)

    return () => {
      delete document.body.dataset.routeKind
      delete document.body.dataset.routeSurface
    }
  }, [pathname])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return
    }

    async function cleanupWorkerInDev() {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))

      if ('caches' in window) {
        const cacheKeys = await window.caches.keys()
        await Promise.all(
          cacheKeys
            .filter((key) => key.startsWith(PWA_CACHE_PREFIX))
            .map((key) => window.caches.delete(key))
        )
      }
    }

    async function registerWorker() {
      try {
        if (!isProduction) {
          await cleanupWorkerInDev()
          return
        }

        await navigator.serviceWorker.register('/sw.js', {scope: '/'})
      } catch {
        // Installability is progressive. Ignore registration failures in unsupported browsers.
      }
    }

    if (document.readyState === 'complete') {
      void registerWorker()
      return
    }

    const handleLoad = () => {
      void registerWorker()
    }

    window.addEventListener('load', handleLoad, {once: true})
    return () => window.removeEventListener('load', handleLoad)
  }, [])

  return null
}
