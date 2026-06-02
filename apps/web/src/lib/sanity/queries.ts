import {getServerSanityClient, publicSanityClient} from '@/lib/sanity/client'
import type {PublicBand, PublicBandListItem} from '@/types/band'

const publicBandFilter =
  '_type == "banda" && coalesce(status, "published") == "published" && coalesce(visibility, "public") == "public"'

const bandFields = `{
  _id,
  bandId,
  lastSyncedAt,
  nombre,
  genero,
  slug,
  logo,
  logo_favicon,
  colores,
  status,
  visibility,
  hero{
    titulo,
    subtitulo,
    imagen,
    descripcion,
    showSpotlightCard
  },
  about{
    titulo,
    contenido,
    imagen,
    integrantes[]{
      _key,
      nombre,
      instrumento,
      foto
    }
  },
  timelineSection{
    enabled,
    titulo,
    descripcion,
    events[]{
      _key,
      name,
      date,
      importance,
      image,
      descripcion,
      link,
      icon
    }
  },
  contacto{
    email,
    telefono,
    redes,
    ubicacion
  },
  escuchanos{
    titulo,
    descripcion,
    youtube{
      habilitado,
      titulo,
      videos[]{
        _key,
        titulo,
        url,
        descripcion
      }
    },
    spotify{
      habilitado,
      titulo,
      perfil_url,
      playlists[]{
        _key,
        titulo,
        url,
        descripcion
      }
    }
  },
  featuredRelease{
    eyebrow,
    title,
    description,
    coverImage,
    spotifyUrl,
    youtubeUrl,
    appleMusicUrl
  },
  showsSection{
    titulo,
    descripcion,
    shows[]{
      _key,
      date,
      venue,
      location,
      ticketUrl,
      status
    }
  },
  gallerySection{
    titulo,
    items[]{
      _key,
      image,
      alt,
      caption,
      link
    }
  },
  seo{
    titulo_seo,
    descripcion_seo,
    palabras_clave
  }
}`

const publishedBandsQuery = `*[${publicBandFilter}] | order(nombre asc) {
  _id,
  bandId,
  nombre,
  genero,
  slug,
  logo,
  "heroImage": hero.imagen,
  "heroTitle": hero.titulo,
  status,
  visibility
}`

const bandBySlugQuery = `*[${publicBandFilter} && slug.current == $slug] | order(coalesce(lastSyncedAt, _updatedAt) desc)[0]${bandFields}`

const bandByDocumentIdQuery = `*[_type == "banda" && _id == $id][0]${bandFields}`
const bandByBandIdQuery = `*[_type == "banda" && bandId == $bandId] | order(coalesce(lastSyncedAt, _updatedAt) desc)[0]${bandFields}`

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getPublishedBands() {
  return publicSanityClient.fetch<PublicBandListItem[]>(publishedBandsQuery, {})
}

export async function getPublicBandBySlug(slug: string) {
  return publicSanityClient.fetch<PublicBand | null>(bandBySlugQuery, {slug})
}

export async function getBandByDocumentId(id: string) {
  return getBandWithRetry({id})
}

export async function getBandByBandId(bandId: string) {
  return getBandWithRetry({bandId})
}

async function getBandWithRetry(input: {id?: string; bandId?: string}) {
  const client = getServerSanityClient()

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const band = await client.fetch<PublicBand | null>(
      input.id ? bandByDocumentIdQuery : bandByBandIdQuery,
      input.id ? {id: input.id} : {bandId: input.bandId}
    )

    if (!band || band.lastSyncedAt || attempt === 3) {
      return band
    }

    await wait(300 * (attempt + 1))
  }

  return null
}
