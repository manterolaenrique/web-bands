'use client'

import {useEffect, useMemo, useState, useTransition, type FormEvent} from 'react'
import {usePathname, useRouter, useSearchParams} from 'next/navigation'

import type {BandAudioPlaylistSummary} from '@web-bands/bands-domain'

import {InlineButtonSpinner} from '@/components/ui/InlineButtonSpinner'
import {usePendingNavigation} from '@/components/ui/usePendingNavigation'
import {
  createPlaylistRequest,
  updatePlaylistRequest,
  type DemoApiValidationIssue,
} from '@/lib/dashboard/demos-api'

import {CloseIcon, PlaylistIcon} from './DemoIcons'

function getFieldError(errors: DemoApiValidationIssue[], field: string) {
  return errors.find((issue) => issue.path === field)?.message || null
}

function asPlaylistSummary(value: unknown): BandAudioPlaylistSummary | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Partial<BandAudioPlaylistSummary>
  if (typeof candidate.id !== 'string' || typeof candidate.title !== 'string') {
    return null
  }

  return candidate as BandAudioPlaylistSummary
}

export function PlaylistFormSheet({
  bandId,
  title = 'Nueva playlist',
  triggerLabel,
  playlistId,
  initialTitle = '',
  initialDescription = '',
  initialCoverUrl = '',
  onSuccess,
}: {
  bandId: string
  title?: string
  triggerLabel: string
  playlistId?: string
  initialTitle?: string
  initialDescription?: string
  initialCoverUrl?: string
  onSuccess?: (playlist: BandAudioPlaylistSummary) => void
}) {
  const router = useRouter()
  const navigation = usePendingNavigation()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [formTitle, setFormTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [removeCover, setRemoveCover] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [issues, setIssues] = useState<DemoApiValidationIssue[]>([])
  const [isPending, startTransition] = useTransition()

  const coverPreviewUrl = useMemo(() => {
    return coverFile ? URL.createObjectURL(coverFile) : ''
  }, [coverFile])

  useEffect(() => {
    if (!coverPreviewUrl) {
      return
    }

    return () => URL.revokeObjectURL(coverPreviewUrl)
  }, [coverPreviewUrl])

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

  const buildRefreshHref = (targetPath: string) => {
    const nextSearchParams = new URLSearchParams(searchParams.toString())
    nextSearchParams.set('playlistUpdatedAt', String(Date.now()))
    const query = nextSearchParams.toString()
    return query ? `${targetPath}?${query}` : targetPath
  }

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

      const nextPlaylist = asPlaylistSummary(response.body?.playlist)
      close()

      if (nextPlaylist) {
        onSuccess?.(nextPlaylist)

        if (onSuccess) {
          return
        }

        const detailHref = `/dashboard/bands/${bandId}/demos/playlists/${nextPlaylist.id}`

        if (playlistId) {
          const targetHref = pathname === detailHref ? buildRefreshHref(detailHref) : detailHref
          navigation.replace(targetHref, {scroll: false}, `Actualizando ${nextPlaylist.title}...`)
          return
        }

        navigation.push(detailHref, undefined, `Abriendo ${nextPlaylist.title}...`)
        return
      }

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
                <button className="button button--primary" type="submit" disabled={isPending} aria-busy={isPending}>
                  {isPending ? (
                    <InlineButtonSpinner label="Guardando..." />
                  ) : playlistId ? (
                    'Guardar cambios'
                  ) : (
                    'Crear playlist'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
