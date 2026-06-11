'use client'

import {useEffect, type ReactNode} from 'react'
import {createPortal} from 'react-dom'

import {PublicBandView} from '@/components/bands/PublicBandView'
import {createPublicBandDraft} from '@/lib/bands/preview'
import type {BandEditorValues} from '@/lib/bands/editor'
import type {PublicBand} from '@/types/band'

type PreviewViewport = 'desktop' | 'mobile'
type EditorMode = 'public' | 'kit'

function PreviewViewportFrame({
  viewport,
  children,
}: {
  viewport: PreviewViewport
  children: ReactNode
}) {
  if (viewport === 'mobile') {
    return (
      <div className="editor-preview-device editor-preview-device--phone">
        <div className="editor-preview-device__phone-top" aria-hidden="true">
          <span />
        </div>
        <div className="editor-preview-device__screen">{children}</div>
      </div>
    )
  }

  return (
    <div className="editor-preview-device editor-preview-device--browser">
      <div className="editor-preview-device__browser-top" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="editor-preview-device__screen">{children}</div>
    </div>
  )
}

export function BandEditorPreview({
  values,
  baseBand,
  mode,
  viewport,
  onViewportChange,
  inline = false,
  isOpen = false,
  onOpenChange,
}: {
  values: BandEditorValues
  baseBand?: PublicBand | null
  mode: EditorMode
  viewport: PreviewViewport
  onViewportChange: (viewport: PreviewViewport) => void
  inline?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  if (mode === 'kit') {
    if (!inline) {
      return null
    }

    return (
      <aside className="dashboard-card editor-preview-panel editor-preview-panel--kit">
        <div className="editor-preview-panel__header">
          <div>
            <p className="eyebrow">Kit interno</p>
            <h2 className="editor-preview-panel__title">Sin vista publica</h2>
          </div>
        </div>
        <div className="editor-preview-panel__empty">
          <p className="lead">Este bloque es privado para la banda y no se publica en la web.</p>
          <p className="muted">
            Usa este espacio para ordenar resumen, contacto y links utiles como demos, press o carpetas de trabajo.
          </p>
        </div>
      </aside>
    )
  }

  const draftBand = createPublicBandDraft(values, baseBand)

  return (
    <>
      {inline ? (
        <aside className="dashboard-card editor-preview-panel">
          <div className="editor-preview-panel__header">
            <div>
              <p className="eyebrow">Vista previa en vivo</p>
              <h2 className="editor-preview-panel__title">Pagina publica</h2>
              <p className="muted">Este draft refleja el estado actual del formulario antes de guardar.</p>
            </div>
            <div className="editor-preview-panel__controls">
              <div className="editor-preview-panel__viewport-switch" role="tablist" aria-label="Viewport del preview">
                <button
                  className={`button${viewport === 'desktop' ? ' button--primary' : ''}`}
                  type="button"
                  onClick={() => {
                    onViewportChange('desktop')
                  }}
                >
                  Desktop
                </button>
                <button
                  className={`button${viewport === 'mobile' ? ' button--primary' : ''}`}
                  type="button"
                  onClick={() => {
                    onViewportChange('mobile')
                  }}
                >
                  Mobile
                </button>
              </div>
              {onOpenChange ? (
                <button className="button editor-preview-panel__expand" type="button" onClick={() => onOpenChange(true)}>
                  Pantalla completa
                </button>
              ) : null}
            </div>
          </div>

          <div className="editor-preview-inline-frame">
            <PreviewViewportFrame viewport={viewport}>
              <PublicBandView band={draftBand} previewMode />
            </PreviewViewportFrame>
          </div>
        </aside>
      ) : null}

      {isOpen && typeof document !== 'undefined'
        ? createPortal(
            <div className="editor-preview-overlay" role="dialog" aria-modal="true" aria-label="Vista previa de la pagina publica">
              <div className="editor-preview-modal">
                <div className="editor-preview-modal__header">
                  <div>
                    <p className="eyebrow">Vista previa</p>
                    <h2 className="editor-preview-modal__title">Pagina publica</h2>
                    <p className="muted">Revisa el resultado antes de publicar sin ocupar espacio fijo del editor.</p>
                  </div>
                  <div className="editor-preview-modal__actions">
                    <div className="editor-preview-panel__viewport-switch" role="tablist" aria-label="Viewport del preview">
                      <button
                        className={`button${viewport === 'desktop' ? ' button--primary' : ''}`}
                        type="button"
                        onClick={() => {
                          onViewportChange('desktop')
                        }}
                      >
                        Desktop
                      </button>
                      <button
                        className={`button${viewport === 'mobile' ? ' button--primary' : ''}`}
                        type="button"
                        onClick={() => {
                          onViewportChange('mobile')
                        }}
                      >
                        Mobile
                      </button>
                    </div>
                    <button
                      className="button"
                      type="button"
                      onClick={() => {
                        onOpenChange?.(false)
                      }}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>

                <div className={`editor-preview-modal__stage editor-preview-modal__stage--${viewport}`}>
                  <PreviewViewportFrame viewport={viewport}>
                    <PublicBandView band={draftBand} previewMode />
                  </PreviewViewportFrame>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  )
}
