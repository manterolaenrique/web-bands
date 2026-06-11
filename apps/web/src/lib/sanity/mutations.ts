import {getSanityWriteClient} from '@/lib/sanity/client'
import {resolveBandDocumentId} from '@/lib/sanity/document-id'
import {type BandUpdateInput, toSanityBandSet, toSanityBandUnset} from '@/lib/bands/validation'
import type {SupabaseBand} from '@/types/band'

const ALLOWED_IMAGE_FIELDS = {
  logo: 'logo',
  logoFavicon: 'logo_favicon',
  heroImage: 'hero.imagen',
  aboutImage: 'about.imagen',
  featuredReleaseCover: 'featuredRelease.coverImage',
} as const

const ALLOWED_ARRAY_IMAGE_FIELDS = {
  'about.integrantes': {
    foto: 'about.integrantes',
  },
  'timelineSection.events': {
    image: 'timelineSection.events',
  },
  'gallerySection.items': {
    image: 'gallerySection.items',
  },
} as const

const BAND_DOCUMENT_SHAPE = {
  colores: {},
  hero: {},
  about: {
    integrantes: [],
  },
  timelineSection: {
    events: [],
  },
  contacto: {
    redes: {},
  },
  escuchanos: {
    youtube: {
      videos: [],
    },
    spotify: {
      playlists: [],
    },
  },
  featuredRelease: {},
  showsSection: {
    shows: [],
  },
  gallerySection: {
    items: [],
  },
  presentation: {
    sectionOrder: [],
  },
  internalKit: {
    keyLinks: [],
  },
  seo: {},
} as const

export type BandImageField = keyof typeof ALLOWED_IMAGE_FIELDS
export type BandArrayImageCollection = keyof typeof ALLOWED_ARRAY_IMAGE_FIELDS
export type BandArrayImageField = 'foto' | 'image'

export type BandImageTarget =
  | {
      kind: 'field'
      field: BandImageField
    }
  | {
      kind: 'array'
      collection: BandArrayImageCollection
      itemKey: string
      imageField: BandArrayImageField
    }

function escapeSanitySelectorValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function getArrayImageFieldPath(
  collection: BandArrayImageCollection,
  itemKey: string,
  imageField: BandArrayImageField
) {
  return `${collection}[_key=="${escapeSanitySelectorValue(itemKey)}"].${imageField}`
}

function getBandImageFieldPath(target: BandImageTarget) {
  if (target.kind === 'field') {
    return ALLOWED_IMAGE_FIELDS[target.field]
  }

  return getArrayImageFieldPath(target.collection, target.itemKey, target.imageField)
}

function getUploadFilenameSuffix(target: BandImageTarget) {
  if (target.kind === 'field') {
    return target.field
  }

  return `${target.collection.split('.').join('-')}-${target.itemKey}-${target.imageField}`
}

export async function upsertBandDocument(
  documentId: string,
  bandId: string,
  input: BandUpdateInput,
  userId: string,
  syncedAt = new Date().toISOString()
) {
  const client = getSanityWriteClient()
  const patch = toSanityBandSet(input, syncedAt)
  const unsetPaths = toSanityBandUnset(input)

  await client.createIfNotExists({
    _id: documentId,
    _type: 'banda',
    bandId,
    nombre: input.name,
    slug: {
      _type: 'slug',
      current: input.slug,
    },
    ...BAND_DOCUMENT_SHAPE,
  })

  let mutation = client
    .patch(documentId)
    .setIfMissing(BAND_DOCUMENT_SHAPE)
    .set({
      ...patch,
      bandId,
      updatedBy: userId,
    })

  if (unsetPaths.length > 0) {
    mutation = mutation.unset(unsetPaths)
  }

  return mutation.commit({autoGenerateArrayKeys: true})
}

export async function uploadBandImage({
  band,
  target,
  file,
  userId,
}: {
  band: SupabaseBand
  target: BandImageTarget
  file: Buffer
  userId: string
}) {
  const client = getSanityWriteClient()
  const documentId = resolveBandDocumentId(band)
  const asset = await client.assets.upload('image', file, {
    filename: `${band.slug}-${getUploadFilenameSuffix(target)}`,
  })

  await client.createIfNotExists({
    _id: documentId,
    _type: 'banda',
    bandId: band.id,
    nombre: band.name,
    slug: {
      _type: 'slug',
      current: band.slug,
    },
    ...BAND_DOCUMENT_SHAPE,
  })

  await client
    .patch(documentId)
    .setIfMissing(BAND_DOCUMENT_SHAPE)
    .set({
      [getBandImageFieldPath(target)]: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: asset._id,
        },
      },
      bandId: band.id,
      updatedBy: userId,
      lastSyncedAt: new Date().toISOString(),
    })
    .commit({autoGenerateArrayKeys: true})

  return {
    asset,
    documentId,
    fieldPath: getBandImageFieldPath(target),
  }
}

export function isBandImageField(value: string | null): value is BandImageField {
  return Boolean(value && value in ALLOWED_IMAGE_FIELDS)
}

export function isBandArrayImageCollection(value: string | null): value is BandArrayImageCollection {
  return Boolean(value && value in ALLOWED_ARRAY_IMAGE_FIELDS)
}

export function isBandArrayImageField(
  collection: BandArrayImageCollection,
  value: string | null
): value is BandArrayImageField {
  return Boolean(value && value in ALLOWED_ARRAY_IMAGE_FIELDS[collection])
}
