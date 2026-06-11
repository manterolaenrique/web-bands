'use client'

import {usePathname, useRouter} from 'next/navigation'
import {useState, useTransition, type FormEvent} from 'react'

import type {BandAudioTrackDetail} from '@web-bands/bands-domain'
import {BAND_AUDIO_TRACK_STATUSES, BAND_AUDIO_TRACK_TYPES} from '@web-bands/bands-domain'

import {updateDemoTrackRequest, type DemoApiValidationIssue} from '@/lib/dashboard/demos-api'
import {getTrackStatusLabel, getTrackTypeLabel} from '@/lib/demos/format'

import {CloseIcon} from './DemoIcons'

function getFieldError(errors: DemoApiValidationIssue[], field: string) {
  return errors.find((issue) => issue.path === field)?.message || null
}

export function TrackEditSheet({
  bandId,
  track,
  initialOpen = false,
}: {
  bandId: string
  track: BandAudioTrackDetail
  initialOpen?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [title, setTitle] = useState(track.title)
  const [description, setDescription] = useState(track.description || '')
  const [relatedSongTitle, setRelatedSongTitle] = useState(track.relatedSongTitle || '')
  const [trackType, setTrackType] = useState(track.trackType)
  const [trackStatus, setTrackStatus] = useState(track.trackStatus)
  const [isDownloadable, setIsDownloadable] = useState(track.isDownloadable)
  const [error, setError] = useState<string | null>(null)
  const [issues, setIssues] = useState<DemoApiValidationIssue[]>([])
  const [isPending, startTransition] = useTransition()

  const handleClose = () => {
    setIsOpen(false)

    if (initialOpen) {
      router.replace(pathname, {scroll: false})
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIssues([])

    startTransition(async () => {
      const response = await updateDemoTrackRequest(bandId, track.id, {
        title,
        description,
        relatedSongTitle,
        trackType,
        trackStatus,
        isDownloadable,
        durationSeconds: track.durationSeconds,
      })

      if (!response.ok) {
        setError(response.body?.message || 'No se pudo guardar el demo.')
        setIssues(response.body?.errors || [])
        return
      }

      handleClose()
      router.refresh()
    })
  }

  return (
    <>
      <button className="button" type="button" onClick={() => setIsOpen(true)}>
        Editar informacion
      </button>

      {isOpen ? (
        <div className="demos-sheet" role="dialog" aria-modal="true" aria-label="Editar demo">
          <button className="demos-sheet__backdrop" type="button" onClick={handleClose} />
          <div className="demos-sheet__panel">
            <div className="demos-sheet__handle" aria-hidden="true" />
            <div className="demos-sheet__header" id="metadata-editor">
              <div>
                <p className="eyebrow">Demo privado</p>
                <h2>Editar informacion</h2>
              </div>
              <button className="demos-sheet__close" type="button" onClick={handleClose}>
                <CloseIcon />
              </button>
            </div>

            <form className="demos-form-sheet" onSubmit={handleSubmit}>
              <label className="form-field">
                <span className="form-label">Titulo</span>
                <input className="form-input" value={title} onChange={(event) => setTitle(event.currentTarget.value)} />
                {getFieldError(issues, 'title') ? <span className="field-error">{getFieldError(issues, 'title')}</span> : null}
              </label>

              <label className="form-field">
                <span className="form-label">Descripcion</span>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.currentTarget.value)}
                />
                {getFieldError(issues, 'description') ? (
                  <span className="field-error">{getFieldError(issues, 'description')}</span>
                ) : null}
              </label>

              <label className="form-field">
                <span className="form-label">Cancion relacionada</span>
                <input
                  className="form-input"
                  value={relatedSongTitle}
                  onChange={(event) => setRelatedSongTitle(event.currentTarget.value)}
                />
              </label>

              <div className="demos-upload-form__grid">
                <label className="form-field">
                  <span className="form-label">Tipo</span>
                  <select
                    className="form-select"
                    value={trackType}
                    onChange={(event) => setTrackType(event.currentTarget.value as typeof trackType)}
                  >
                    {BAND_AUDIO_TRACK_TYPES.map((value) => (
                      <option key={value} value={value}>
                        {getTrackTypeLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span className="form-label">Estado</span>
                  <select
                    className="form-select"
                    value={trackStatus}
                    onChange={(event) => setTrackStatus(event.currentTarget.value as typeof trackStatus)}
                  >
                    {BAND_AUDIO_TRACK_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {getTrackStatusLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="demos-upload-form__toggle">
                <div>
                  <strong>Permitir descarga</strong>
                  <span>Disponible para integrantes con permiso.</span>
                </div>
                <input
                  type="checkbox"
                  checked={isDownloadable}
                  onChange={(event) => setIsDownloadable(event.currentTarget.checked)}
                />
              </label>

              {error ? <div className="status status--error">{error}</div> : null}

              <div className="demos-form-sheet__actions">
                <button className="button" type="button" onClick={handleClose} disabled={isPending}>
                  Cancelar
                </button>
                <button className="button button--primary" type="submit" disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
