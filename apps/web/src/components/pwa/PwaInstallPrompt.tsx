'use client'

import {useEffect, useMemo, useState} from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

type PwaInstallPromptProps = {
  className?: string
  variant?: 'chip' | 'card'
}

function isStandaloneDisplay() {
  if (typeof window === 'undefined') {
    return false
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as Navigator & {standalone?: boolean}).standalone)
  )
}

function isIosBrowser() {
  if (typeof navigator === 'undefined') {
    return false
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function PwaInstallPrompt({
  className = '',
  variant = 'chip',
}: PwaInstallPromptProps) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [hasPromptSupport, setHasPromptSupport] = useState(false)

  useEffect(() => {
    const syncInstalledState = () => {
      setIsInstalled(isStandaloneDisplay())
    }

    syncInstalledState()

    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleDisplayModeChange = () => syncInstalledState()
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
      setHasPromptSupport(true)
    }
    const handleInstalled = () => {
      setIsInstalled(true)
      setInstallEvent(null)
    }

    mediaQuery.addEventListener('change', handleDisplayModeChange)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const installState = useMemo(() => {
    if (isInstalled) {
      return 'installed' as const
    }

    if (installEvent) {
      return 'installable' as const
    }

    if (isIosBrowser()) {
      return 'ios-hint' as const
    }

    return hasPromptSupport ? ('browser' as const) : ('hidden' as const)
  }, [hasPromptSupport, installEvent, isInstalled])

  async function handleInstallClick() {
    if (!installEvent) {
      return
    }

    await installEvent.prompt()
    const result = await installEvent.userChoice

    if (result.outcome === 'accepted') {
      setIsInstalled(true)
    }

    setInstallEvent(null)
  }

  if (installState === 'hidden') {
    return null
  }

  if (variant === 'card') {
    if (installState === 'installed') {
      return (
        <div className={`app-install-card app-install-card--installed ${className}`.trim()}>
          <strong>App lista</strong>
          <p>Ya podes abrir Web Bands desde la pantalla de inicio como una app privada.</p>
        </div>
      )
    }

    if (installState === 'installable') {
      return (
        <div className={`app-install-card ${className}`.trim()}>
          <div>
            <strong>Instala la app</strong>
            <p>Guardala en tu inicio para abrir dashboard y editor con una experiencia de celular.</p>
          </div>
          <button className="button button--primary" type="button" onClick={handleInstallClick}>
            Instalar app
          </button>
        </div>
      )
    }

    if (installState === 'ios-hint') {
      return (
        <div className={`app-install-card app-install-card--hint ${className}`.trim()}>
          <strong>Agregar al inicio</strong>
          <p>En iPhone o iPad usa Compartir y despues “Agregar a pantalla de inicio”.</p>
        </div>
      )
    }

    return null
  }

  if (installState === 'installed') {
    return <span className={`app-install-chip app-install-chip--installed ${className}`.trim()}>Modo app activo</span>
  }

  if (installState === 'installable') {
    return (
      <button
        className={`app-install-chip app-install-chip--action ${className}`.trim()}
        type="button"
        onClick={handleInstallClick}
      >
        Instalar app
      </button>
    )
  }

  if (installState === 'ios-hint') {
    return <span className={`app-install-chip ${className}`.trim()}>Agregar al inicio</span>
  }

  return null
}
