'use client'

import {useEffect, type ReactNode} from 'react'
import {createPortal} from 'react-dom'

import {CloseIcon} from './DemoIcons'

export function ResponsiveTrackOptionsDialog({
  title,
  eyebrow,
  onClose,
  children,
}: {
  title: string
  eyebrow: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return createPortal(
    <div className="demos-sheet demos-sheet--dialog" role="dialog" aria-modal="true" aria-label={`Opciones de ${title}`}>
      <button className="demos-sheet__backdrop" type="button" aria-label="Cerrar opciones" onClick={onClose} />
      <div className="demos-sheet__panel demos-sheet__panel--dialog">
        <div className="demos-sheet__header">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
          </div>
          <button className="demos-sheet__close" type="button" aria-label="Cerrar opciones" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}
