import type {BandStatus, SanityImage} from '@/types/band'

export type BandEditorMember = {
  _key: string
  nombre: string
  instrumento: string
  foto?: SanityImage
}

export type BandEditorTimelineEvent = {
  _key: string
  name: string
  date: string
  importance: 'principal' | 'secundario' | 'tercero'
  image?: SanityImage
  descripcion?: string
  link?: string
  icon: string
}

export type BandEditorYoutubeVideo = {
  _key: string
  titulo: string
  url: string
  descripcion?: string
}

export type BandEditorSpotifyPlaylist = {
  _key: string
  titulo: string
  url: string
  descripcion?: string
}

export type BandEditorFeaturedRelease = {
  eyebrow?: string
  title?: string
  description?: string
  coverImage?: SanityImage
  spotifyUrl?: string
  youtubeUrl?: string
  appleMusicUrl?: string
}

export type BandEditorShow = {
  _key: string
  date: string
  venue: string
  location: string
  ticketUrl?: string
  status: 'tickets' | 'sold-out' | 'soon'
}

export type BandEditorGalleryItem = {
  _key: string
  image?: SanityImage
  alt?: string
  caption?: string
  link?: string
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
    showSpotlightCard: boolean
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
    twitter?: string
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
  featuredRelease: BandEditorFeaturedRelease
  showsSection: {
    titulo?: string
    descripcion?: string
    shows: BandEditorShow[]
  }
  gallerySection: {
    titulo?: string
    items: BandEditorGalleryItem[]
  }
  seo: {
    title?: string
    description?: string
    keywords?: string[]
  }
}

export type BandEditorImages = {
  logo?: string | null
  logoFavicon?: string | null
  heroImage?: string | null
  aboutImage?: string | null
  featuredReleaseCover?: string | null
  integrantes?: Record<string, string | null>
  timelineEvents?: Record<string, string | null>
  galleryItems?: Record<string, string | null>
}

export type ArrayCollection = 'about.integrantes' | 'timelineSection.events' | 'gallerySection.items'

export type SavedArrayItems = Record<ArrayCollection, Record<string, true>>

export type StoredBandEditorSnapshot = {
  values: BandEditorValues
  baseline: BandEditorValues
  savedAt: string
}

export type EditorItemState = 'saved' | 'pending' | 'error'
export type EditorSectionState = 'saved' | 'pending' | 'error'

type BandEditorKeyedItem = {
  _key: string
}

export function getValueAtPath<T>(values: T, path: string) {
  return path.split('.').reduce<unknown>((current, part) => {
    if (current === null || current === undefined) {
      return undefined
    }

    return (current as Record<string, unknown> | unknown[])[part as keyof typeof current]
  }, values)
}

export function setValueAtPath<T>(values: T, path: string, value: unknown) {
  const next = structuredClone(values) as Record<string, unknown>
  const parts = path.split('.')
  let target: Record<string, unknown> | unknown[] = next

  for (const part of parts.slice(0, -1)) {
    target = target[part as keyof typeof target] as Record<string, unknown> | unknown[]
  }

  target[parts[parts.length - 1] as keyof typeof target] = value as never
  return next as T
}

export function appendArrayItem<T>(values: T, path: string, item: unknown) {
  const current = getValueAtPath(values, path)
  const nextItems = Array.isArray(current) ? [...current, item] : [item]
  return setValueAtPath(values, path, nextItems)
}

export function removeArrayItem<T>(values: T, path: string, index: number) {
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

export function moveArrayItem<T>(values: T, path: string, index: number, direction: -1 | 1) {
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

export function buildSavedArrayItems(values: BandEditorValues): SavedArrayItems {
  return {
    'about.integrantes': Object.fromEntries(values.about.integrantes.map((member) => [member._key, true])),
    'timelineSection.events': Object.fromEntries(values.timelineSection.events.map((event) => [event._key, true])),
    'gallerySection.items': Object.fromEntries(values.gallerySection.items.map((item) => [item._key, true])),
  }
}

export function mergeEditorValues(initialValues: BandEditorValues, snapshot: Partial<BandEditorValues>) {
  return {
    ...initialValues,
    ...snapshot,
    colors: {
      ...initialValues.colors,
      ...snapshot.colors,
    },
    hero: {
      ...initialValues.hero,
      ...snapshot.hero,
    },
    about: {
      ...initialValues.about,
      ...snapshot.about,
      integrantes: snapshot.about?.integrantes || initialValues.about.integrantes,
    },
    timelineSection: {
      ...initialValues.timelineSection,
      ...snapshot.timelineSection,
      events: snapshot.timelineSection?.events || initialValues.timelineSection.events,
    },
    contact: {
      ...initialValues.contact,
      ...snapshot.contact,
    },
    escuchanos: {
      ...initialValues.escuchanos,
      ...snapshot.escuchanos,
      youtube: {
        ...initialValues.escuchanos.youtube,
        ...snapshot.escuchanos?.youtube,
        videos: snapshot.escuchanos?.youtube?.videos || initialValues.escuchanos.youtube.videos,
      },
      spotify: {
        ...initialValues.escuchanos.spotify,
        ...snapshot.escuchanos?.spotify,
        playlists:
          snapshot.escuchanos?.spotify?.playlists || initialValues.escuchanos.spotify.playlists,
      },
    },
    featuredRelease: {
      ...initialValues.featuredRelease,
      ...snapshot.featuredRelease,
    },
    showsSection: {
      ...initialValues.showsSection,
      ...snapshot.showsSection,
      shows: snapshot.showsSection?.shows || initialValues.showsSection.shows,
    },
    gallerySection: {
      ...initialValues.gallerySection,
      ...snapshot.gallerySection,
      items: snapshot.gallerySection?.items || initialValues.gallerySection.items,
    },
    seo: {
      ...initialValues.seo,
      ...snapshot.seo,
    },
  }
}

export function serializeEditorValues(values: unknown) {
  return JSON.stringify(values)
}

export function areEditorValuesEqual(left: unknown, right: unknown) {
  return serializeEditorValues(left) === serializeEditorValues(right)
}

export function shouldRestoreDraft(
  snapshot: Partial<StoredBandEditorSnapshot>,
  initialValues: BandEditorValues,
  serverSavedAt?: string | null
) {
  if (!snapshot.values) {
    return false
  }

  if (snapshot.baseline && areEditorValuesEqual(snapshot.baseline, initialValues)) {
    return true
  }

  if (!snapshot.savedAt || !serverSavedAt) {
    return true
  }

  const snapshotTime = Date.parse(snapshot.savedAt)
  const serverTime = Date.parse(serverSavedAt)

  if (Number.isNaN(snapshotTime) || Number.isNaN(serverTime)) {
    return true
  }

  return snapshotTime >= serverTime
}

export function hasFieldError(fieldErrors: Record<string, string[]>, pathPrefix: string) {
  return Object.keys(fieldErrors).some(
    (path) => path === pathPrefix || path.startsWith(`${pathPrefix}.`)
  )
}

export function resolveSectionState({
  values,
  baselineValues,
  fieldErrors,
  pathPrefixes,
}: {
  values: BandEditorValues
  baselineValues: BandEditorValues
  fieldErrors: Record<string, string[]>
  pathPrefixes: string[]
}): EditorSectionState {
  if (pathPrefixes.some((prefix) => hasFieldError(fieldErrors, prefix))) {
    return 'error'
  }

  const hasPendingChanges = pathPrefixes.some(
    (prefix) => !areEditorValuesEqual(getValueAtPath(values, prefix), getValueAtPath(baselineValues, prefix))
  )

  return hasPendingChanges ? 'pending' : 'saved'
}

export function resolveArrayItemState<T extends BandEditorKeyedItem>({
  item,
  baselineItems,
  savedItems,
  fieldErrors,
  pathPrefix,
}: {
  item: T
  baselineItems: T[]
  savedItems?: Record<string, true>
  fieldErrors: Record<string, string[]>
  pathPrefix: string
}): EditorItemState {
  if (hasFieldError(fieldErrors, pathPrefix)) {
    return 'error'
  }

  const baselineItem = baselineItems.find((entry) => entry._key === item._key)
  const isPersisted = savedItems ? Boolean(savedItems[item._key]) : Boolean(baselineItem)

  if (!isPersisted || !baselineItem) {
    return 'pending'
  }

  return areEditorValuesEqual(item, baselineItem) ? 'saved' : 'pending'
}
