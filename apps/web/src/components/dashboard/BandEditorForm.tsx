'use client'

import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent} from 'react'

import {BandEditorPreview} from '@/components/dashboard/BandEditorPreview'
import {SectionOrderEditor} from '@/components/dashboard/SectionOrderEditor'
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
  type BandEditorInternalKitLink,
  type BandEditorMember,
  type BandEditorShow,
  type BandEditorSpotifyPlaylist,
  type BandEditorTimelineEvent,
  type BandEditorValues,
  type BandEditorYoutubeVideo,
  type SavedArrayItems,
  type StoredBandEditorSnapshot,
} from '@/lib/bands/editor'
import {
  MOBILE_EDITOR_SECTIONS,
  getMobileEditorHref,
  type MobileEditorSectionKey,
} from '@/components/dashboard/mobile-editor-sections'
import {
  updateBandRequest,
  uploadBandAssetRequest,
  type DashboardValidationIssue,
} from '@/lib/dashboard/api'
import type {SanityImage} from '@/types/band'
import type {PublicBand} from '@/types/band'

type EditorPhase = 'pristine' | 'dirty' | 'saving' | 'saved' | 'error'
type EditorMode = 'public' | 'kit'
type PreviewViewport = 'desktop' | 'mobile'
type EditorSectionState = 'saved' | 'pending' | 'error'

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
    const typedError = error as DashboardValidationIssue

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

    const response = await uploadBandAssetRequest(bandId, formData)
    const body = response.body

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

    setUploadedPreview(body?.image?.url || URL.createObjectURL(file))
    const message = 'Imagen subida correctamente.'
    setState({
      status: 'success',
      message,
    })
    onStatusMessage?.('success', message)
    input.value = ''
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

  const day = `${date.getDate()}`.padStart(2, '0')
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const year = `${date.getFullYear()}`.slice(-2)
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}`
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

function parseKeywordList(rawValue: string) {
  return rawValue
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)
}

function combineSectionStates(...states: EditorSectionState[]): EditorSectionState {
  if (states.includes('error')) {
    return 'error'
  }

  if (states.includes('pending')) {
    return 'pending'
  }

  return 'saved'
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
  previewBandBase,
  initialServerSavedAt,
  routeSection = 'overview',
  canManage = false,
}: {
  bandId: string
  initialValues: BandEditorValues
  initialImages: BandEditorImages
  previewBandBase?: PublicBand | null
  initialServerSavedAt?: string | null
  routeSection?: MobileEditorSectionKey
  canManage?: boolean
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
  const [editorMode, setEditorMode] = useState<EditorMode>('public')
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>(() =>
    typeof window !== 'undefined' && window.innerWidth <= 960 ? 'mobile' : 'desktop'
  )
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

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

  const handleAddInternalKitLink = () => {
    const itemKey = createBandEditorKey('kit')
    setValues((current) =>
      appendArrayItem(current, 'internalKit.keyLinks', {
        _key: itemKey,
        label: '',
        url: '',
        kind: 'other',
      } satisfies BandEditorInternalKitLink)
    )
    clearStructuralErrors()
    setSubmitError(null)
    notifyArrayItemAdded(itemKey, 'Link interno agregado.')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setSubmitError(null)

    const response = await updateBandRequest(bandId, values)
    const body = response.body

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
    setLastSavedAt(body?.band?.syncedAt || new Date().toISOString())
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
    pathPrefixes: ['about.title', 'about.content'],
  })
  const membersState = resolveSectionState({
    values,
    baselineValues,
    fieldErrors,
    pathPrefixes: ['about.integrantes'],
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
  const presentationState = resolveSectionState({
    values,
    baselineValues,
    fieldErrors,
    pathPrefixes: ['presentation'],
  })
  const internalKitState = resolveSectionState({
    values,
    baselineValues,
    fieldErrors,
    pathPrefixes: ['internalKit'],
  })
  const seoState = resolveSectionState({
    values,
    baselineValues,
    fieldErrors,
    pathPrefixes: ['seo'],
  })
  const currentRouteSection = routeSection
  const isOverviewRoute = currentRouteSection === 'overview'
  const isPreviewRoute = currentRouteSection === 'preview'
  const showDesktopFullEditor = isOverviewRoute
  const showGeneralSection = showDesktopFullEditor || currentRouteSection === 'general' || currentRouteSection === 'images'
  const showPresentationSection = showDesktopFullEditor || currentRouteSection === 'general'
  const showHeroSection = showDesktopFullEditor || currentRouteSection === 'bio' || currentRouteSection === 'images'
  const showAboutSection = showDesktopFullEditor || currentRouteSection === 'bio' || currentRouteSection === 'images'
  const showMembersSection = showDesktopFullEditor || currentRouteSection === 'members'
  const showTimelineSection = showDesktopFullEditor || currentRouteSection === 'bio'
  const showContactSection = showDesktopFullEditor || currentRouteSection === 'social'
  const showListenSection = showDesktopFullEditor || currentRouteSection === 'social'
  const showFeaturedSection =
    showDesktopFullEditor || currentRouteSection === 'social' || currentRouteSection === 'images'
  const showShowsSection = showDesktopFullEditor || currentRouteSection === 'shows'
  const showGallerySection = showDesktopFullEditor || currentRouteSection === 'images'
  const showSeoSection = showDesktopFullEditor || currentRouteSection === 'general' || currentRouteSection === 'social'
  const effectiveEditorMode: EditorMode = isOverviewRoute ? editorMode : 'public'

  useEffect(() => {
    if (effectiveEditorMode !== 'public' && isPreviewOpen) {
      setIsPreviewOpen(false)
    }
  }, [effectiveEditorMode, isPreviewOpen])

  const mobileEditorSectionKeys = [
    'general',
    'images',
    'bio',
    'members',
    'social',
    'shows',
    ...(canManage ? (['team'] as const) : []),
    'preview',
  ] satisfies MobileEditorSectionKey[]

  const mobileEditorSections = mobileEditorSectionKeys.map((section) => ({
      key: section,
      href: getMobileEditorHref(bandId, section),
      ...MOBILE_EDITOR_SECTIONS[section],
      state:
        section === 'general'
          ? combineSectionStates(identityState, presentationState, seoState)
          : section === 'images'
            ? combineSectionStates(identityState, heroState, aboutState, featuredReleaseState, galleryState)
            : section === 'bio'
              ? combineSectionStates(heroState, aboutState, timelineState)
              : section === 'members'
                ? membersState
                : section === 'social'
                  ? combineSectionStates(contactState, listenState, featuredReleaseState, seoState)
                  : section === 'shows'
                    ? showsState
                    : section === 'team'
                      ? 'saved'
                    : combineSectionStates(
                        submitError ? 'error' : 'saved',
                        hasPendingChanges ? 'pending' : 'saved'
                      ),
    }))

  const lastSavedLabel = formatEditorTimestamp(lastSavedAt)
  const restoredDraftLabel = formatEditorTimestamp(lastRestoredDraftAt)
  const ignoredDraftLabel = formatEditorTimestamp(ignoredDraftAt)
  const pendingSectionCount = [
    identityState,
    heroState,
    aboutState,
    membersState,
    timelineState,
    contactState,
    listenState,
    featuredReleaseState,
    showsState,
    galleryState,
    presentationState,
    internalKitState,
    seoState,
  ].filter((state) => state !== 'saved').length
  const pendingSummary =
    pendingSectionCount === 0
      ? 'Sin cambios pendientes'
      : pendingSectionCount === 1
        ? '1 seccion con cambios pendientes'
        : `${pendingSectionCount} secciones con cambios pendientes`
  const stateLabel =
    editorPhase === 'saving'
      ? 'Guardando'
      : editorPhase === 'error'
        ? 'Error al guardar'
        : editorPhase === 'dirty'
          ? 'Cambios pendientes'
          : editorPhase === 'saved'
            ? 'Todo guardado'
            : 'Sin cambios'
  const publicationSections = [
    {href: '#editor-hero', label: 'Hero'},
    {href: '#editor-about', label: 'Historia'},
    {href: '#editor-members', label: 'Integrantes'},
    {href: '#editor-featured', label: 'Musica'},
    {href: '#editor-shows', label: 'Shows'},
    {href: '#editor-timeline', label: 'Timeline'},
    {href: '#editor-gallery', label: 'Galeria'},
    {href: '#editor-contact', label: 'Contacto'},
  ]

  return (
    <form
      className={`editor-workspace${isOverviewRoute ? ' editor-workspace--overview' : ' editor-workspace--section'}`}
      data-editor-route-section={currentRouteSection}
      onSubmit={handleSubmit}
    >
      <EditorToastStack toasts={toasts} onDismiss={dismissToast} />
      <div className="editor-workspace__main">
        <div className="dashboard-card editor-main-card">
          <div className={`editor-savebar editor-savebar--${editorPhase}`} aria-live="polite">
            <div className="editor-savebar__summary">
              <div className="editor-savebar__status" role="status">
                <span className={`editor-savebar__dot editor-savebar__dot--${editorPhase}`} />
                <strong>{stateLabel}</strong>
              </div>
            </div>
            <div className="editor-savebar__meta">
              <span className={`editor-savebar__meta-item${pendingSectionCount > 0 ? ' editor-savebar__meta-item--pending' : ''}`}>
                {pendingSectionCount > 0 ? pendingSummary : 'Todo al dia'}
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
              {effectiveEditorMode === 'public' ? (
                <button
                  className="button editor-savebar__button editor-savebar__button--secondary"
                  type="button"
                  onClick={() => {
                    setIsPreviewOpen(true)
                  }}
                >
                  Vista previa
                </button>
              ) : null}
              <button
                className="button button--primary editor-savebar__button"
                disabled={isSaving || !hasPendingChanges}
                type="submit"
              >
                {isSaving ? 'Guardando...' : hasPendingChanges ? 'Guardar cambios' : 'Sin cambios'}
              </button>
            </div>
          </div>

          {isOverviewRoute ? (
            <div className="editor-mobile-route-overview">
              <div className="editor-mobile-section-card">
                <div>
                  <p className="eyebrow">Editor mobile</p>
                  <h2 className="editor-mobile-section-card__title">Indice de secciones</h2>
                  <p className="muted">
                    En celular entra primero por una lista clara. Cada bloque abre una vista enfocada en vez de
                    cargar todo el formulario junto.
                  </p>
                </div>
                <div className="editor-mobile-route-grid">
                  {mobileEditorSections.map((section) => (
                    <Link className="editor-route-card" href={section.href} key={section.key}>
                      <div className="editor-route-card__copy">
                        <span className="editor-route-card__label">{section.label}</span>
                        <strong>{section.title}</strong>
                        <p>{section.description}</p>
                      </div>
                      <StatusBadge state={section.state} />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {!isOverviewRoute ? (
            <div className="editor-mobile-section-card editor-mobile-section-card--route-nav">
              <div>
                <p className="eyebrow">Editor mobile</p>
                <h2 className="editor-mobile-section-card__title">Cambiar de seccion</h2>
              </div>
              <div className="editor-mobile-route-pills">
                <Link
                  className="editor-route-pill editor-route-pill--overview"
                  href={getMobileEditorHref(bandId, 'overview')}
                >
                  Indice
                </Link>
                {mobileEditorSections.map((section) => (
                  <Link
                    className={`editor-route-pill${section.key === currentRouteSection ? ' editor-route-pill--active' : ''}`}
                    href={section.href}
                    key={section.key}
                  >
                    <span>{section.label}</span>
                    <StatusBadge state={section.state} />
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {isOverviewRoute ? (
            <div className="editor-mode-switch editor-mode-switch--desktop" role="tablist" aria-label="Modo del editor">
              <button
                className={`button${editorMode === 'public' ? ' button--primary' : ''}`}
                type="button"
                onClick={() => {
                  setEditorMode('public')
                }}
              >
                Contenido publico
              </button>
              <button
                className={`button${editorMode === 'kit' ? ' button--primary' : ''}`}
                type="button"
                onClick={() => {
                  setEditorMode('kit')
                }}
              >
                Kit interno
              </button>
            </div>
          ) : null}

          {effectiveEditorMode === 'public' ? (
            <>
              {!isPreviewRoute ? (
                <>
                  <div className={`editor-publication-map${isOverviewRoute ? ' editor-publication-map--desktop' : ''}`}>
                    <div>
                      <p className="eyebrow">Vista previa de publicacion</p>
                      <h2 className="editor-publication-map__title">Que bloques impactan en la web publica</h2>
                      <p className="muted">
                        Usa estos accesos rapidos para editar cada seccion sabiendo exactamente donde se vera.
                      </p>
                    </div>
                    <div className="editor-publication-map__links">
                      {publicationSections.map((section) => (
                        <a className="editor-publication-map__link" href={section.href} key={section.href}>
                          {section.label}
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className={`form-grid${isOverviewRoute ? ' editor-desktop-only' : ''}`}>
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
                </>
              ) : null}
            </>
          ) : null}

      <div
        className={isOverviewRoute ? 'editor-desktop-only' : undefined}
        hidden={effectiveEditorMode !== 'public'}
        aria-hidden={effectiveEditorMode !== 'public'}
      >
      {showGeneralSection ? (
      <div className="form-section" id="editor-identity">
        <SectionHeading
          title="Identidad visual"
          description="Paleta, logo y favicon que impactan la marca publica y la pestana del navegador."
          state={identityState}
        />
        <div className="asset-grid">
          <ImageUploadField
            bandId={bandId}
            target={{kind: 'field', field: 'logo'}}
            label="Logo"
            help="Se vera como identidad principal de la banda en la pagina publica. PNG, JPG o WebP."
            previewUrl={initialImages.logo}
            onStatusMessage={pushToast}
          />
          <ImageUploadField
            bandId={bandId}
            target={{kind: 'field', field: 'logoFavicon'}}
            label="Favicon"
            help="Se usara en la pestana del navegador para la pagina publica de la banda."
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
      ) : null}

      {showPresentationSection ? (
      <div className="form-section" id="editor-presentation">
        <SectionHeading
          title="Orden de la pagina publica"
          description="Hero queda fijo primero. Reordena el resto de las secciones visibles con drag and drop o con los botones."
          state={presentationState}
        />
        <SectionOrderEditor
          value={values.presentation.sectionOrder}
          onChange={(nextValue) => {
            setValues((current) => setValueAtPath(current, 'presentation.sectionOrder', nextValue))
            setFieldErrors((current) => clearFieldErrorByPath(current, 'presentation.sectionOrder'))
            setSubmitError(null)
          }}
        />
      </div>
      ) : null}

      {showHeroSection ? (
      <div className="form-section" id="editor-hero">
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
          <div className="form-field form-field--full">
            <span className="form-label">Tarjeta lateral</span>
            <label className="checkbox-field">
              <input
                type="checkbox"
                name="hero.showSpotlightCard"
                checked={values.hero.showSpotlightCard}
                onChange={handleChange}
              />
              <span>Mostrar tarjeta lateral del hero</span>
            </label>
            <p className="muted">
              Muestra u oculta la tarjeta destacada del costado derecho de la cabecera publica.
            </p>
          </div>
        </div>
      </div>
      ) : null}

      {showAboutSection ? (
      <div className="form-section" id="editor-about">
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
      ) : null}

      {showMembersSection ? (
      <div className="form-section" id="editor-members">
        <div className="row-actions row-actions--split">
          <SectionHeading
            title="Integrantes"
            description="Alta, orden y fotos por integrante para la pagina publica."
            state={membersState}
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
      ) : null}

      {showTimelineSection ? (
      <div className="form-section" id="editor-timeline">
        <div className="row-actions row-actions--split">
          <div>
            <h2>Linea de tiempo</h2>
            <StatusBadge state={timelineState} />
            <p className="muted">Eventos historicos para la web publica. Solo aparece si esta habilitada.</p>
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
                      <p className="muted">Cambia el peso visual del evento en la linea de tiempo publica.</p>
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
      ) : null}

      {showContactSection ? (
      <div className="form-section" id="editor-contact">
        <SectionHeading
          title="Contacto y redes"
          description="Canales de booking y redes oficiales que se muestran en la pagina publica."
          state={contactState}
        />
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
            <span className="form-label">X / Twitter</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('contact.twitter').length > 0)}
              name="contact.twitter"
              value={values.contact.twitter || ''}
              onChange={handleChange}
              aria-invalid={getErrorsForField('contact.twitter').length > 0}
            />
            <FieldError errors={getErrorsForField('contact.twitter')} />
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
      ) : null}

      {showListenSection ? (
      <div className="form-section" id="editor-listen">
        <SectionHeading
          title="Escuchanos"
          description="Videos, playlists y perfiles musicales. Estos bloques aparecen solo si estan habilitados."
          state={listenState}
        />
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
              <p className="muted">Videos y enlaces publicos que se listan en la seccion Escuchanos.</p>
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
              <p className="muted">Perfil principal y playlists destacadas para la web publica.</p>
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
            <p className="form-help form-help--full">
              Usa el link publico del artista o perfil. Ejemplos:{' '}
              <code>open.spotify.com/artist/...</code> o <code>open.spotify.com/intl-es/artist/...</code>
            </p>
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
                    <p className="form-help form-help--full">
                      Acepta links publicos de Spotify de <code>album</code>, <code>playlist</code> o{' '}
                      <code>track</code>, incluso con formato <code>intl-es</code>.
                    </p>
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
      ) : null}

      {showFeaturedSection ? (
      <div className="form-section" id="editor-featured">
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
            help="Imagen cuadrada para el bloque principal de musica en la pagina publica."
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
            <p className="muted">Pega un link publico de track, album o playlist de Spotify.</p>
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
      ) : null}

      {showShowsSection ? (
      <div className="form-section" id="editor-shows">
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
      ) : null}

      {showGallerySection ? (
      <div className="form-section" id="editor-gallery">
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
      ) : null}

      {showSeoSection ? (
      <div className="form-section" id="editor-seo">
        <SectionHeading
          title="SEO"
          description="Metadatos para buscadores, previews y la pestana de la pagina publica."
          state={seoState}
        />
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
          <label className="form-field form-field--full">
            <span className="form-label">Palabras clave SEO</span>
            <input
              className={getFieldClassName('form-input', getErrorsForField('seo.keywords').length > 0)}
              name="seo.keywords"
              value={(values.seo.keywords || []).join(', ')}
              onChange={(event) => {
                const keywords = parseKeywordList(event.currentTarget.value)
                setValues((current) => setValueAtPath(current, 'seo.keywords', keywords))
                setFieldErrors((current) => clearFieldErrorByPath(current, 'seo.keywords'))
                setSubmitError(null)
              }}
              aria-invalid={getErrorsForField('seo.keywords').length > 0}
              placeholder="metal argentino, doom, banda en vivo"
            />
            <FieldError errors={getErrorsForField('seo.keywords')} />
            <p className="muted">Separalas con comas. Se usan en metadata, no como texto visible.</p>
          </label>
        </div>
      </div>
      ) : null}
      </div>

      <div className={isOverviewRoute ? 'editor-desktop-only' : undefined} hidden={effectiveEditorMode !== 'kit'} aria-hidden={effectiveEditorMode !== 'kit'}>
        <div className="form-section" id="editor-internal-kit">
          <div className="row-actions row-actions--split">
            <SectionHeading
              title="Kit interno"
              description="Resumen, contacto y links privados para ordenar la biblioteca interna de la banda."
              state={internalKitState}
            />
            <button className="button button--primary" type="button" onClick={handleAddInternalKitLink}>
              Agregar link
            </button>
          </div>
          <div className="form-grid">
            <label className="form-field form-field--full">
              <span className="form-label">Resumen corto</span>
              <textarea
                className={getFieldClassName('form-textarea', getErrorsForField('internalKit.shortPitch').length > 0)}
                name="internalKit.shortPitch"
                value={values.internalKit.shortPitch || ''}
                onChange={handleChange}
              />
              <FieldError errors={getErrorsForField('internalKit.shortPitch')} />
            </label>
            <label className="form-field">
              <span className="form-label">Nombre de contacto</span>
              <input
                className={getFieldClassName('form-input', getErrorsForField('internalKit.contactName').length > 0)}
                name="internalKit.contactName"
                value={values.internalKit.contactName || ''}
                onChange={handleChange}
              />
              <FieldError errors={getErrorsForField('internalKit.contactName')} />
            </label>
            <label className="form-field">
              <span className="form-label">Email de contacto</span>
              <input
                className={getFieldClassName('form-input', getErrorsForField('internalKit.contactEmail').length > 0)}
                name="internalKit.contactEmail"
                value={values.internalKit.contactEmail || ''}
                onChange={handleChange}
              />
              <FieldError errors={getErrorsForField('internalKit.contactEmail')} />
            </label>
            <label className="form-field">
              <span className="form-label">Telefono de contacto</span>
              <input
                className={getFieldClassName('form-input', getErrorsForField('internalKit.contactPhone').length > 0)}
                name="internalKit.contactPhone"
                value={values.internalKit.contactPhone || ''}
                onChange={handleChange}
              />
              <FieldError errors={getErrorsForField('internalKit.contactPhone')} />
            </label>
            <label className="form-field form-field--full">
              <span className="form-label">Notas internas</span>
              <textarea
                className={getFieldClassName('form-textarea', getErrorsForField('internalKit.bookingNotes').length > 0)}
                name="internalKit.bookingNotes"
                value={values.internalKit.bookingNotes || ''}
                onChange={handleChange}
              />
              <FieldError errors={getErrorsForField('internalKit.bookingNotes')} />
            </label>
          </div>
          <div className="array-list">
            {values.internalKit.keyLinks.map((link, index) => {
              const basePath = `internalKit.keyLinks.${index}`
              const itemState = resolveArrayItemState({
                item: link,
                baselineItems: baselineValues.internalKit.keyLinks,
                fieldErrors,
                pathPrefix: basePath,
              })
              const itemNotice = getPendingArrayNotice(itemState)

              return (
                <section
                  className={`array-item array-item--nested array-item--${itemState}`}
                  data-array-item-key={link._key}
                  key={link._key}
                >
                  <div className="row-actions row-actions--split">
                    <div className="array-item__header">
                      <h4 className="array-item__title">Link interno {index + 1}</h4>
                      <StatusBadge state={itemState} />
                    </div>
                    <ArrayItemActions
                      onMoveUp={() => {
                        setValues((current) => moveArrayItem(current, 'internalKit.keyLinks', index, -1))
                        clearStructuralErrors()
                      }}
                      onMoveDown={() => {
                        setValues((current) => moveArrayItem(current, 'internalKit.keyLinks', index, 1))
                        clearStructuralErrors()
                      }}
                      onRemove={() => {
                        setValues((current) => removeArrayItem(current, 'internalKit.keyLinks', index))
                        clearStructuralErrors()
                      }}
                      isFirst={index === 0}
                      isLast={index === values.internalKit.keyLinks.length - 1}
                    />
                  </div>
                  {itemNotice ? <InlineNotice tone={itemNotice.tone} message={itemNotice.message} /> : null}
                  <div className="form-grid">
                    <label className="form-field">
                      <span className="form-label">Etiqueta</span>
                      <input
                        className={getFieldClassName('form-input', getErrorsForField(`${basePath}.label`).length > 0)}
                        name={`${basePath}.label`}
                        value={link.label}
                        onChange={handleChange}
                      />
                      <FieldError errors={getErrorsForField(`${basePath}.label`)} />
                    </label>
                    <label className="form-field">
                      <span className="form-label">Tipo</span>
                      <select
                        className={getFieldClassName('form-select', getErrorsForField(`${basePath}.kind`).length > 0)}
                        name={`${basePath}.kind`}
                        value={link.kind}
                        onChange={handleChange}
                      >
                        <option value="press">Press</option>
                        <option value="demo">Demo</option>
                        <option value="drive">Drive</option>
                        <option value="instagram">Instagram</option>
                        <option value="spotify">Spotify</option>
                        <option value="youtube">YouTube</option>
                        <option value="other">Other</option>
                      </select>
                      <FieldError errors={getErrorsForField(`${basePath}.kind`)} />
                    </label>
                    <label className="form-field form-field--full">
                      <span className="form-label">URL</span>
                      <input
                        className={getFieldClassName('form-input', getErrorsForField(`${basePath}.url`).length > 0)}
                        name={`${basePath}.url`}
                        value={link.url}
                        onChange={handleChange}
                      />
                      <FieldError errors={getErrorsForField(`${basePath}.url`)} />
                    </label>
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </div>
        </div>
      </div>
      <BandEditorPreview
        values={values}
        baseBand={previewBandBase}
        mode={effectiveEditorMode}
        viewport={previewViewport}
        onViewportChange={setPreviewViewport}
        inline={isPreviewRoute}
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />
    </form>
  )
}
