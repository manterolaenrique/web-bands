'use client'

import {useEffect, useState} from 'react'

import type {DashboardFlash} from '@/lib/dashboard/messages'

export function DashboardFlashToast({flash}: {flash: DashboardFlash | null}) {
  const [dismissedFlash, setDismissedFlash] = useState<DashboardFlash | null>(null)

  useEffect(() => {
    if (!flash) {
      return
    }

    const timeout = window.setTimeout(() => {
      setDismissedFlash(flash)
    }, 4200)

    return () => window.clearTimeout(timeout)
  }, [flash])

  if (!flash || dismissedFlash === flash) {
    return null
  }

  return (
    <div className="editor-toast-stack editor-toast-stack--page" aria-live="polite" aria-atomic="true">
      <div className={`editor-toast editor-toast--${flash.tone}`} role="status">
        <span>{flash.message}</span>
        <button
          className="editor-toast__close"
          type="button"
          onClick={() => {
            setDismissedFlash(flash)
          }}
          aria-label="Cerrar notificacion"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
