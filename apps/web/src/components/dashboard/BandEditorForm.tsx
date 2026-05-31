'use client'

import {useRouter} from 'next/navigation'
import {useEffect, useState, type ChangeEvent, type FormEvent} from 'react'

import {
  MAX_TIMELINE_EVENTS,
  TIMELINE_ICON_OPTIONS,
  TIMELINE_IMPORTANCE_OPTIONS,
  createBandEditorKey,
} from '@/lib/bands/content'
import type {BandStatus, SanityImage} from '@/types/band'

type BandEditorMember = {
  _key: string
  nombre: string
  instrumento: string
  foto?: SanityImage
}

type BandEditorTimelineEvent = {
  _key: string
  name: string
  date: string
  importance: 'principal' | 'secundario' | 'tercero'
  image?: SanityImage
  descripcion?: string
  link?: string
  icon: string
}

type BandEditorYoutubeVideo = {
  _key: string
  titulo: string
  url: string
  descripcion?: string
}

type BandEditorSpotifyPlaylist = {
  _key: string
  titulo: string
  url: string
  descripcion?: string
}

export type BandEditorValues = {
  name: string
  slug: string
  genre?: string
  status: BandStatus
  colors: {
    primary: string
    secondary: string
    secondaryLight?: string
    accent?: string
  }
  hero: {
    title: string
    subtitle?: string
    description?: string
  }
  about: {
    title?: string
    content: string
    integrantes: BandEditorMember[]
  }
  timelineSection: {
    enabled: boolean
    titulo?: string
    descripcion?: string
    events: BandEditorTimelineEvent[]
  }
  contact: {
    email?: string
    phone?: string
    location?: string
    instagram?: string
    youtube?: string
    facebook?: string
    spotify?: string
    tiktok?: string
  }
  escuchanos: {
    titulo?: string
    descripcion?: string
    youtube: {
      habilitado: boolean
      titulo?: string
      videos: BandEditorYoutubeVideo[]
    }
    spotify: {
      habilitado: boolean
      titulo?: string
      perfil_url?: string
      playlists: BandEditorSpotifyPlaylist[]
    }
  }
  seo: {
    title?: string
    description?: string
  }
}

type SaveState =
  | {
      status: 'idle'
    }
  | {
      status: 'saving'
    }
  | {
      status: 'success'
      message: string
    }
  | {
      status: 'error'
      message: string
    }

type ValidationIssue = {
  path: string
  message: string
}

export type BandEditorImages = {
  logo?: string | null
  logoFavicon?: string | null
  heroImage?: string | null
  aboutImage?: string | null
  integrantes?: Record<string, string | null>
  timelineEvents?: Record<string, string | null>
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

type TopLevelImageField = 'logo' | 'logoFavicon' | 'heroImage' | 'aboutImage'
type ArrayCollection = 'about.integrantes' | 'timelineSection.events'

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

type SavedArrayItems = Record<ArrayCollection, Record<string, true>>

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

function setValueAtPath<T>(values: T, path: string, value: unknown) {
  const next = structuredClone(values) as Record<string, unknown>
  const parts = path.split('.')
  let target: Record<string, unknown> | unknown[] = next

  for (const part of parts.slice(0, -1)) {
    target = target[part as keyof typeof target] as Record<string, unknown> | unknown[]
  }

  target[parts[parts.length - 1] as keyof typeof target] = value as never
  return next as T
}

function getValueAtPath<T>(values: T, path: string) {
  return path.split('.').reduce<unknown>((current, part) => {
    if (current === null || current === undefined) {
      return undefined
    }

    return (current as Record<string, unknown> | unknown[])[part as keyof typeof current]
  }, values)
}

function appendArrayItem<T>(values: T, path: string, item: unknown) {
  const current = getValueAtPath(values, path)
  const nextItems = Array.isArray(current) ? [...current, item] : [item]
  return setValueAtPath(values, path, nextItems)
}

function removeArrayItem<T>(values: T, path: string, index: number) {
  const current = getValueAtPath(values, path)
  if (!Array.isArray(current)) {
    return values
  }

  return setValueAtPath(
    values,
    path,
    current.filter((_, currentIndex) => currentIndex !== index)
  )
}

function moveArrayItem<T>(values: T, path: string, index: number, direction: -1 | 1) {
  const current = getValueAtPath(values, path)
  if (!Array.isArray(current)) {
    return values
  }

  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= current.length) {
    return values
  }

  const nextItems = [...current]
  const [item] = nextItems.splice(index, 1)
  nextItems.splice(nextIndex, 0, item)
  return setValueAtPath(values, path, nextItems)
}

function clearFieldErrorByPath(errors: Record<string, string[]>, path: string) {
  if (!errors[path]) {
    return errors
  }

  const next = {...errors}
  delete next[path]
  return next
}

function buildSavedArrayItems(values: BandEditorValues): SavedArrayItems {
  return {
    'about.integrantes': Object.fromEntries(values.about.integrantes.map((member) => [member._key, true])),
    'timelineSection.events': Object.fromEntries(values.timelineSection.events.map((event) => [event._key, true])),
  }
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
}: {
  bandId: string
  target: ImageUploadTarget
  label: string
  help: string
  previewUrl?: string | null
  disabled?: boolean
  disabledHelp?: string
  onUploaded?: (image: SanityImage) => void
}) {
  const router = useRouter()
  const [state, setState] = useState<ImageUploadState>({status: 'idle'})
  const [preview, setPreview] = useState(previewUrl || '')

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
    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      setState({
        status: 'error',
        message: body?.message || 'No se pudo subir la imagen.',
      })
      input.value = ''
      return
    }

    if (body?.image?.assetId && onUploaded) {
      onUploaded(createSanityImageRef(body.image.assetId))
    }

    setPreview(URL.createObjectURL(file))
    setState({
      status: 'success',
      message: 'Imagen subida a Sanity.',
    })
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

export function BandEditorForm({
  bandId,
  initialValues,
  initialImages,
}: {
  bandId: string
  initialValues: BandEditorValues
  initialImages: BandEditorImages
}) {
  const router = useRouter()
  const storageKey = `web-bands:editor:${bandId}`
  const [values, setValues] = useState(initialValues)
  const [saveState, setSaveState] = useState<SaveState>({status: 'idle'})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [savedArrayItems, setSavedArrayItems] = useState<SavedArrayItems>(() => buildSavedArrayItems(initialValues))

  useEffect(() => {
    const snapshot = window.localStorage.getItem(storageKey)
    if (!snapshot) {
      return
    }

    try {
      const parsed = JSON.parse(snapshot) as {values?: BandEditorValues}
      if (parsed.values) {
        const frame = window.requestAnimationFrame(() => {
          setValues(parsed.values as BandEditorValues)
          setSavedArrayItems(buildSavedArrayItems(parsed.values as BandEditorValues))
        })

        return () => window.cancelAnimationFrame(frame)
      }
    } catch {
      window.localStorage.removeItem(storageKey)
    }
  }, [storageKey])

  const getErrorsForField = (path: string) => fieldErrors[path] || []
  const clearStructuralErrors = () => setFieldErrors({})

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {name} = event.currentTarget
    const value =
      event.currentTarget instanceof HTMLInputElement && event.currentTarget.type === 'checkbox'
        ? event.currentTarget.checked
        : event.currentTarget.value

    setValues((current) => setValueAtPath(current, name, value))
    setFieldErrors((current) => clearFieldErrorByPath(current, name))
  }

  const handleArrayImageUploaded = (path: string, image: SanityImage) => {
    setValues((current) => setValueAtPath(current, path, image))
  }

  const handleAddIntegrante = () => {
    setValues((current) =>
      appendArrayItem(current, 'about.integrantes', {
        _key: createBandEditorKey('member'),
        nombre: '',
        instrumento: '',
      } satisfies BandEditorMember)
    )
    clearStructuralErrors()
  }

  const handleAddTimelineEvent = () => {
    if (values.timelineSection.events.length >= MAX_TIMELINE_EVENTS) {
      return
    }

    setValues((current) =>
      appendArrayItem(current, 'timelineSection.events', {
        _key: createBandEditorKey('timeline'),
        name: '',
        date: '',
        importance: 'secundario',
        descripcion: '',
        link: '',
        icon: TIMELINE_ICON_OPTIONS[0].value,
      } satisfies BandEditorTimelineEvent)
    )
    clearStructuralErrors()
  }

  const handleAddYoutubeVideo = () => {
    setValues((current) =>
      appendArrayItem(current, 'escuchanos.youtube.videos', {
        _key: createBandEditorKey('yt'),
        titulo: '',
        url: '',
        descripcion: '',
      } satisfies BandEditorYoutubeVideo)
    )
    clearStructuralErrors()
  }

  const handleAddSpotifyPlaylist = () => {
    setValues((current) =>
      appendArrayItem(current, 'escuchanos.spotify.playlists', {
        _key: createBandEditorKey('spotify'),
        titulo: '',
        url: '',
        descripcion: '',
      } satisfies BandEditorSpotifyPlaylist)
    )
    clearStructuralErrors()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveState({status: 'saving'})

    const response = await fetch(`/api/bands/${bandId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      const nextFieldErrors = buildFieldErrors(body?.errors)
      setFieldErrors(nextFieldErrors)
      setSaveState({
        status: 'error',
        message:
          Object.keys(nextFieldErrors).length > 0
            ? 'Revisa los campos marcados y corrige los errores antes de guardar.'
            : body?.message || 'No se pudo guardar la banda.',
      })
      return
    }

    setFieldErrors({})
    setSavedArrayItems(buildSavedArrayItems(values))
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        values,
        savedAt: new Date().toISOString(),
      })
    )
    setSaveState({
      status: 'success',
      message: 'Banda guardada. La pagina publica fue revalidada.',
    })
    router.refresh()
  }

  return (
    <form className="dashboard-card" onSubmit={handleSubmit}>
      {saveState.status === 'success' ? (
        <div className="status status--success">{saveState.message}</div>
      ) : null}
      {saveState.status === 'error' ? (
        <div className="status status--error">{saveState.message}</div>
      ) : null}

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
        <h2>Identidad visual</h2>
        <div className="asset-grid">
          <ImageUploadField
            bandId={bandId}
            target={{kind: 'field', field: 'logo'}}
            label="Logo"
            help="PNG, JPG o WebP. Ideal cuadrado, hasta 5MB."
            previewUrl={initialImages.logo}
          />
          <ImageUploadField
            bandId={bandId}
            target={{kind: 'field', field: 'logoFavicon'}}
            label="Favicon"
            help="Imagen simple y cuadrada para pestana del navegador."
            previewUrl={initialImages.logoFavicon}
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
        <h2>Hero</h2>
        <div className="asset-grid">
          <ImageUploadField
            bandId={bandId}
            target={{kind: 'field', field: 'heroImage'}}
            label="Imagen principal"
            help="Foto horizontal para la portada publica."
            previewUrl={initialImages.heroImage}
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
        <h2>Sobre la banda</h2>
        <div className="asset-grid">
          <ImageUploadField
            bandId={bandId}
            target={{kind: 'field', field: 'aboutImage'}}
            label="Imagen de la banda"
            help="Foto secundaria para la seccion sobre la banda."
            previewUrl={initialImages.aboutImage}
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
          <div>
            <h2>Integrantes</h2>
            <p className="muted">Alta, orden y fotos por integrante desde el panel privado.</p>
          </div>
          <button className="button button--primary" type="button" onClick={handleAddIntegrante}>
            Agregar integrante
          </button>
        </div>
        <FieldError errors={getErrorsForField('about.integrantes')} />
        <div className="array-list">
          {values.about.integrantes.map((member, index) => {
            const basePath = `about.integrantes.${index}`
            const isSaved = Boolean(savedArrayItems['about.integrantes'][member._key])

            return (
              <section className="array-item" key={member._key}>
                <div className="row-actions row-actions--split">
                  <h3 className="array-item__title">Integrante {index + 1}</h3>
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
                    disabledHelp="Guardá primero para habilitar la imagen."
                    onUploaded={(image) => handleArrayImageUploaded(`${basePath}.foto`, image)}
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

            return (
              <section className="array-item" key={event._key}>
                <div className="row-actions row-actions--split">
                  <h3 className="array-item__title">Evento {index + 1}</h3>
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
                    disabledHelp="Guardá primero para habilitar la imagen."
                    onUploaded={(image) => handleArrayImageUploaded(`${basePath}.image`, image)}
                  />
                </div>
              </section>
            )
          })}
        </div>
      </div>

      <div className="form-section">
        <h2>Contacto y redes</h2>
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
        <h2>Escuchanos</h2>
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

              return (
                <section className="array-item array-item--nested" key={video._key}>
                  <div className="row-actions row-actions--split">
                    <h4 className="array-item__title">Video {index + 1}</h4>
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

              return (
                <section className="array-item array-item--nested" key={playlist._key}>
                  <div className="row-actions row-actions--split">
                    <h4 className="array-item__title">Playlist {index + 1}</h4>
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
        <h2>SEO</h2>
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

      <div className="form-section row-actions">
        <button className="button button--primary" disabled={saveState.status === 'saving'} type="submit">
          {saveState.status === 'saving' ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
