'use client'

import {useRouter} from 'next/navigation'
import {useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent} from 'react'

import {
  MAX_TIMELINE_EVENTS,
  TIMELINE_ICON_OPTIONS,
  TIMELINE_IMPORTANCE_OPTIONS,
  createBandEditorKey,
} from '@/lib/bands/content'
import {
  appendArrayItem,
  areEditorValuesEqual,
  buildSavedArrayItems,
  mergeEditorValues,
  moveArrayItem,
  removeArrayItem,
  resolveArrayItemState,
  resolveSectionState,
  setValueAtPath,
  shouldRestoreDraft,
  type ArrayCollection,
  type BandEditorGalleryItem,
  type BandEditorImages,
  type BandEditorMember,
  type BandEditorShow,
  type BandEditorSpotifyPlaylist,
  type BandEditorTimelineEvent,
  type BandEditorValues,
  type BandEditorYoutubeVideo,
  type SavedArrayItems,
  type StoredBandEditorSnapshot,
} from '@/lib/bands/editor'
import type {SanityImage} from '@/types/band'

type EditorPhase = 'pristine' | 'dirty' | 'saving' | 'saved' | 'error'

type ValidationIssue = {
  path: string
  message: string
}

type ImageUploadState =
  | {
      status: 'idle'
    }
  | {
      status: 'uploading'
    }
  | {
      status: 'success'
      message: string
    }
  | {
      status: 'error'
      message: string
    }

type BandEditorResponse = {
  ok?: boolean
  band?: {
    id: string
    slug: string
    sanityDocumentId: string
    syncedAt?: string
  }
  message?: string
  errors?: ValidationIssue[]
}

type BandAssetResponse = {
  ok?: boolean
  image?: {
    assetId?: string
    url?: string | null
  }
  message?: string
}

type EditorToast = {
  id: number
  tone: 'success' | 'warning' | 'error'
  message: string
}

type TopLevelImageField = 'logo' | 'logoFavicon' | 'heroImage' | 'aboutImage' | 'featuredReleaseCover'

type ImageUploadTarget =
  | {
      kind: 'field'
      field: TopLevelImageField
    }
  | {
      kind: 'array'
      collection: ArrayCollection
      itemKey: string
      imageField: 'foto' | 'image'
    }

function buildFieldErrors(errors: unknown) {
  if (!Array.isArray(errors)) {
    return {}
  }

  return errors.reduce<Record<string, string[]>>((result, error) => {
    const typedError = error as ValidationIssue

    if (!typedError?.path || !typedError?.message) {
      return result
    }

    result[typedError.path] = [...(result[typedError.path] || []), typedError.message]
    return result
  }, {})
}

function getFieldClassName(baseClassName: string, hasError: boolean) {
  return hasError ? `${baseClassName} ${baseClassName}--error` : baseClassName
}

function FieldError({errors}: {errors: string[]}) {
  if (errors.length === 0) {
    return null
  }

  return <p className="field-error">{errors[0]}</p>
}

function clearFieldErrorByPath(errors: Record<string, string[]>, path: string) {
  if (!errors[path]) {
    return errors
  }

  const next = {...errors}
  delete next[path]
  return next
}

function createSanityImageRef(assetId: string): SanityImage {
  return {
    _type: 'image',
    asset: {
      _type: 'reference',
      _ref: assetId,
    },
  }
}

function ImageUploadField({
  bandId,
  target,
  label,
  help,
  previewUrl,
  disabled = false,
  disabledHelp,
  onUploaded,
  onStatusMessage,
}: {
  bandId: string
  target: ImageUploadTarget
  label: string
  help: string
  previewUrl?: string | null
  disabled?: boolean
  disabledHelp?: string
  onUploaded?: (image: SanityImage) => void
  onStatusMessage?: (tone: EditorToast['tone'], message: string) => void
}) {
  const router = useRouter()
  const [state, setState] = useState<ImageUploadState>({status: 'idle'})
  const [uploadedPreview, setUploadedPreview] = useState('')
  const preview = previewUrl || uploadedPreview

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return

    setState({status: 'uploading'})

    const formData = new FormData()
    if (target.kind === 'field') {
      formData.set('field', target.field)
    } else {
      formData.set('collection', target.collection)
      formData.set('itemKey', target.itemKey)
      formData.set('imageField', target.imageField)
    }
    formData.set('file', file)

    const response = await fetch(`/api/bands/${bandId}/assets`, {
      method: 'POST',
      body: formData,
    })
    const body = (await response.json().catch(() => ({}))) as BandAssetResponse

    if (!response.ok) {
      const message = body?.message || 'No se pudo subir la imagen.'
      setState({
        status: 'error',
        message,
      })
      onStatusMessage?.('error', message)
      input.value = ''
      return
    }

    if (body?.image?.assetId && onUploaded) {
      onUploaded(createSanityImageRef(body.image.assetId))
    }

    setUploadedPreview(body.image?.url || URL.createObjectURL(file))
    const message = 'Imagen subida correctamente.'
    setState({
      status: 'success',
      message,
    })
    onStatusMessage?.('success', message)
    input.value = ''
    router.refresh()
  }

  return (
    <div className={`asset-uploader${disabled ? ' asset-uploader--disabled' : ''}`}>
      <div
        className="asset-uploader__preview"
        style={preview ? {backgroundImage: `url(${preview})`} : undefined}
        aria-label={preview ? `Vista previa de ${label}` : `Sin imagen para ${label}`}
      >
        {!preview ? <span>Sin imagen</span> : null}
      </div>
      <label className="form-field">
        <span className="form-label">{label}</span>
        <input
          className="form-input"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          disabled={disabled}
        />
      </label>
      <p className="muted asset-uploader__help">{disabled ? disabledHelp || help : help}</p>
      {state.status === 'success' ? <div className="status status--success">{state.message}</div> : null}
      {state.status === 'error' ? <div className="status status--error">{state.message}</div> : null}
      {state.status === 'uploading' ? <div className="status status--warning">Subiendo imagen...</div> : null}
    </div>
  )
}

function ArrayItemActions({
  onMoveUp,
  onMoveDown,
  onRemove,
  isFirst,
  isLast,
}: {
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  isFirst: boolean
  isLast: boolean
}) {
  return (
    <div className="array-item__actions">
      <button className="button" type="button" onClick={onMoveUp} disabled={isFirst}>
        Subir
      </button>
      <button className="button" type="button" onClick={onMoveDown} disabled={isLast}>
        Bajar
      </button>
      <button className="button button--danger" type="button" onClick={onRemove}>
        Eliminar
      </button>
    </div>
  )
}

function formatEditorTimestamp(value: string | null) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function StatusBadge({state}: {state: 'saved' | 'pending' | 'error'}) {
  const labels = {
    saved: 'Guardado',
    pending: 'Pendiente',
    error: 'Error',
  } as const

  return <span className={`editor-badge editor-badge--${state}`}>{labels[state]}</span>
}

function InlineNotice({
  tone,
  message,
}: {
  tone: 'pending' | 'error' | 'success'
  message: string
}) {
  return <div className={`editor-inline-note editor-inline-note--${tone}`}>{message}</div>
}

function EditorToastStack({
  toasts,
  onDismiss,
}: {
  toasts: EditorToast[]
  onDismiss: (id: number) => void
}) {
  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="editor-toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div className={`editor-toast editor-toast--${toast.tone}`} key={toast.id} role="status">
          <span>{toast.message}</span>
          <button
            className="editor-toast__close"
            type="button"
            onClick={() => {
              onDismiss(toast.id)
            }}
            aria-label="Cerrar notificacion"
          >
            Cerrar
          </button>
        </div>
      ))}
    </div>
  )
}

function getPendingArrayNotice(itemState: 'saved' | 'pending' | 'error', imageLocked = false) {
  if (itemState === 'error') {
    return {
      tone: 'error' as const,
      message: 'Este item tiene errores. Corrige los campos marcados antes de guardar.',
    }
  }

  if (itemState === 'pending' && imageLocked) {
    return {
      tone: 'pending' as const,
      message: 'Completa los campos y guarda para habilitar la imagen.',
    }
  }

  if (itemState === 'pending') {
    return {
      tone: 'pending' as const,
      message: 'Este item sigue en borrador. Guarda la banda para publicarlo.',
    }
  }

  return null
}

function SectionHeading({
  title,
  description,
  state,
}: {
  title: string
  description?: string
  state: 'saved' | 'pending' | 'error'
}) {
  return (
    <div className="section-heading">
      <div className="section-heading__copy">
        <div className="section-heading__title-row">
          <h2>{title}</h2>
          <StatusBadge state={state} />
        </div>
        {description ? <p className="muted">{description}</p> : null}
      </div>
    </div>
  )
}

export function BandEditorForm({
  bandId,
  initialValues,
  initialImages,
  initialServerSavedAt,
}: {
  bandId: string
  initialValues: BandEditorValues
  initialImages: BandEditorImages
  initialServerSavedAt?: string | null
}) {
  const router = useRouter()
  const storageKey = `web-bands:editor:${bandId}`
  const initialValuesRef = useRef(initialValues)
  const initialServerSavedAtRef = useRef(initialServerSavedAt)
  const baselineValuesRef = useRef(initialValues)
  const pendingToastTransitionRef = useRef(false)
  const focusItemKeyRef = useRef<string | null>(null)
  const toastTimeoutsRef = useRef<Map<number, number>>(new Map())
  const [values, setValues] = useState(initialValues)
  const [baselineValues, setBaselineValues] = useState(initialValues)
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialServerSavedAt || null)
  const [lastRestoredDraftAt, setLastRestoredDraftAt] = useState<string | null>(null)
  const [ignoredDraftAt, setIgnoredDraftAt] = useState<string | null>(null)
  const [hasSavedSinceMount, setHasSavedSinceMount] = useState(false)
  const [hasHydratedDraft, setHasHydratedDraft] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [savedArrayItems, setSavedArrayItems] = useState<SavedArrayItems>(() => buildSavedArrayItems(initialValues))
  const [toasts, setToasts] = useState<EditorToast[]>([])

  useEffect(() => {
    const snapshot = window.localStorage.getItem(storageKey)
    if (!snapshot) {
      const frame = window.requestAnimationFrame(() => {
        setHasHydratedDraft(true)
      })

      return () => window.cancelAnimationFrame(frame)
    }

    const parsed = (() => {
      try {
        return JSON.parse(snapshot) as Partial<StoredBandEditorSnapshot>
      } catch {
        window.localStorage.removeItem(storageKey)
        return null
      }
    })()

    if (!parsed) {
      const frame = window.requestAnimationFrame(() => {
        setHasHydratedDraft(true)
      })

      return () => window.cancelAnimationFrame(frame)
    }

    if (shouldRestoreDraft(parsed, initialValuesRef.current, initialServerSavedAtRef.current)) {
      const mergedValues = mergeEditorValues(initialValuesRef.current, parsed.values || {})
      const frame = window.requestAnimationFrame(() => {
        setValues(mergedValues)
        setLastRestoredDraftAt(parsed.savedAt || new Date().toISOString())
        setHasHydratedDraft(true)
      })

      return () => window.cancelAnimationFrame(frame)
    }

    const frame = window.requestAnimationFrame(() => {
      setIgnoredDraftAt(parsed.savedAt || null)
      setHasHydratedDraft(true)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [storageKey])

  useEffect(() => {
    baselineValuesRef.current = baselineValues
  }, [baselineValues])

  useEffect(() => {
    const timeouts = toastTimeoutsRef.current

    return () => {
      timeouts.forEach((timeout) => window.clearTimeout(timeout))
      timeouts.clear()
    }
  }, [])

  useEffect(() => {
    const previousBaseline = baselineValuesRef.current
    const incomingServerTime = initialServerSavedAt ? Date.parse(initialServerSavedAt) : Number.NaN
    const localSavedTime = lastSavedAt ? Date.parse(lastSavedAt) : Number.NaN
    const shouldKeepLocalVersion =
      Boolean(lastSavedAt) &&
      (!initialServerSavedAt ||
        Number.isNaN(incomingServerTime) ||
        (!Number.isNaN(localSavedTime) && incomingServerTime < localSavedTime))

    if (shouldKeepLocalVersion) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      baselineValuesRef.current = initialValues
      setBaselineValues(initialValues)
      setSavedArrayItems(buildSavedArrayItems(initialValues))
      setLastSavedAt(initialServerSavedAt || null)

      if (!hasHydratedDraft) {
        return
      }

      setValues((current) =>
        areEditorValuesEqual(current, previousBaseline) ? initialValues : mergeEditorValues(initialValues, current)
      )
    })

    return () => window.cancelAnimationFrame(frame)
  }, [hasHydratedDraft, initialServerSavedAt, initialValues, lastSavedAt])

  const hasPendingChanges = !areEditorValuesEqual(values, baselineValues)
  const editorPhase: EditorPhase = isSaving
    ? 'saving'
    : submitError
      ? 'error'
      : hasPendingChanges
        ? 'dirty'
        : hasSavedSinceMount
          ? 'saved'
          : 'pristine'

  useEffect(() => {
    if (!hasHydratedDraft) {
      return
    }

    if (!hasPendingChanges) {
      window.localStorage.removeItem(storageKey)
      return
    }

    const snapshot: StoredBandEditorSnapshot = {
      values,
      baseline: baselineValues,
      savedAt: new Date().toISOString(),
    }

    window.localStorage.setItem(storageKey, JSON.stringify(snapshot))
  }, [baselineValues, hasHydratedDraft, hasPendingChanges, storageKey, values])

  const getErrorsForField = (path: string) => fieldErrors[path] || []
  const clearStructuralErrors = () => setFieldErrors({})
  const dismissToast = useCallback((id: number) => {
    const timeout = toastTimeoutsRef.current.get(id)
    if (timeout) {
      window.clearTimeout(timeout)
      toastTimeoutsRef.current.delete(id)
    }

    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])
  const pushToast = useCallback((tone: EditorToast['tone'], message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((current) => [...current, {id, tone, message}])
    const timeout = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
      toastTimeoutsRef.current.delete(id)
    }, 4200)
    toastTimeoutsRef.current.set(id, timeout)
  }, [])
  const focusArrayItem = (itemKey: string) => {
    focusItemKeyRef.current = itemKey
  }
  const notifyArrayItemAdded = (itemKey: string, message: string) => {
    pendingToastTransitionRef.current = true
    focusArrayItem(itemKey)
    pushToast('success', message)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {name} = event.currentTarget
    const value =
      event.currentTarget instanceof HTMLInputElement && event.currentTarget.type === 'checkbox'
        ? event.currentTarget.checked
        : event.currentTarget.value

    setValues((current) => setValueAtPath(current, name, value))
    setFieldErrors((current) => clearFieldErrorByPath(current, name))
    setSubmitError(null)
  }

  useEffect(() => {
    const itemKey = focusItemKeyRef.current
    if (!itemKey) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      const section = document.querySelector<HTMLElement>(`[data-array-item-key="${itemKey}"]`)
      if (!section) {
        return
      }

      const focusTarget = section.querySelector<HTMLElement>('input:not([type="file"]), textarea, select')
      section.scrollIntoView({behavior: 'smooth', block: 'center'})
      focusTarget?.focus()
      focusItemKeyRef.current = null
    })

    return () => window.cancelAnimationFrame(frame)
  }, [values])

  useEffect(() => {
    if (!hasHydratedDraft) {
      return
    }

    if (!hasPendingChanges) {
      pendingToastTransitionRef.current = false
      return
    }

    if (pendingToastTransitionRef.current) {
      pendingToastTransitionRef.current = false
      return
    }

    pushToast('warning', 'Hay cambios pendientes. Guarda para publicarlos.')
    pendingToastTransitionRef.current = true
  }, [hasHydratedDraft, hasPendingChanges, pushToast])

  const handleArrayImageUploaded = (path: string, image: SanityImage) => {
    pendingToastTransitionRef.current = true
    setValues((current) => setValueAtPath(current, path, image))
    setSubmitError(null)
  }

  const handleAddIntegrante = () => {
    const itemKey = createBandEditorKey('member')
    setValues((current) =>
      appendArrayItem(current, 'about.integrantes', {
        _key: itemKey,
        nombre: '',
        instrumento: '',
      } satisfies BandEditorMember)
    )
    clearStructuralErrors()
    setSubmitError(null)
    notifyArrayItemAdded(itemKey, 'Integrante agregado.')
  }

  const handleAddTimelineEvent = () => {
    if (values.timelineSection.events.length >= MAX_TIMELINE_EVENTS) {
      return
    }

    const itemKey = createBandEditorKey('timeline')
    setValues((current) =>
      appendArrayItem(current, 'timelineSection.events', {
        _key: itemKey,
        name: '',
        date: '',
        importance: 'secundario',
        descripcion: '',
        link: '',
        icon: TIMELINE_ICON_OPTIONS[0].value,
      } satisfies BandEditorTimelineEvent)
    )
    clearStructuralErrors()
    setSubmitError(null)
    notifyArrayItemAdded(itemKey, 'Evento agregado.')
  }

  const handleAddYoutubeVideo = () => {
    const itemKey = createBandEditorKey('yt')
    setValues((current) =>
      appendArrayItem(current, 'escuchanos.youtube.videos', {
        _key: itemKey,
        titulo: '',
        url: '',
        descripcion: '',
      } satisfies BandEditorYoutubeVideo)
    )
    clearStructuralErrors()
    setSubmitError(null)
    notifyArrayItemAdded(itemKey, 'Video agregado.')
  }

  const handleAddSpotifyPlaylist = () => {
    const itemKey = createBandEditorKey('spotify')
    setValues((current) =>
      appendArrayItem(current, 'escuchanos.spotify.playlists', {
        _key: itemKey,
        titulo: '',
        url: '',
        descripcion: '',
      } satisfies BandEditorSpotifyPlaylist)
    )
    clearStructuralErrors()
    setSubmitError(null)
    notifyArrayItemAdded(itemKey, 'Playlist agregada.')
  }

  const handleAddShow = () => {
    const itemKey = createBandEditorKey('show')
    setValues((current) =>
      appendArrayItem(current, 'showsSection.shows', {
        _key: itemKey,
        date: '',
        venue: '',
        location: '',
        ticketUrl: '',
        status: 'tickets',
      } satisfies BandEditorShow)
    )
    clearStructuralErrors()
    setSubmitError(null)
    notifyArrayItemAdded(itemKey, 'Show agregado.')
  }

  const handleAddGalleryItem = () => {
    const itemKey = createBandEditorKey('gallery')
    setValues((current) =>
      appendArrayItem(current, 'gallerySection.items', {
        _key: itemKey,
        alt: '',
        caption: '',
        link: '',
      } satisfies BandEditorGalleryItem)
    )
    clearStructuralErrors()
    setSubmitError(null)
    notifyArrayItemAdded(itemKey, 'Imagen agregada a la galeria.')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setSubmitError(null)

    const response = await fetch(`/api/bands/${bandId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    })

    const body = (await response.json().catch(() => ({}))) as BandEditorResponse

    if (!response.ok) {
      const nextFieldErrors = buildFieldErrors(body?.errors)
      setFieldErrors(nextFieldErrors)
      const message =
        Object.keys(nextFieldErrors).length > 0
          ? 'Revisa los campos marcados y corrige los errores antes de guardar.'
          : body?.message || 'No se pudo guardar la banda.'
      setSubmitError(message)
      pushToast('error', message)
      setIsSaving(false)
      return
    }

    setFieldErrors({})
    setSavedArrayItems(buildSavedArrayItems(values))
    setBaselineValues(values)
    setLastSavedAt(body.band?.syncedAt || new Date().toISOString())
    setLastRestoredDraftAt(null)
    setIgnoredDraftAt(null)
    setHasSavedSinceMount(true)
    setIsSaving(false)
    pushToast('success', 'Cambios guardados. La pagina publica ya esta sincronizada.')
    window.localStorage.removeItem(storageKey)
    router.refresh()
  }

  const identityState = resolveSectionState({
    values,
    baselineValues,
    fieldErrors,
    pathPrefixes: ['colors'],
  })
  const heroState = resolveSectionState({
    values,
    baselineValues,
    fieldErrors,
    pathPrefixes: ['hero'],
  })
  const aboutState = resolveSectionState({
    values,
    baselineValues,
    fieldErrors,
    pathPrefixes: ['about.title', 'about.content', 'about.integrantes'],
  })
  const timelineState = resolveSectionState({
    values,
    baselineValues,
    fieldErrors,
    pathPrefixes: ['timelineSection'],
  })
  const contactState = resolveSectionState({
    values,
    baselineValues,
    fieldErrors,
    pathPrefixes: ['contact'],
  })
  const listenState = resolveSectionState({
    values,
    baselineValues,
    fieldErrors,
    pathPrefixes: ['escuchanos'],
  })
  const featuredReleaseState = resolveSectionState({
    values,
    baselineValues,
    fieldErrors,
    pathPrefixes: ['featuredRelease'],
  })
  const showsState = resolveSectionState({
    values,
    baselineValues,
    fieldErrors,
    pathPrefixes: ['showsSection'],
  })
  const galleryState = resolveSectionState({
    values,
    baselineValues,
    fieldErrors,
    pathPrefixes: ['gallerySection'],
  })
  const seoState = resolveSectionState({
    values,
    baselineValues,
    fieldErrors,
    pathPrefixes: ['seo'],
  })

  const lastSavedLabel = formatEditorTimestamp(lastSavedAt)
  const restoredDraftLabel = formatEditorTimestamp(lastRestoredDraftAt)
  const ignoredDraftLabel = formatEditorTimestamp(ignoredDraftAt)
  const pendingSectionCount = [
    identityState,
    heroState,
    aboutState,
    timelineState,
    contactState,
    listenState,
    featuredReleaseState,
    showsState,
    galleryState,
    seoState,
  ].filter((state) => state !== 'saved').length
  const pendingSummary =
    pendingSectionCount === 0
      ? 'Sin cambios pendientes'
      : pendingSectionCount === 1
        ? '1 seccion con cambios pendientes'
        : `${pendingSectionCount} secciones con cambios pendientes`

  return (
    <form className="dashboard-card" onSubmit={handleSubmit}>
      <EditorToastStack toasts={toasts} onDismiss={dismissToast} />
      <div className={`editor-savebar editor-savebar--${editorPhase}`} aria-live="polite">
        <div className="editor-savebar__summary">
          <div className="editor-savebar__status" role="status">
            <span className={`editor-savebar__dot editor-savebar__dot--${editorPhase}`} />
            <strong>
              {editorPhase === 'saving'
                ? 'Guardando cambios'
                : editorPhase === 'error'
                  ? 'Error al guardar'
                  : editorPhase === 'dirty'
                    ? 'Cambios pendientes'
                    : editorPhase === 'saved'
                      ? 'Todo guardado'
                      : 'Sin cambios'}
            </strong>
          </div>
          <p className="muted">
            {submitError
              ? submitError
              : editorPhase === 'dirty'
                ? 'Todavia hay cambios que no estan reflejados en la pagina publica.'
                : editorPhase === 'saved'
                  ? 'La banda quedo sincronizada y la pagina publica fue revalidada.'
                  : 'La banda esta alineada con la ultima version publicada en el dashboard.'}
          </p>
        </div>
        <div className="editor-savebar__meta">
          <span className={`editor-savebar__meta-item${pendingSectionCount > 0 ? ' editor-savebar__meta-item--pending' : ''}`}>
            {pendingSummary}
          </span>
          {lastSavedLabel ? <span className="editor-savebar__meta-item">Ultimo guardado: {lastSavedLabel}</span> : null}
          {restoredDraftLabel ? (
            <span className="editor-savebar__meta-item">Borrador restaurado: {restoredDraftLabel}</span>
          ) : null}
          {!restoredDraftLabel && ignoredDraftLabel ? (
            <span className="editor-savebar__meta-item editor-savebar__meta-item--warning">
              Se ignoro un borrador local mas viejo: {ignoredDraftLabel}
            </span>
          ) : null}
        </div>
        <div className="editor-savebar__actions">
          <button className="button button--primary editor-savebar__button" disabled={isSaving || !hasPendingChanges} type="submit">
            {isSaving ? 'Guardando...' : hasPendingChanges ? 'Guardar cambios' : 'Todo guardado'}
          </button>
        </div>
      </div>

      <div className="form-grid">
        <label className="form-field">
          <span className="form-label">Nombre</span>
          <input
            className={getFieldClassName('form-input', getErrorsForField('name').length > 0)}
            name="name"
            value={values.name}
            onChange={handleChange}
            aria-invalid={getErrorsForField('name').length > 0}
            required
          />
          <FieldError errors={getErrorsForField('name')} />
        </label>
        <label className="form-field">
          <span className="form-label">Slug publico</span>
          <input
            className={getFieldClassName('form-input', getErrorsForField('slug').length > 0)}
            name="slug"
            value={values.slug}
            onChange={handleChange}
            aria-invalid={getErrorsForField('slug').length > 0}
            required
          />
          <FieldError errors={getErrorsForField('slug')} />
        </label>
        <label className="form-field">
          <span className="form-label">Genero</span>
          <input
            className={getFieldClassName('form-input', getErrorsForField('genre').length > 0)}
            name="genre"
            value={values.genre || ''}
            onChange={handleChange}
            aria-invalid={getErrorsForField('genre').length > 0}
          />
          <FieldError errors={getErrorsForField('genre')} />
        </label>
        <label className="form-field">
          <span className="form-label">Estado</span>
          <select
            className={getFieldClassName('form-select', getErrorsForField('status').length > 0)}
            name="status"
            value={values.status}
            onChange={handleChange}
            aria-invalid={getErrorsForField('status').length > 0}
          >
            <option value="draft">Borrador</option>
            <option value="published">Publicada</option>
            <option value="archived">Archivada</option>
          </select>
          <FieldError errors={getErrorsForField('status')} />
        </label>
      </div>

      <div className="form-section">
        <SectionHeading title="Identidad visual" description="Paleta, logo y favicon para la banda." state={identityState} />
        <div className="asset-grid">
          <ImageUploadField
            bandId={bandId}
            target={{kind: 'field', field: 'logo'}}
            label="Logo"
            help="PNG, JPG o WebP. Ideal cuadrado, hasta 5MB."
            previewUrl={initialImages.logo}
            onStatusMessage={pushToast}
          />
          <ImageUploadField
            bandId={bandId}
            target={{kind: 'field', field: 'logoFavicon'}}
            label="Favicon"
            help="Imagen simple y cuadrada para pestana del navegador."
            previewUrl={initialImages.logoFavicon}
            onStatusMessage={pushToast}
          />
        </div>
        <div className="form-grid">
          <label className="form-field">
            <span className="form-label">Color primario</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('colors.primary').length > 0)}
              name="colors.primary"
              value={values.colors.primary}
              onChange={handleChange}
              aria-invalid={getErrorsForField('colors.primary').length > 0}
              placeholder="#111827"
            />
            <FieldError errors={getErrorsForField('colors.primary')} />
          </label>
          <label className="form-field">
            <span className="form-label">Color secundario</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('colors.secondary').length > 0)}
              name="colors.secondary"
              value={values.colors.secondary}
              onChange={handleChange}
              aria-invalid={getErrorsForField('colors.secondary').length > 0}
              placeholder="#6b7280"
            />
            <FieldError errors={getErrorsForField('colors.secondary')} />
          </label>
          <label className="form-field">
            <span className="form-label">Secundario claro</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('colors.secondaryLight').length > 0)}
              name="colors.secondaryLight"
              value={values.colors.secondaryLight || ''}
              onChange={handleChange}
              aria-invalid={getErrorsForField('colors.secondaryLight').length > 0}
              placeholder="#eef2f6"
            />
            <FieldError errors={getErrorsForField('colors.secondaryLight')} />
          </label>
          <label className="form-field">
            <span className="form-label">Acento</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('colors.accent').length > 0)}
              name="colors.accent"
              value={values.colors.accent || ''}
              onChange={handleChange}
              aria-invalid={getErrorsForField('colors.accent').length > 0}
              placeholder="#155eef"
            />
            <FieldError errors={getErrorsForField('colors.accent')} />
          </label>
        </div>
      </div>

      <div className="form-section">
        <SectionHeading title="Hero" description="Portada principal de la pagina publica." state={heroState} />
        <div className="asset-grid">
          <ImageUploadField
            bandId={bandId}
            target={{kind: 'field', field: 'heroImage'}}
            label="Imagen principal"
            help="Foto horizontal para la portada publica."
            previewUrl={initialImages.heroImage}
            onStatusMessage={pushToast}
          />
        </div>
        <div className="form-grid">
          <label className="form-field">
            <span className="form-label">Titulo</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('hero.title').length > 0)}
              name="hero.title"
              value={values.hero.title}
              onChange={handleChange}
              aria-invalid={getErrorsForField('hero.title').length > 0}
            />
            <FieldError errors={getErrorsForField('hero.title')} />
          </label>
          <label className="form-field">
            <span className="form-label">Subtitulo</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('hero.subtitle').length > 0)}
              name="hero.subtitle"
              value={values.hero.subtitle || ''}
              onChange={handleChange}
              aria-invalid={getErrorsForField('hero.subtitle').length > 0}
            />
            <FieldError errors={getErrorsForField('hero.subtitle')} />
          </label>
          <label className="form-field form-field--full">
            <span className="form-label">Descripcion</span>
            <textarea
              className={getFieldClassName('form-textarea', getErrorsForField('hero.description').length > 0)}
              name="hero.description"
              value={values.hero.description || ''}
              onChange={handleChange}
              aria-invalid={getErrorsForField('hero.description').length > 0}
            />
            <FieldError errors={getErrorsForField('hero.description')} />
          </label>
        </div>
      </div>

      <div className="form-section">
        <SectionHeading title="Sobre la banda" description="Historia principal y contenido editorial." state={aboutState} />
        <div className="asset-grid">
          <ImageUploadField
            bandId={bandId}
            target={{kind: 'field', field: 'aboutImage'}}
            label="Imagen de la banda"
            help="Foto secundaria para la seccion sobre la banda."
            previewUrl={initialImages.aboutImage}
            onStatusMessage={pushToast}
          />
        </div>
        <div className="form-grid">
          <label className="form-field">
            <span className="form-label">Titulo de seccion</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('about.title').length > 0)}
              name="about.title"
              value={values.about.title || ''}
              onChange={handleChange}
              aria-invalid={getErrorsForField('about.title').length > 0}
            />
            <FieldError errors={getErrorsForField('about.title')} />
          </label>
          <label className="form-field form-field--full">
            <span className="form-label">Contenido</span>
            <textarea
              className={getFieldClassName('form-textarea', getErrorsForField('about.content').length > 0)}
              name="about.content"
              value={values.about.content}
              onChange={handleChange}
              aria-invalid={getErrorsForField('about.content').length > 0}
              required
            />
            <FieldError errors={getErrorsForField('about.content')} />
          </label>
        </div>
      </div>

      <div className="form-section">
        <div className="row-actions row-actions--split">
          <SectionHeading
            title="Integrantes"
            description="Alta, orden y fotos por integrante desde el panel privado."
            state={aboutState}
          />
          <button className="button button--primary" type="button" onClick={handleAddIntegrante}>
            Agregar integrante
          </button>
        </div>
        <FieldError errors={getErrorsForField('about.integrantes')} />
        <div className="array-list">
          {values.about.integrantes.map((member, index) => {
            const basePath = `about.integrantes.${index}`
            const isSaved = Boolean(savedArrayItems['about.integrantes'][member._key])
            const itemState = resolveArrayItemState({
              item: member,
              baselineItems: baselineValues.about.integrantes,
              savedItems: savedArrayItems['about.integrantes'],
              fieldErrors,
              pathPrefix: basePath,
            })
            const itemNotice = getPendingArrayNotice(itemState, !isSaved)

            return (
              <section className={`array-item array-item--${itemState}`} data-array-item-key={member._key} key={member._key}>
                <div className="row-actions row-actions--split">
                  <div className="array-item__header">
                    <h3 className="array-item__title">Integrante {index + 1}</h3>
                    <StatusBadge state={itemState} />
                  </div>
                  <ArrayItemActions
                    onMoveUp={() => {
                      setValues((current) => moveArrayItem(current, 'about.integrantes', index, -1))
                      clearStructuralErrors()
                    }}
                    onMoveDown={() => {
                      setValues((current) => moveArrayItem(current, 'about.integrantes', index, 1))
                      clearStructuralErrors()
                    }}
                    onRemove={() => {
                      setValues((current) => removeArrayItem(current, 'about.integrantes', index))
                      clearStructuralErrors()
                    }}
                    isFirst={index === 0}
                    isLast={index === values.about.integrantes.length - 1}
                  />
                </div>
                <div className="array-item__body">
                  {itemNotice ? <InlineNotice tone={itemNotice.tone} message={itemNotice.message} /> : null}
                  <div className="form-grid">
                    <label className="form-field">
                      <span className="form-label">Nombre</span>
                      <input
                        className={getFieldClassName('form-input', getErrorsForField(`${basePath}.nombre`).length > 0)}
                        name={`${basePath}.nombre`}
                        value={member.nombre}
                        onChange={handleChange}
                      />
                      <FieldError errors={getErrorsForField(`${basePath}.nombre`)} />
                    </label>
                    <label className="form-field">
                      <span className="form-label">Instrumento</span>
                      <input
                        className={getFieldClassName(
                          'form-input',
                          getErrorsForField(`${basePath}.instrumento`).length > 0
                        )}
                        name={`${basePath}.instrumento`}
                        value={member.instrumento}
                        onChange={handleChange}
                      />
                      <FieldError errors={getErrorsForField(`${basePath}.instrumento`)} />
                    </label>
                  </div>
                  <ImageUploadField
                    bandId={bandId}
                    target={{
                      kind: 'array',
                      collection: 'about.integrantes',
                      itemKey: member._key,
                      imageField: 'foto',
                    }}
                    label="Foto del integrante"
                    help="PNG, JPG o WebP. Ideal retrato o cuadrada."
                    previewUrl={initialImages.integrantes?.[member._key]}
                    disabled={!isSaved}
                    disabledHelp="Completa los campos y guarda para habilitar la imagen."
                    onUploaded={(image) => handleArrayImageUploaded(`${basePath}.foto`, image)}
                    onStatusMessage={pushToast}
                  />
                </div>
              </section>
            )
          })}
        </div>
      </div>

      <div className="form-section">
        <div className="row-actions row-actions--split">
          <div>
            <h2>Linea de tiempo</h2>
            <StatusBadge state={timelineState} />
            <p className="muted">Eventos históricos, orden manual y assets por evento.</p>
          </div>
          <button
            className="button button--primary"
            type="button"
            onClick={handleAddTimelineEvent}
            disabled={values.timelineSection.events.length >= MAX_TIMELINE_EVENTS}
          >
            Agregar evento
          </button>
        </div>
        <div className="toggle-row">
          <label className="checkbox-field">
            <input
              type="checkbox"
              name="timelineSection.enabled"
              checked={values.timelineSection.enabled}
              onChange={handleChange}
            />
            <span>Habilitar linea de tiempo</span>
          </label>
        </div>
        <div className="form-grid">
          <label className="form-field">
            <span className="form-label">Titulo</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('timelineSection.titulo').length > 0)}
              name="timelineSection.titulo"
              value={values.timelineSection.titulo || ''}
              onChange={handleChange}
            />
            <FieldError errors={getErrorsForField('timelineSection.titulo')} />
          </label>
          <label className="form-field form-field--full">
            <span className="form-label">Descripcion</span>
            <textarea
              className={getFieldClassName(
                'form-textarea',
                getErrorsForField('timelineSection.descripcion').length > 0
              )}
              name="timelineSection.descripcion"
              value={values.timelineSection.descripcion || ''}
              onChange={handleChange}
            />
            <FieldError errors={getErrorsForField('timelineSection.descripcion')} />
          </label>
        </div>
        <FieldError errors={getErrorsForField('timelineSection.events')} />
        <div className="array-list">
          {values.timelineSection.events.map((event, index) => {
            const basePath = `timelineSection.events.${index}`
            const isSaved = Boolean(savedArrayItems['timelineSection.events'][event._key])
            const itemState = resolveArrayItemState({
              item: event,
              baselineItems: baselineValues.timelineSection.events,
              savedItems: savedArrayItems['timelineSection.events'],
              fieldErrors,
              pathPrefix: basePath,
            })
            const itemNotice = getPendingArrayNotice(itemState, !isSaved)

            return (
              <section className={`array-item array-item--${itemState}`} data-array-item-key={event._key} key={event._key}>
                <div className="row-actions row-actions--split">
                  <div className="array-item__header">
                    <h3 className="array-item__title">Evento {index + 1}</h3>
                    <StatusBadge state={itemState} />
                  </div>
                  <ArrayItemActions
                    onMoveUp={() => {
                      setValues((current) => moveArrayItem(current, 'timelineSection.events', index, -1))
                      clearStructuralErrors()
                    }}
                    onMoveDown={() => {
                      setValues((current) => moveArrayItem(current, 'timelineSection.events', index, 1))
                      clearStructuralErrors()
                    }}
                    onRemove={() => {
                      setValues((current) => removeArrayItem(current, 'timelineSection.events', index))
                      clearStructuralErrors()
                    }}
                    isFirst={index === 0}
                    isLast={index === values.timelineSection.events.length - 1}
                  />
                </div>
                <div className="array-item__body">
                  {itemNotice ? <InlineNotice tone={itemNotice.tone} message={itemNotice.message} /> : null}
                  <div className="form-grid">
                    <label className="form-field">
                      <span className="form-label">Nombre del evento</span>
                      <input
                        className={getFieldClassName('form-input', getErrorsForField(`${basePath}.name`).length > 0)}
                        name={`${basePath}.name`}
                        value={event.name}
                        onChange={handleChange}
                      />
                      <FieldError errors={getErrorsForField(`${basePath}.name`)} />
                    </label>
                    <label className="form-field">
                      <span className="form-label">Fecha</span>
                      <input
                        className={getFieldClassName('form-input', getErrorsForField(`${basePath}.date`).length > 0)}
                        type="date"
                        name={`${basePath}.date`}
                        value={event.date}
                        onChange={handleChange}
                      />
                      <FieldError errors={getErrorsForField(`${basePath}.date`)} />
                    </label>
                    <label className="form-field">
                      <span className="form-label">Importancia</span>
                      <select
                        className={getFieldClassName(
                          'form-select',
                          getErrorsForField(`${basePath}.importance`).length > 0
                        )}
                        name={`${basePath}.importance`}
                        value={event.importance}
                        onChange={handleChange}
                      >
                        {TIMELINE_IMPORTANCE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <FieldError errors={getErrorsForField(`${basePath}.importance`)} />
                    </label>
                    <label className="form-field">
                      <span className="form-label">Icono</span>
                      <select
                        className={getFieldClassName('form-select', getErrorsForField(`${basePath}.icon`).length > 0)}
                        name={`${basePath}.icon`}
                        value={event.icon}
                        onChange={handleChange}
                      >
                        {TIMELINE_ICON_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <FieldError errors={getErrorsForField(`${basePath}.icon`)} />
                    </label>
                    <label className="form-field form-field--full">
                      <span className="form-label">Descripcion</span>
                      <textarea
                        className={getFieldClassName(
                          'form-textarea',
                          getErrorsForField(`${basePath}.descripcion`).length > 0
                        )}
                        name={`${basePath}.descripcion`}
                        value={event.descripcion || ''}
                        onChange={handleChange}
                      />
                      <FieldError errors={getErrorsForField(`${basePath}.descripcion`)} />
                    </label>
                    <label className="form-field form-field--full">
                      <span className="form-label">Enlace</span>
                      <input
                        className={getFieldClassName('form-input', getErrorsForField(`${basePath}.link`).length > 0)}
                        name={`${basePath}.link`}
                        value={event.link || ''}
                        onChange={handleChange}
                      />
                      <FieldError errors={getErrorsForField(`${basePath}.link`)} />
                    </label>
                  </div>
                  <ImageUploadField
                    bandId={bandId}
                    target={{
                      kind: 'array',
                      collection: 'timelineSection.events',
                      itemKey: event._key,
                      imageField: 'image',
                    }}
                    label="Imagen del evento"
                    help="Imagen opcional para hover o contexto visual del evento."
                    previewUrl={initialImages.timelineEvents?.[event._key]}
                    disabled={!isSaved}
                    disabledHelp="Completa los campos y guarda para habilitar la imagen."
                    onUploaded={(image) => handleArrayImageUploaded(`${basePath}.image`, image)}
                    onStatusMessage={pushToast}
                  />
                </div>
              </section>
            )
          })}
        </div>
      </div>

      <div className="form-section">
        <SectionHeading title="Contacto y redes" description="Canales de booking y redes oficiales." state={contactState} />
        <div className="form-grid">
          <label className="form-field">
            <span className="form-label">Email</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('contact.email').length > 0)}
              name="contact.email"
              value={values.contact.email || ''}
              onChange={handleChange}
              aria-invalid={getErrorsForField('contact.email').length > 0}
            />
            <FieldError errors={getErrorsForField('contact.email')} />
          </label>
          <label className="form-field">
            <span className="form-label">Telefono</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('contact.phone').length > 0)}
              name="contact.phone"
              value={values.contact.phone || ''}
              onChange={handleChange}
              aria-invalid={getErrorsForField('contact.phone').length > 0}
            />
            <FieldError errors={getErrorsForField('contact.phone')} />
          </label>
          <label className="form-field form-field--full">
            <span className="form-label">Ubicacion</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('contact.location').length > 0)}
              name="contact.location"
              value={values.contact.location || ''}
              onChange={handleChange}
              aria-invalid={getErrorsForField('contact.location').length > 0}
            />
            <FieldError errors={getErrorsForField('contact.location')} />
          </label>
          <label className="form-field">
            <span className="form-label">Instagram</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('contact.instagram').length > 0)}
              name="contact.instagram"
              value={values.contact.instagram || ''}
              onChange={handleChange}
              aria-invalid={getErrorsForField('contact.instagram').length > 0}
            />
            <FieldError errors={getErrorsForField('contact.instagram')} />
          </label>
          <label className="form-field">
            <span className="form-label">YouTube</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('contact.youtube').length > 0)}
              name="contact.youtube"
              value={values.contact.youtube || ''}
              onChange={handleChange}
              aria-invalid={getErrorsForField('contact.youtube').length > 0}
            />
            <FieldError errors={getErrorsForField('contact.youtube')} />
          </label>
          <label className="form-field">
            <span className="form-label">Facebook</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('contact.facebook').length > 0)}
              name="contact.facebook"
              value={values.contact.facebook || ''}
              onChange={handleChange}
              aria-invalid={getErrorsForField('contact.facebook').length > 0}
            />
            <FieldError errors={getErrorsForField('contact.facebook')} />
          </label>
          <label className="form-field">
            <span className="form-label">Spotify</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('contact.spotify').length > 0)}
              name="contact.spotify"
              value={values.contact.spotify || ''}
              onChange={handleChange}
              aria-invalid={getErrorsForField('contact.spotify').length > 0}
            />
            <FieldError errors={getErrorsForField('contact.spotify')} />
          </label>
          <label className="form-field">
            <span className="form-label">TikTok</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('contact.tiktok').length > 0)}
              name="contact.tiktok"
              value={values.contact.tiktok || ''}
              onChange={handleChange}
              aria-invalid={getErrorsForField('contact.tiktok').length > 0}
            />
            <FieldError errors={getErrorsForField('contact.tiktok')} />
          </label>
        </div>
      </div>

      <div className="form-section">
        <SectionHeading title="Escuchanos" description="Videos, playlists y perfiles musicales." state={listenState} />
        <div className="form-grid">
          <label className="form-field">
            <span className="form-label">Titulo de seccion</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('escuchanos.titulo').length > 0)}
              name="escuchanos.titulo"
              value={values.escuchanos.titulo || ''}
              onChange={handleChange}
            />
            <FieldError errors={getErrorsForField('escuchanos.titulo')} />
          </label>
          <label className="form-field form-field--full">
            <span className="form-label">Descripcion</span>
            <textarea
              className={getFieldClassName('form-textarea', getErrorsForField('escuchanos.descripcion').length > 0)}
              name="escuchanos.descripcion"
              value={values.escuchanos.descripcion || ''}
              onChange={handleChange}
            />
            <FieldError errors={getErrorsForField('escuchanos.descripcion')} />
          </label>
        </div>

        <section className="array-item">
          <div className="row-actions row-actions--split">
            <div>
              <h3 className="array-item__title">YouTube</h3>
              <p className="muted">Videos embebibles y enlaces públicos de la banda.</p>
            </div>
            <button className="button button--primary" type="button" onClick={handleAddYoutubeVideo}>
              Agregar video
            </button>
          </div>
          <div className="toggle-row">
            <label className="checkbox-field">
              <input
                type="checkbox"
                name="escuchanos.youtube.habilitado"
                checked={values.escuchanos.youtube.habilitado}
                onChange={handleChange}
              />
              <span>Habilitar YouTube</span>
            </label>
          </div>
          <div className="form-grid">
            <label className="form-field">
              <span className="form-label">Titulo</span>
              <input
                className={getFieldClassName(
                  'form-input',
                  getErrorsForField('escuchanos.youtube.titulo').length > 0
                )}
                name="escuchanos.youtube.titulo"
                value={values.escuchanos.youtube.titulo || ''}
                onChange={handleChange}
              />
              <FieldError errors={getErrorsForField('escuchanos.youtube.titulo')} />
            </label>
          </div>
          <div className="array-list">
            {values.escuchanos.youtube.videos.map((video, index) => {
              const basePath = `escuchanos.youtube.videos.${index}`
              const itemState = resolveArrayItemState({
                item: video,
                baselineItems: baselineValues.escuchanos.youtube.videos,
                fieldErrors,
                pathPrefix: basePath,
              })
              const itemNotice = getPendingArrayNotice(itemState)

              return (
                <section
                  className={`array-item array-item--nested array-item--${itemState}`}
                  data-array-item-key={video._key}
                  key={video._key}
                >
                  <div className="row-actions row-actions--split">
                    <div className="array-item__header">
                      <h4 className="array-item__title">Video {index + 1}</h4>
                      <StatusBadge state={itemState} />
                    </div>
                    <ArrayItemActions
                      onMoveUp={() => {
                        setValues((current) => moveArrayItem(current, 'escuchanos.youtube.videos', index, -1))
                        clearStructuralErrors()
                      }}
                      onMoveDown={() => {
                        setValues((current) => moveArrayItem(current, 'escuchanos.youtube.videos', index, 1))
                        clearStructuralErrors()
                      }}
                      onRemove={() => {
                        setValues((current) => removeArrayItem(current, 'escuchanos.youtube.videos', index))
                        clearStructuralErrors()
                      }}
                      isFirst={index === 0}
                      isLast={index === values.escuchanos.youtube.videos.length - 1}
                    />
                  </div>
                  {itemNotice ? <InlineNotice tone={itemNotice.tone} message={itemNotice.message} /> : null}
                  <div className="form-grid">
                    <label className="form-field">
                      <span className="form-label">Titulo</span>
                      <input
                        className={getFieldClassName('form-input', getErrorsForField(`${basePath}.titulo`).length > 0)}
                        name={`${basePath}.titulo`}
                        value={video.titulo}
                        onChange={handleChange}
                      />
                      <FieldError errors={getErrorsForField(`${basePath}.titulo`)} />
                    </label>
                    <label className="form-field">
                      <span className="form-label">URL</span>
                      <input
                        className={getFieldClassName('form-input', getErrorsForField(`${basePath}.url`).length > 0)}
                        name={`${basePath}.url`}
                        value={video.url}
                        onChange={handleChange}
                      />
                      <FieldError errors={getErrorsForField(`${basePath}.url`)} />
                    </label>
                    <label className="form-field form-field--full">
                      <span className="form-label">Descripcion</span>
                      <textarea
                        className={getFieldClassName(
                          'form-textarea',
                          getErrorsForField(`${basePath}.descripcion`).length > 0
                        )}
                        name={`${basePath}.descripcion`}
                        value={video.descripcion || ''}
                        onChange={handleChange}
                      />
                      <FieldError errors={getErrorsForField(`${basePath}.descripcion`)} />
                    </label>
                  </div>
                </section>
              )
            })}
          </div>
        </section>

        <section className="array-item">
          <div className="row-actions row-actions--split">
            <div>
              <h3 className="array-item__title">Spotify</h3>
              <p className="muted">Perfil principal y playlists destacadas.</p>
            </div>
            <button className="button button--primary" type="button" onClick={handleAddSpotifyPlaylist}>
              Agregar playlist
            </button>
          </div>
          <div className="toggle-row">
            <label className="checkbox-field">
              <input
                type="checkbox"
                name="escuchanos.spotify.habilitado"
                checked={values.escuchanos.spotify.habilitado}
                onChange={handleChange}
              />
              <span>Habilitar Spotify</span>
            </label>
          </div>
          <div className="form-grid">
            <label className="form-field">
              <span className="form-label">Titulo</span>
              <input
                className={getFieldClassName(
                  'form-input',
                  getErrorsForField('escuchanos.spotify.titulo').length > 0
                )}
                name="escuchanos.spotify.titulo"
                value={values.escuchanos.spotify.titulo || ''}
                onChange={handleChange}
              />
              <FieldError errors={getErrorsForField('escuchanos.spotify.titulo')} />
            </label>
            <label className="form-field">
              <span className="form-label">Perfil de Spotify</span>
              <input
                className={getFieldClassName(
                  'form-input',
                  getErrorsForField('escuchanos.spotify.perfil_url').length > 0
                )}
                name="escuchanos.spotify.perfil_url"
                value={values.escuchanos.spotify.perfil_url || ''}
                onChange={handleChange}
              />
              <FieldError errors={getErrorsForField('escuchanos.spotify.perfil_url')} />
            </label>
          </div>
          <div className="array-list">
            {values.escuchanos.spotify.playlists.map((playlist, index) => {
              const basePath = `escuchanos.spotify.playlists.${index}`
              const itemState = resolveArrayItemState({
                item: playlist,
                baselineItems: baselineValues.escuchanos.spotify.playlists,
                fieldErrors,
                pathPrefix: basePath,
              })
              const itemNotice = getPendingArrayNotice(itemState)

              return (
                <section
                  className={`array-item array-item--nested array-item--${itemState}`}
                  data-array-item-key={playlist._key}
                  key={playlist._key}
                >
                  <div className="row-actions row-actions--split">
                    <div className="array-item__header">
                      <h4 className="array-item__title">Playlist {index + 1}</h4>
                      <StatusBadge state={itemState} />
                    </div>
                    <ArrayItemActions
                      onMoveUp={() => {
                        setValues((current) => moveArrayItem(current, 'escuchanos.spotify.playlists', index, -1))
                        clearStructuralErrors()
                      }}
                      onMoveDown={() => {
                        setValues((current) => moveArrayItem(current, 'escuchanos.spotify.playlists', index, 1))
                        clearStructuralErrors()
                      }}
                      onRemove={() => {
                        setValues((current) => removeArrayItem(current, 'escuchanos.spotify.playlists', index))
                        clearStructuralErrors()
                      }}
                      isFirst={index === 0}
                      isLast={index === values.escuchanos.spotify.playlists.length - 1}
                    />
                  </div>
                  {itemNotice ? <InlineNotice tone={itemNotice.tone} message={itemNotice.message} /> : null}
                  <div className="form-grid">
                    <label className="form-field">
                      <span className="form-label">Titulo</span>
                      <input
                        className={getFieldClassName(
                          'form-input',
                          getErrorsForField(`${basePath}.titulo`).length > 0
                        )}
                        name={`${basePath}.titulo`}
                        value={playlist.titulo}
                        onChange={handleChange}
                      />
                      <FieldError errors={getErrorsForField(`${basePath}.titulo`)} />
                    </label>
                    <label className="form-field">
                      <span className="form-label">URL</span>
                      <input
                        className={getFieldClassName('form-input', getErrorsForField(`${basePath}.url`).length > 0)}
                        name={`${basePath}.url`}
                        value={playlist.url}
                        onChange={handleChange}
                      />
                      <FieldError errors={getErrorsForField(`${basePath}.url`)} />
                    </label>
                    <label className="form-field form-field--full">
                      <span className="form-label">Descripcion</span>
                      <textarea
                        className={getFieldClassName(
                          'form-textarea',
                          getErrorsForField(`${basePath}.descripcion`).length > 0
                        )}
                        name={`${basePath}.descripcion`}
                        value={playlist.descripcion || ''}
                        onChange={handleChange}
                      />
                      <FieldError errors={getErrorsForField(`${basePath}.descripcion`)} />
                    </label>
                  </div>
                </section>
              )
            })}
          </div>
        </section>
      </div>

      <div className="form-section">
        <SectionHeading
          title="Lanzamiento destacado"
          description="Bloque principal para destacar el release activo."
          state={featuredReleaseState}
        />
        <div className="asset-grid">
          <ImageUploadField
            bandId={bandId}
            target={{kind: 'field', field: 'featuredReleaseCover'}}
            label="Portada destacada"
            help="Imagen cuadrada para el bloque principal de musica."
            previewUrl={initialImages.featuredReleaseCover}
            onStatusMessage={pushToast}
          />
        </div>
        <div className="form-grid">
          <label className="form-field">
            <span className="form-label">Etiqueta</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('featuredRelease.eyebrow').length > 0)}
              name="featuredRelease.eyebrow"
              value={values.featuredRelease.eyebrow || ''}
              onChange={handleChange}
            />
            <FieldError errors={getErrorsForField('featuredRelease.eyebrow')} />
          </label>
          <label className="form-field">
            <span className="form-label">Titulo</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('featuredRelease.title').length > 0)}
              name="featuredRelease.title"
              value={values.featuredRelease.title || ''}
              onChange={handleChange}
            />
            <FieldError errors={getErrorsForField('featuredRelease.title')} />
          </label>
          <label className="form-field form-field--full">
            <span className="form-label">Descripcion</span>
            <textarea
              className={getFieldClassName(
                'form-textarea',
                getErrorsForField('featuredRelease.description').length > 0
              )}
              name="featuredRelease.description"
              value={values.featuredRelease.description || ''}
              onChange={handleChange}
            />
            <FieldError errors={getErrorsForField('featuredRelease.description')} />
          </label>
          <label className="form-field">
            <span className="form-label">Spotify URL</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('featuredRelease.spotifyUrl').length > 0)}
              name="featuredRelease.spotifyUrl"
              value={values.featuredRelease.spotifyUrl || ''}
              onChange={handleChange}
            />
            <FieldError errors={getErrorsForField('featuredRelease.spotifyUrl')} />
          </label>
          <label className="form-field">
            <span className="form-label">YouTube URL</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('featuredRelease.youtubeUrl').length > 0)}
              name="featuredRelease.youtubeUrl"
              value={values.featuredRelease.youtubeUrl || ''}
              onChange={handleChange}
            />
            <FieldError errors={getErrorsForField('featuredRelease.youtubeUrl')} />
          </label>
          <label className="form-field form-field--full">
            <span className="form-label">Apple Music URL</span>
            <input
              className={getFieldClassName(
                'form-input',
                getErrorsForField('featuredRelease.appleMusicUrl').length > 0
              )}
              name="featuredRelease.appleMusicUrl"
              value={values.featuredRelease.appleMusicUrl || ''}
              onChange={handleChange}
            />
            <FieldError errors={getErrorsForField('featuredRelease.appleMusicUrl')} />
          </label>
        </div>
      </div>

      <div className="form-section">
        <div className="row-actions row-actions--split">
          <SectionHeading
            title="Shows"
            description="Fechas, venues y enlaces de entradas para la pagina publica."
            state={showsState}
          />
          <button className="button button--primary" type="button" onClick={handleAddShow}>
            Agregar show
          </button>
        </div>
        <div className="form-grid">
          <label className="form-field">
            <span className="form-label">Titulo</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('showsSection.titulo').length > 0)}
              name="showsSection.titulo"
              value={values.showsSection.titulo || ''}
              onChange={handleChange}
            />
            <FieldError errors={getErrorsForField('showsSection.titulo')} />
          </label>
          <label className="form-field form-field--full">
            <span className="form-label">Descripcion</span>
            <textarea
              className={getFieldClassName('form-textarea', getErrorsForField('showsSection.descripcion').length > 0)}
              name="showsSection.descripcion"
              value={values.showsSection.descripcion || ''}
              onChange={handleChange}
            />
            <FieldError errors={getErrorsForField('showsSection.descripcion')} />
          </label>
        </div>
        <div className="array-list">
          {values.showsSection.shows.map((show, index) => {
            const basePath = `showsSection.shows.${index}`
            const itemState = resolveArrayItemState({
              item: show,
              baselineItems: baselineValues.showsSection.shows,
              fieldErrors,
              pathPrefix: basePath,
            })
            const itemNotice = getPendingArrayNotice(itemState)

            return (
              <section
                className={`array-item array-item--nested array-item--${itemState}`}
                data-array-item-key={show._key}
                key={show._key}
              >
                <div className="row-actions row-actions--split">
                  <div className="array-item__header">
                    <h4 className="array-item__title">Show {index + 1}</h4>
                    <StatusBadge state={itemState} />
                  </div>
                  <ArrayItemActions
                    onMoveUp={() => {
                      setValues((current) => moveArrayItem(current, 'showsSection.shows', index, -1))
                      clearStructuralErrors()
                    }}
                    onMoveDown={() => {
                      setValues((current) => moveArrayItem(current, 'showsSection.shows', index, 1))
                      clearStructuralErrors()
                    }}
                    onRemove={() => {
                      setValues((current) => removeArrayItem(current, 'showsSection.shows', index))
                      clearStructuralErrors()
                    }}
                    isFirst={index === 0}
                    isLast={index === values.showsSection.shows.length - 1}
                  />
                </div>
                {itemNotice ? <InlineNotice tone={itemNotice.tone} message={itemNotice.message} /> : null}
                <div className="form-grid">
                  <label className="form-field">
                    <span className="form-label">Fecha</span>
                    <input
                      className={getFieldClassName('form-input', getErrorsForField(`${basePath}.date`).length > 0)}
                      name={`${basePath}.date`}
                      value={show.date}
                      onChange={handleChange}
                      type="date"
                    />
                    <FieldError errors={getErrorsForField(`${basePath}.date`)} />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Venue</span>
                    <input
                      className={getFieldClassName('form-input', getErrorsForField(`${basePath}.venue`).length > 0)}
                      name={`${basePath}.venue`}
                      value={show.venue}
                      onChange={handleChange}
                    />
                    <FieldError errors={getErrorsForField(`${basePath}.venue`)} />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Ubicacion</span>
                    <input
                      className={getFieldClassName('form-input', getErrorsForField(`${basePath}.location`).length > 0)}
                      name={`${basePath}.location`}
                      value={show.location}
                      onChange={handleChange}
                    />
                    <FieldError errors={getErrorsForField(`${basePath}.location`)} />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Estado</span>
                    <select
                      className={getFieldClassName('form-select', getErrorsForField(`${basePath}.status`).length > 0)}
                      name={`${basePath}.status`}
                      value={show.status}
                      onChange={handleChange}
                    >
                      <option value="tickets">Entradas</option>
                      <option value="sold-out">Agotado</option>
                      <option value="soon">Proximamente</option>
                    </select>
                    <FieldError errors={getErrorsForField(`${basePath}.status`)} />
                  </label>
                  <label className="form-field form-field--full">
                    <span className="form-label">URL entradas</span>
                    <input
                      className={getFieldClassName('form-input', getErrorsForField(`${basePath}.ticketUrl`).length > 0)}
                      name={`${basePath}.ticketUrl`}
                      value={show.ticketUrl || ''}
                      onChange={handleChange}
                    />
                    <FieldError errors={getErrorsForField(`${basePath}.ticketUrl`)} />
                  </label>
                </div>
              </section>
            )
          })}
        </div>
      </div>

      <div className="form-section">
        <div className="row-actions row-actions--split">
          <SectionHeading
            title="Galeria"
            description="Imagenes destacadas para el archivo visual de la banda."
            state={galleryState}
          />
          <button className="button button--primary" type="button" onClick={handleAddGalleryItem}>
            Agregar imagen
          </button>
        </div>
        <div className="form-grid">
          <label className="form-field">
            <span className="form-label">Titulo</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('gallerySection.titulo').length > 0)}
              name="gallerySection.titulo"
              value={values.gallerySection.titulo || ''}
              onChange={handleChange}
            />
            <FieldError errors={getErrorsForField('gallerySection.titulo')} />
          </label>
        </div>
        <div className="array-list">
          {values.gallerySection.items.map((item, index) => {
            const basePath = `gallerySection.items.${index}`
            const isSaved = Boolean(savedArrayItems['gallerySection.items'][item._key])
            const itemState = resolveArrayItemState({
              item,
              baselineItems: baselineValues.gallerySection.items,
              savedItems: savedArrayItems['gallerySection.items'],
              fieldErrors,
              pathPrefix: basePath,
            })
            const itemNotice = getPendingArrayNotice(itemState, !isSaved)

            return (
              <section
                className={`array-item array-item--nested array-item--${itemState}`}
                data-array-item-key={item._key}
                key={item._key}
              >
                <div className="row-actions row-actions--split">
                  <div className="array-item__header">
                    <h4 className="array-item__title">Imagen {index + 1}</h4>
                    <StatusBadge state={itemState} />
                  </div>
                  <ArrayItemActions
                    onMoveUp={() => {
                      setValues((current) => moveArrayItem(current, 'gallerySection.items', index, -1))
                      clearStructuralErrors()
                    }}
                    onMoveDown={() => {
                      setValues((current) => moveArrayItem(current, 'gallerySection.items', index, 1))
                      clearStructuralErrors()
                    }}
                    onRemove={() => {
                      setValues((current) => removeArrayItem(current, 'gallerySection.items', index))
                      clearStructuralErrors()
                    }}
                    isFirst={index === 0}
                    isLast={index === values.gallerySection.items.length - 1}
                  />
                </div>
                {itemNotice ? <InlineNotice tone={itemNotice.tone} message={itemNotice.message} /> : null}
                <div className="asset-grid">
                  <ImageUploadField
                    bandId={bandId}
                    target={{
                      kind: 'array',
                      collection: 'gallerySection.items',
                      itemKey: item._key,
                      imageField: 'image',
                    }}
                    label="Imagen"
                    help="Sube la imagen antes de guardar la galeria."
                    previewUrl={initialImages.galleryItems?.[item._key]}
                    disabled={!isSaved}
                    disabledHelp="Completa los campos y guarda para habilitar la imagen."
                    onUploaded={(image) => {
                      handleArrayImageUploaded(`${basePath}.image`, image)
                    }}
                    onStatusMessage={pushToast}
                  />
                </div>
                <div className="form-grid">
                  <label className="form-field">
                    <span className="form-label">Alt</span>
                    <input
                      className={getFieldClassName('form-input', getErrorsForField(`${basePath}.alt`).length > 0)}
                      name={`${basePath}.alt`}
                      value={item.alt || ''}
                      onChange={handleChange}
                    />
                    <FieldError errors={getErrorsForField(`${basePath}.alt`)} />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Caption</span>
                    <input
                      className={getFieldClassName('form-input', getErrorsForField(`${basePath}.caption`).length > 0)}
                      name={`${basePath}.caption`}
                      value={item.caption || ''}
                      onChange={handleChange}
                    />
                    <FieldError errors={getErrorsForField(`${basePath}.caption`)} />
                  </label>
                  <label className="form-field form-field--full">
                    <span className="form-label">Enlace</span>
                    <input
                      className={getFieldClassName('form-input', getErrorsForField(`${basePath}.link`).length > 0)}
                      name={`${basePath}.link`}
                      value={item.link || ''}
                      onChange={handleChange}
                    />
                    <FieldError errors={getErrorsForField(`${basePath}.link`)} />
                  </label>
                </div>
              </section>
            )
          })}
        </div>
      </div>

      <div className="form-section">
        <SectionHeading title="SEO" description="Metadatos para buscadores y previews." state={seoState} />
        <div className="form-grid">
          <label className="form-field">
            <span className="form-label">Titulo SEO</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('seo.title').length > 0)}
              name="seo.title"
              value={values.seo.title || ''}
              onChange={handleChange}
              aria-invalid={getErrorsForField('seo.title').length > 0}
            />
            <FieldError errors={getErrorsForField('seo.title')} />
          </label>
          <label className="form-field form-field--full">
            <span className="form-label">Descripcion SEO</span>
            <textarea
              className={getFieldClassName('form-textarea', getErrorsForField('seo.description').length > 0)}
              name="seo.description"
              value={values.seo.description || ''}
              onChange={handleChange}
              aria-invalid={getErrorsForField('seo.description').length > 0}
            />
            <FieldError errors={getErrorsForField('seo.description')} />
          </label>
        </div>
      </div>

    </form>
  )
}
