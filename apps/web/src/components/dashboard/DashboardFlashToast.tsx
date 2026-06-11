'use client'

import {useEffect, useState} from 'react'

import type {DashboardFlash} from '@/lib/dashboard/messages'

export function DashboardFlashToast({flash}: {flash: DashboardFlash | null}) {
  const [visible, setVisible] = useState(Boolean(flash))

  useEffect(() => {
    if (!flash) {
      setVisible(false)
      return
    }

    setVisible(true)
    const timeout = window.setTimeout(() => {
      setVisible(false)
    }, 4200)

    return () => window.clearTimeout(timeout)
  }, [flash])

  if (!flash || !visible) {
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
            setVisible(false)
          }}
          aria-label="Cerrar notificacion"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
