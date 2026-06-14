'use client'

import {useRouter} from 'next/navigation'
import {useMemo, useState, useTransition, type ChangeEvent, type FormEvent} from 'react'

import {
  BAND_AUDIO_TRACK_STATUSES,
  BAND_AUDIO_TRACK_TYPES,
  type BandAudioPlaylistSummary,
} from '@web-bands/bands-domain'

import {uploadDemoTrackRequest, type DemoApiValidationIssue} from '@/lib/dashboard/demos-api'
import {getTrackStatusLabel, getTrackTypeLabel, formatFileSize} from '@/lib/demos/format'

import {UploadIcon} from './DemoIcons'

function getFieldError(errors: DemoApiValidationIssue[], field: string) {
  return errors.find((issue) => issue.path === field)?.message || null
}

async function resolveDurationSeconds(file: File) {
  const objectUrl = URL.createObjectURL(file)

  try {
    const duration = await new Promise<number | null>((resolve) => {
      const audio = document.createElement('audio')
      audio.preload = 'metadata'
      audio.src = objectUrl
      audio.onloadedmetadata = () => resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null)
      audio.onerror = () => resolve(null)
    })

    return duration
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function getFileNameWithoutExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '').trim()
}

export function DemoUploadForm({
  bandId,
  playlists = [],
}: {
  bandId: string
  playlists?: BandAudioPlaylistSummary[]
}) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [lastAutoTitle, setLastAutoTitle] = useState('')
  const [description, setDescription] = useState('')
  const [relatedSongTitle, setRelatedSongTitle] = useState('')
  const [trackType, setTrackType] = useState<(typeof BAND_AUDIO_TRACK_TYPES)[number]>('demo')
  const [trackStatus, setTrackStatus] = useState<(typeof BAND_AUDIO_TRACK_STATUSES)[number]>('nuevo')
  const [playlistId, setPlaylistId] = useState('')
  const [isDownloadable, setIsDownloadable] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [issues, setIssues] = useState<DemoApiValidationIssue[]>([])
  const [isPending, startTransition] = useTransition()
  const availablePlaylists = playlists.filter((playlist) => !playlist.isLocked)

  const filePreview = useMemo(() => {
    if (!file) {
      return null
    }

    return {
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || 'audio',
    }
  }, [file])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.currentTarget.files?.[0] || null
    setFile(nextFile)

    if (!nextFile) {
      setLastAutoTitle('')
      return
    }

    const nextAutoTitle = getFileNameWithoutExtension(nextFile.name)
    if (!nextAutoTitle) {
      setLastAutoTitle('')
      return
    }

    if (!title.trim() || title === lastAutoTitle) {
      setTitle(nextAutoTitle)
    }

    setLastAutoTitle(nextAutoTitle)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIssues([])

    if (!file) {
      setError('Selecciona un audio antes de guardar.')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      const durationSeconds = await resolveDurationSeconds(file)
      formData.set('file', file)
      formData.set('title', title)
      formData.set('description', description)
      formData.set('relatedSongTitle', relatedSongTitle)
      formData.set('trackType', trackType)
      formData.set('trackStatus', trackStatus)
      formData.set('isDownloadable', String(isDownloadable))
      if (playlistId) {
        formData.set('playlistId', playlistId)
      }
      if (durationSeconds) {
        formData.set('durationSeconds', String(durationSeconds))
      }

      const response = await uploadDemoTrackRequest(bandId, formData)

      if (!response.ok) {
        setError(response.body?.message || 'No se pudo guardar el demo.')
        setIssues(response.body?.errors || [])
        return
      }

      const nextTrackId =
        response.body?.track && typeof response.body.track === 'object' && 'id' in response.body.track
          ? String((response.body.track as {id: string}).id)
          : null

      if (nextTrackId) {
        router.push(`/dashboard/bands/${bandId}/demos/${nextTrackId}`)
        return
      }

      router.push(`/dashboard/bands/${bandId}/demos`)
    })
  }

  return (
    <form className="demos-upload-form" onSubmit={handleSubmit}>
      <label className="demos-upload-form__dropzone">
        <input
          className="sr-only"
          type="file"
          accept=".mp3,.wav,.m4a,.ogg,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/ogg"
          onChange={handleFileChange}
        />
        <span className="demos-upload-form__dropzone-icon" aria-hidden="true">
          <UploadIcon />
        </span>
        <strong>Subi un MP3, WAV, M4A u OGG</strong>
        <span>Arrastra el archivo o toca para seleccionarlo.</span>
        {filePreview ? (
          <small>
            {filePreview.name} · {filePreview.size}
          </small>
        ) : null}
      </label>

      <div className="demos-upload-form__grid">
        <label className="form-field form-field--full">
          <span className="form-label">Titulo</span>
          <input
            className="form-input"
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            placeholder="Ej: Sobre Ruinas demo v3"
          />
          {getFieldError(issues, 'title') ? <span className="field-error">{getFieldError(issues, 'title')}</span> : null}
        </label>

        <label className="form-field form-field--full">
          <span className="form-label">Descripcion o notas</span>
          <textarea
            className="form-textarea"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
            placeholder="Que probar, que corregir o de donde salio esta version."
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
            placeholder="Opcional"
          />
        </label>

        <label className="form-field">
          <span className="form-label">Tipo</span>
          <select
            className="form-select"
            value={trackType}
            onChange={(event) => setTrackType(event.currentTarget.value as (typeof BAND_AUDIO_TRACK_TYPES)[number])}
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
            onChange={(event) => setTrackStatus(event.currentTarget.value as (typeof BAND_AUDIO_TRACK_STATUSES)[number])}
          >
            {BAND_AUDIO_TRACK_STATUSES.map((value) => (
              <option key={value} value={value}>
                {getTrackStatusLabel(value)}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span className="form-label">Playlist adicional (opcional)</span>
          <select className="form-select" value={playlistId} onChange={(event) => setPlaylistId(event.currentTarget.value)}>
            <option value="">Sin playlist por ahora</option>
            {availablePlaylists.map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.title}
              </option>
            ))}
          </select>
          <span className="form-helper">Este audio siempre entra en General. Aqui puedes sumarlo tambien a otra playlist.</span>
          {getFieldError(issues, 'playlistId') ? (
            <span className="field-error">{getFieldError(issues, 'playlistId')}</span>
          ) : null}
        </label>

        <label className="demos-upload-form__toggle">
          <div>
            <strong>Permitir descarga</strong>
            <span>Otros integrantes podran bajar este archivo.</span>
          </div>
          <input
            type="checkbox"
            checked={isDownloadable}
            onChange={(event) => setIsDownloadable(event.currentTarget.checked)}
          />
        </label>
      </div>

      {error ? <div className="status status--error">{error}</div> : null}

      <div className="demos-upload-form__actions">
        <button className="button" type="button" onClick={() => router.push(`/dashboard/bands/${bandId}/demos`)}>
          Cancelar
        </button>
        <button className="button button--primary" type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar demo'}
        </button>
      </div>
    </form>
  )
}
