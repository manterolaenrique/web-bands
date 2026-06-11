'use client'

import {useEffect, useState, useTransition, type FormEvent} from 'react'
import {useRouter} from 'next/navigation'

import {
  createPlaylistRequest,
  updatePlaylistRequest,
  type DemoApiValidationIssue,
} from '@/lib/dashboard/demos-api'

import {CloseIcon, PlaylistIcon} from './DemoIcons'

function getFieldError(errors: DemoApiValidationIssue[], field: string) {
  return errors.find((issue) => issue.path === field)?.message || null
}

export function PlaylistFormSheet({
  bandId,
  title = 'Nueva playlist',
  triggerLabel,
  playlistId,
  initialTitle = '',
  initialDescription = '',
  initialCoverUrl = '',
}: {
  bandId: string
  title?: string
  triggerLabel: string
  playlistId?: string
  initialTitle?: string
  initialDescription?: string
  initialCoverUrl?: string
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [formTitle, setFormTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('')
  const [removeCover, setRemoveCover] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [issues, setIssues] = useState<DemoApiValidationIssue[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl('')
      return
    }

    const objectUrl = URL.createObjectURL(coverFile)
    setCoverPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [coverFile])

  const resetForm = () => {
    setFormTitle(initialTitle)
    setDescription(initialDescription)
    setCoverFile(null)
    setRemoveCover(false)
    setError(null)
    setIssues([])
  }

  const open = () => {
    resetForm()
    setIsOpen(true)
  }

  const close = () => {
    if (isPending) {
      return
    }

    setIsOpen(false)
    resetForm()
  }

  const visibleCoverUrl = coverPreviewUrl || (!removeCover ? initialCoverUrl : '')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIssues([])

    startTransition(async () => {
      const formData = new FormData()
      formData.set('title', formTitle)
      formData.set('description', description)
      formData.set('coverAction', removeCover ? 'remove' : 'keep')

      if (coverFile) {
        formData.set('coverFile', coverFile)
      }

      const response = playlistId
        ? await updatePlaylistRequest(bandId, playlistId, formData)
        : await createPlaylistRequest(bandId, formData)

      if (!response.ok) {
        setError(response.body?.message || 'No se pudo guardar la playlist.')
        setIssues(response.body?.errors || [])
        return
      }

      close()
      router.refresh()
    })
  }

  return (
    <>
      <button className="button button--primary" type="button" onClick={open}>
        {triggerLabel}
      </button>

      {isOpen ? (
        <div className="demos-sheet" role="dialog" aria-modal="true" aria-label={title}>
          <button className="demos-sheet__backdrop" type="button" onClick={close} aria-label="Cerrar" />
          <div className="demos-sheet__panel">
            <div className="demos-sheet__handle" aria-hidden="true" />
            <div className="demos-sheet__header">
              <span className="demos-sheet__icon">
                <PlaylistIcon />
              </span>
              <div>
                <p className="eyebrow">Playlist privada</p>
                <h2>{title}</h2>
              </div>
              <button className="demos-sheet__close" type="button" onClick={close} aria-label="Cerrar">
                <CloseIcon />
              </button>
            </div>

            <form className="demos-form-sheet" onSubmit={handleSubmit}>
              <label className="form-field">
                <span className="form-label">Nombre</span>
                <input
                  className="form-input"
                  value={formTitle}
                  onChange={(event) => setFormTitle(event.currentTarget.value)}
                  placeholder="Ej: Ensayo jueves"
                />
                {getFieldError(issues, 'title') ? (
                  <span className="field-error">{getFieldError(issues, 'title')}</span>
                ) : null}
              </label>

              <label className="form-field">
                <span className="form-label">Descripcion</span>
                <textarea
                  className="form-textarea"
                  value={description}
                  onChange={(event) => setDescription(event.currentTarget.value)}
                  rows={4}
                  placeholder="Notas o contexto para esta coleccion."
                />
                {getFieldError(issues, 'description') ? (
                  <span className="field-error">{getFieldError(issues, 'description')}</span>
                ) : null}
              </label>

              <label className="form-field">
                <span className="form-label">Portada</span>
                <input
                  className="form-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(event) => {
                    const nextFile = event.currentTarget.files?.[0] || null
                    setCoverFile(nextFile)
                    if (nextFile) {
                      setRemoveCover(false)
                    }
                  }}
                />
                <span className="form-helper">JPG, PNG, WEBP o AVIF hasta 5 MB.</span>
              </label>

              {visibleCoverUrl ? (
                <div className="demos-playlist-cover-field">
                  <div className="demos-playlist-cover-field__preview">
                    <img src={visibleCoverUrl} alt="" />
                  </div>
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      setCoverFile(null)
                      setRemoveCover(true)
                    }}
                  >
                    Quitar portada
                  </button>
                </div>
              ) : null}

              {error ? <div className="status status--error">{error}</div> : null}

              <div className="demos-form-sheet__actions">
                <button className="button" type="button" onClick={close} disabled={isPending}>
                  Cancelar
                </button>
                <button className="button button--primary" type="submit" disabled={isPending}>
                  {isPending ? 'Guardando...' : playlistId ? 'Guardar cambios' : 'Crear playlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
