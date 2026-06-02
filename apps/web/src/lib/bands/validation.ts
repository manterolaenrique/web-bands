import {z} from 'zod'

import {
  MAX_TIMELINE_EVENTS,
  TIMELINE_ICON_VALUES,
  TIMELINE_IMPORTANCE_VALUES,
  type TimelineIcon,
  type TimelineImportance,
} from '@/lib/bands/content'
import type {SanityImage} from '@/types/band'

const optionalTrimmedString = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional()

const optionalKeywordsSchema = z
  .array(z.string().trim().min(1).max(80))
  .transform((values) => values.map((value) => value.trim()).filter(Boolean))
  .optional()

const requiredTrimmedString = z.string().trim().min(2).max(120)

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(96)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only.')

const colorSchema = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, 'Use a hex color like #111827.')

const optionalColorSchema = colorSchema.optional().or(z.literal('').transform(() => undefined))

const optionalUrlSchema = z
  .string()
  .trim()
  .url()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional()
  .or(z.literal('').transform(() => undefined))

const requiredUrlSchema = z.string().trim().url()

const sanityImageSchema = z.preprocess(
  (value) => (value === null ? undefined : value),
  z
    .object({
      _type: z.literal('image').optional(),
      asset: z
        .object({
          _type: z.literal('reference').optional(),
          _ref: z.string().trim().min(1),
        })
        .partial()
        .optional(),
    })
    .passthrough()
    .optional()
)

const itemKeySchema = z.string().trim().min(1).max(120)

const timelineImportanceSchema = z.enum(TIMELINE_IMPORTANCE_VALUES)
const timelineIconSchema = z.enum(TIMELINE_ICON_VALUES)

const aboutMemberSchema = z.object({
  _key: itemKeySchema,
  nombre: requiredTrimmedString,
  instrumento: requiredTrimmedString,
  foto: sanityImageSchema,
})

const timelineEventSchema = z.object({
  _key: itemKeySchema,
  name: requiredTrimmedString,
  date: z
    .string()
    .trim()
    .min(1, 'Date is required.')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Use a valid date.')
    .transform((value) => new Date(value).toISOString()),
  importance: timelineImportanceSchema,
  image: sanityImageSchema,
  descripcion: optionalTrimmedString,
  link: optionalUrlSchema,
  icon: timelineIconSchema,
})

const listenYoutubeVideoSchema = z.object({
  _key: itemKeySchema,
  titulo: requiredTrimmedString,
  url: requiredUrlSchema,
  descripcion: optionalTrimmedString,
})

const listenSpotifyPlaylistSchema = z.object({
  _key: itemKeySchema,
  titulo: requiredTrimmedString,
  url: requiredUrlSchema,
  descripcion: optionalTrimmedString,
})

const featuredReleaseSchema = z.object({
  eyebrow: optionalTrimmedString,
  title: optionalTrimmedString,
  description: optionalTrimmedString,
  coverImage: sanityImageSchema,
  spotifyUrl: optionalUrlSchema,
  youtubeUrl: optionalUrlSchema,
  appleMusicUrl: optionalUrlSchema,
})

const bandShowSchema = z.object({
  _key: itemKeySchema,
  date: z
    .string()
    .trim()
    .min(1, 'Date is required.')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Use a valid date.')
    .transform((value) => new Date(value).toISOString()),
  venue: requiredTrimmedString,
  location: requiredTrimmedString,
  ticketUrl: optionalUrlSchema,
  status: z.enum(['tickets', 'sold-out', 'soon']).default('tickets'),
})

const galleryItemSchema = z.object({
  _key: itemKeySchema,
  image: sanityImageSchema,
  alt: optionalTrimmedString,
  caption: optionalTrimmedString,
  link: optionalUrlSchema,
})

const timelineSectionSchema = z
  .object({
    enabled: z.boolean().default(false),
    titulo: optionalTrimmedString,
    descripcion: optionalTrimmedString,
    events: z.array(timelineEventSchema).max(MAX_TIMELINE_EVENTS).default([]),
  })
  .superRefine((value, context) => {
    if (value.enabled && value.events.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['events'],
        message: 'Add at least one event before enabling the timeline.',
      })
    }
  })

const escuchanosSchema = z.object({
  titulo: optionalTrimmedString,
  descripcion: optionalTrimmedString,
  youtube: z.object({
    habilitado: z.boolean().default(false),
    titulo: optionalTrimmedString,
    videos: z.array(listenYoutubeVideoSchema).default([]),
  }),
  spotify: z.object({
    habilitado: z.boolean().default(false),
    titulo: optionalTrimmedString,
    perfil_url: optionalUrlSchema,
    playlists: z.array(listenSpotifyPlaylistSchema).default([]),
  }),
})

export const bandUpdateSchema = z.object({
  name: requiredTrimmedString,
  slug: slugSchema,
  genre: optionalTrimmedString,
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  colors: z.object({
    primary: colorSchema.default('#111827'),
    secondary: colorSchema.default('#6b7280'),
    secondaryLight: optionalColorSchema,
    accent: optionalColorSchema,
  }),
  hero: z.object({
    title: requiredTrimmedString,
    subtitle: optionalTrimmedString,
    description: optionalTrimmedString,
    showSpotlightCard: z.boolean().default(true),
  }),
  about: z.object({
    title: optionalTrimmedString,
    content: z.string().trim().min(10).max(5000),
    integrantes: z.array(aboutMemberSchema).default([]),
  }),
  timelineSection: timelineSectionSchema.default({
    enabled: false,
    titulo: undefined,
    descripcion: undefined,
    events: [],
  }),
  contact: z.object({
    email: z.string().trim().email().optional().or(z.literal('').transform(() => undefined)),
    phone: optionalTrimmedString,
    location: optionalTrimmedString,
    instagram: optionalUrlSchema,
    youtube: optionalUrlSchema,
    facebook: optionalUrlSchema,
    twitter: optionalUrlSchema,
    spotify: optionalUrlSchema,
    tiktok: optionalUrlSchema,
  }),
  escuchanos: escuchanosSchema.default({
    titulo: undefined,
    descripcion: undefined,
    youtube: {
      habilitado: false,
      titulo: undefined,
      videos: [],
    },
    spotify: {
      habilitado: false,
      titulo: undefined,
      perfil_url: undefined,
      playlists: [],
    },
  }),
  featuredRelease: featuredReleaseSchema.default({
    eyebrow: undefined,
    title: undefined,
    description: undefined,
    coverImage: undefined,
    spotifyUrl: undefined,
    youtubeUrl: undefined,
    appleMusicUrl: undefined,
  }),
  showsSection: z
    .object({
      titulo: optionalTrimmedString,
      descripcion: optionalTrimmedString,
      shows: z.array(bandShowSchema).default([]),
    })
    .default({
      titulo: undefined,
      descripcion: undefined,
      shows: [],
    }),
  gallerySection: z
    .object({
      titulo: optionalTrimmedString,
      items: z.array(galleryItemSchema).default([]),
    })
    .default({
      titulo: undefined,
      items: [],
    }),
  seo: z.object({
    title: optionalTrimmedString,
    description: z.string().trim().max(300).optional().or(z.literal('').transform(() => undefined)),
    keywords: optionalKeywordsSchema,
  }),
})

export type BandUpdateInput = z.infer<typeof bandUpdateSchema>

function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Partial<T>
}

function toSanityImageReference(image?: SanityImage) {
  const assetRef = image?.asset?._ref
  if (!assetRef) {
    return undefined
  }

  return {
    _type: 'image' as const,
    asset: {
      _type: 'reference' as const,
      _ref: assetRef,
    },
  }
}

function toSanityAboutMembers(input: BandUpdateInput['about']['integrantes']) {
  return input.map((member) =>
    compactObject({
      _key: member._key,
      _type: 'object',
      nombre: member.nombre,
      instrumento: member.instrumento,
      foto: toSanityImageReference(member.foto),
    })
  )
}

function toSanityTimelineEvents(input: BandUpdateInput['timelineSection']['events']) {
  return input.map((event) =>
    compactObject({
      _key: event._key,
      _type: 'object',
      name: event.name,
      date: event.date,
      importance: event.importance,
      image: toSanityImageReference(event.image),
      descripcion: event.descripcion,
      link: event.link,
      icon: event.icon,
    })
  )
}

function toSanityYoutubeVideos(input: BandUpdateInput['escuchanos']['youtube']['videos']) {
  return input.map((video) =>
    compactObject({
      _key: video._key,
      _type: 'object',
      titulo: video.titulo,
      url: video.url,
      descripcion: video.descripcion,
    })
  )
}

function toSanitySpotifyPlaylists(input: BandUpdateInput['escuchanos']['spotify']['playlists']) {
  return input.map((playlist) =>
    compactObject({
      _key: playlist._key,
      _type: 'object',
      titulo: playlist.titulo,
      url: playlist.url,
      descripcion: playlist.descripcion,
    })
  )
}

function toSanityShows(input: BandUpdateInput['showsSection']['shows']) {
  return input.map((show) =>
    compactObject({
      _key: show._key,
      _type: 'object',
      date: show.date,
      venue: show.venue,
      location: show.location,
      ticketUrl: show.ticketUrl,
      status: show.status,
    })
  )
}

function toSanityGalleryItems(input: BandUpdateInput['gallerySection']['items']) {
  return input.map((item) =>
    compactObject({
      _key: item._key,
      _type: 'object',
      image: toSanityImageReference(item.image),
      alt: item.alt,
      caption: item.caption,
      link: item.link,
    })
  )
}

function hasEscuchanosContent(input: BandUpdateInput['escuchanos']) {
  return Boolean(
    input.titulo ||
      input.descripcion ||
      input.youtube.titulo ||
      input.youtube.videos.length > 0 ||
      input.spotify.titulo ||
      input.spotify.perfil_url ||
      input.spotify.playlists.length > 0
  )
}

function hasTimelineContent(input: BandUpdateInput['timelineSection']) {
  return Boolean(input.enabled || input.titulo || input.descripcion || input.events.length > 0)
}

function hasFeaturedReleaseContent(input: BandUpdateInput['featuredRelease']) {
  return Boolean(
    input.eyebrow ||
      input.title ||
      input.description ||
      input.coverImage?.asset?._ref ||
      input.spotifyUrl ||
      input.youtubeUrl ||
      input.appleMusicUrl
  )
}

function hasShowsContent(input: BandUpdateInput['showsSection']) {
  return Boolean(input.titulo || input.descripcion || input.shows.length > 0)
}

function hasGalleryContent(input: BandUpdateInput['gallerySection']) {
  return Boolean(input.titulo || input.items.length > 0)
}

export function toSanityBandPatch(input: BandUpdateInput, syncedAt = new Date().toISOString()) {
  return {
    nombre: input.name,
    genero: input.genre,
    slug: {
      _type: 'slug',
      current: input.slug,
    },
    status: input.status,
    visibility: input.status === 'published' ? 'public' : 'private',
    colores: {
      primario: input.colors.primary,
      secundario: input.colors.secondary,
      secundario_claro: input.colors.secondaryLight,
      acento: input.colors.accent,
    },
    hero: {
      titulo: input.hero.title,
      subtitulo: input.hero.subtitle,
      descripcion: input.hero.description,
      showSpotlightCard: input.hero.showSpotlightCard,
    },
    about: {
      titulo: input.about.title || 'Quienes Somos',
      contenido: input.about.content,
      integrantes: toSanityAboutMembers(input.about.integrantes),
    },
    timelineSection: hasTimelineContent(input.timelineSection)
      ? compactObject({
          enabled: input.timelineSection.enabled,
          titulo: input.timelineSection.titulo,
          descripcion: input.timelineSection.descripcion,
          events: toSanityTimelineEvents(input.timelineSection.events),
        })
      : undefined,
    contacto: {
      email: input.contact.email,
      telefono: input.contact.phone,
      ubicacion: input.contact.location,
      redes: {
        instagram: input.contact.instagram,
        youtube: input.contact.youtube,
        facebook: input.contact.facebook,
        twitter: input.contact.twitter,
        spotify: input.contact.spotify,
        tiktok: input.contact.tiktok,
      },
    },
    escuchanos: hasEscuchanosContent(input.escuchanos)
      ? compactObject({
          titulo: input.escuchanos.titulo,
          descripcion: input.escuchanos.descripcion,
          youtube: compactObject({
            habilitado: input.escuchanos.youtube.habilitado,
            titulo: input.escuchanos.youtube.titulo,
            videos: toSanityYoutubeVideos(input.escuchanos.youtube.videos),
          }),
          spotify: compactObject({
            habilitado: input.escuchanos.spotify.habilitado,
            titulo: input.escuchanos.spotify.titulo,
            perfil_url: input.escuchanos.spotify.perfil_url,
            playlists: toSanitySpotifyPlaylists(input.escuchanos.spotify.playlists),
          }),
        })
      : undefined,
    featuredRelease: hasFeaturedReleaseContent(input.featuredRelease)
      ? compactObject({
          eyebrow: input.featuredRelease.eyebrow,
          title: input.featuredRelease.title,
          description: input.featuredRelease.description,
          coverImage: toSanityImageReference(input.featuredRelease.coverImage),
          spotifyUrl: input.featuredRelease.spotifyUrl,
          youtubeUrl: input.featuredRelease.youtubeUrl,
          appleMusicUrl: input.featuredRelease.appleMusicUrl,
        })
      : undefined,
    showsSection: hasShowsContent(input.showsSection)
      ? compactObject({
          titulo: input.showsSection.titulo,
          descripcion: input.showsSection.descripcion,
          shows: toSanityShows(input.showsSection.shows),
        })
      : undefined,
    gallerySection: hasGalleryContent(input.gallerySection)
      ? compactObject({
          titulo: input.gallerySection.titulo,
          items: toSanityGalleryItems(input.gallerySection.items),
        })
      : undefined,
    seo: {
      titulo_seo: input.seo.title,
      descripcion_seo: input.seo.description,
      palabras_clave: input.seo.keywords?.length ? input.seo.keywords : undefined,
    },
    lastSyncedAt: syncedAt,
  }
}

export function toSanityBandSet(input: BandUpdateInput, syncedAt?: string) {
  const patch = toSanityBandPatch(input, syncedAt)
  const values: Record<string, unknown> = {
    nombre: patch.nombre,
    genero: patch.genero,
    slug: patch.slug,
    status: patch.status,
    visibility: patch.visibility,
    'colores.primario': patch.colores.primario,
    'colores.secundario': patch.colores.secundario,
    'colores.secundario_claro': patch.colores.secundario_claro,
    'colores.acento': patch.colores.acento,
    'hero.titulo': patch.hero.titulo,
    'hero.subtitulo': patch.hero.subtitulo,
    'hero.descripcion': patch.hero.descripcion,
    'hero.showSpotlightCard': patch.hero.showSpotlightCard,
    'about.titulo': patch.about.titulo,
    'about.contenido': patch.about.contenido,
    'about.integrantes': patch.about.integrantes,
    'timelineSection.enabled': patch.timelineSection?.enabled,
    'timelineSection.titulo': patch.timelineSection?.titulo,
    'timelineSection.descripcion': patch.timelineSection?.descripcion,
    'timelineSection.events': patch.timelineSection?.events,
    'contacto.email': patch.contacto.email,
    'contacto.telefono': patch.contacto.telefono,
    'contacto.ubicacion': patch.contacto.ubicacion,
    'contacto.redes.instagram': patch.contacto.redes.instagram,
    'contacto.redes.youtube': patch.contacto.redes.youtube,
    'contacto.redes.facebook': patch.contacto.redes.facebook,
    'contacto.redes.twitter': patch.contacto.redes.twitter,
    'contacto.redes.spotify': patch.contacto.redes.spotify,
    'contacto.redes.tiktok': patch.contacto.redes.tiktok,
    'escuchanos.titulo': patch.escuchanos?.titulo,
    'escuchanos.descripcion': patch.escuchanos?.descripcion,
    'escuchanos.youtube.habilitado': patch.escuchanos?.youtube?.habilitado,
    'escuchanos.youtube.titulo': patch.escuchanos?.youtube?.titulo,
    'escuchanos.youtube.videos': patch.escuchanos?.youtube?.videos,
    'escuchanos.spotify.habilitado': patch.escuchanos?.spotify?.habilitado,
    'escuchanos.spotify.titulo': patch.escuchanos?.spotify?.titulo,
    'escuchanos.spotify.perfil_url': patch.escuchanos?.spotify?.perfil_url,
    'escuchanos.spotify.playlists': patch.escuchanos?.spotify?.playlists,
    'featuredRelease.eyebrow': patch.featuredRelease?.eyebrow,
    'featuredRelease.title': patch.featuredRelease?.title,
    'featuredRelease.description': patch.featuredRelease?.description,
    'featuredRelease.coverImage': patch.featuredRelease?.coverImage,
    'featuredRelease.spotifyUrl': patch.featuredRelease?.spotifyUrl,
    'featuredRelease.youtubeUrl': patch.featuredRelease?.youtubeUrl,
    'featuredRelease.appleMusicUrl': patch.featuredRelease?.appleMusicUrl,
    'showsSection.titulo': patch.showsSection?.titulo,
    'showsSection.descripcion': patch.showsSection?.descripcion,
    'showsSection.shows': patch.showsSection?.shows,
    'gallerySection.titulo': patch.gallerySection?.titulo,
    'gallerySection.items': patch.gallerySection?.items,
    'seo.titulo_seo': patch.seo.titulo_seo,
    'seo.descripcion_seo': patch.seo.descripcion_seo,
    'seo.palabras_clave': patch.seo.palabras_clave,
    lastSyncedAt: patch.lastSyncedAt,
  }

  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined))
}

export function toSanityBandUnset(input: BandUpdateInput) {
  const optionalValues: Record<string, unknown> = {
    genero: input.genre,
    'colores.secundario_claro': input.colors.secondaryLight,
    'colores.acento': input.colors.accent,
    'hero.subtitulo': input.hero.subtitle,
    'hero.descripcion': input.hero.description,
    'timelineSection.titulo': input.timelineSection.titulo,
    'timelineSection.descripcion': input.timelineSection.descripcion,
    'contacto.email': input.contact.email,
    'contacto.telefono': input.contact.phone,
    'contacto.ubicacion': input.contact.location,
    'contacto.redes.instagram': input.contact.instagram,
    'contacto.redes.youtube': input.contact.youtube,
    'contacto.redes.facebook': input.contact.facebook,
    'contacto.redes.twitter': input.contact.twitter,
    'contacto.redes.spotify': input.contact.spotify,
    'contacto.redes.tiktok': input.contact.tiktok,
    'escuchanos.titulo': input.escuchanos.titulo,
    'escuchanos.descripcion': input.escuchanos.descripcion,
    'escuchanos.youtube.titulo': input.escuchanos.youtube.titulo,
    'escuchanos.spotify.titulo': input.escuchanos.spotify.titulo,
    'escuchanos.spotify.perfil_url': input.escuchanos.spotify.perfil_url,
    'featuredRelease.eyebrow': input.featuredRelease.eyebrow,
    'featuredRelease.title': input.featuredRelease.title,
    'featuredRelease.description': input.featuredRelease.description,
    'featuredRelease.coverImage': input.featuredRelease.coverImage,
    'featuredRelease.spotifyUrl': input.featuredRelease.spotifyUrl,
    'featuredRelease.youtubeUrl': input.featuredRelease.youtubeUrl,
    'featuredRelease.appleMusicUrl': input.featuredRelease.appleMusicUrl,
    'showsSection.titulo': input.showsSection.titulo,
    'showsSection.descripcion': input.showsSection.descripcion,
    'gallerySection.titulo': input.gallerySection.titulo,
    'seo.titulo_seo': input.seo.title,
    'seo.descripcion_seo': input.seo.description,
    'seo.palabras_clave': input.seo.keywords?.length ? input.seo.keywords : undefined,
  }

  const unsetPaths = Object.entries(optionalValues)
    .filter(([, value]) => value === undefined)
    .map(([path]) => path)

  if (!hasTimelineContent(input.timelineSection)) {
    unsetPaths.push('timelineSection')
  }

  if (!hasEscuchanosContent(input.escuchanos)) {
    unsetPaths.push('escuchanos')
  }

  if (!hasFeaturedReleaseContent(input.featuredRelease)) {
    unsetPaths.push('featuredRelease')
  }

  if (!hasShowsContent(input.showsSection)) {
    unsetPaths.push('showsSection')
  }

  if (!hasGalleryContent(input.gallerySection)) {
    unsetPaths.push('gallerySection')
  }

  return Array.from(new Set(unsetPaths))
}

export function getValidationErrors(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
  }

  return [{path: 'form', message: 'Invalid request payload.'}]
}

export function createSanityImageRef(assetId: string): SanityImage {
  return {
    _type: 'image',
    asset: {
      _type: 'reference',
      _ref: assetId,
    },
  }
}

export function isTimelineImportance(value: string): value is TimelineImportance {
  return TIMELINE_IMPORTANCE_VALUES.includes(value as TimelineImportance)
}

export function isTimelineIcon(value: string): value is TimelineIcon {
  return TIMELINE_ICON_VALUES.includes(value as TimelineIcon)
}
