import {normalizeBandSectionOrder} from '@/lib/bands/presentation'
import type {BandEditorValues} from '@/lib/bands/editor'
import type {PublicBand} from '@/types/band'

export function createPublicBandDraft(values: BandEditorValues, baseBand?: PublicBand | null): PublicBand {
  return {
    _id: baseBand?._id || `draft-${values.slug || 'band'}`,
    bandId: baseBand?.bandId,
    nombre: values.name,
    genero: values.genre,
    slug: {
      current: values.slug,
    },
    logo: baseBand?.logo,
    logo_favicon: baseBand?.logo_favicon,
    lastSyncedAt: baseBand?.lastSyncedAt,
    presentation: {
      sectionOrder: normalizeBandSectionOrder(values.presentation.sectionOrder),
    },
    colores: {
      primario: values.colors.primary,
      secundario: values.colors.secondary,
      secundario_claro: values.colors.secondaryLight,
      acento: values.colors.accent,
    },
    status: values.status,
    visibility: baseBand?.visibility,
    hero: {
      titulo: values.hero.title,
      subtitulo: values.hero.subtitle,
      imagen: baseBand?.hero?.imagen,
      descripcion: values.hero.description,
      showSpotlightCard: values.hero.showSpotlightCard,
    },
    about: {
      titulo: values.about.title,
      contenido: values.about.content,
      imagen: baseBand?.about?.imagen,
      integrantes: values.about.integrantes,
    },
    timelineSection: {
      enabled: values.timelineSection.enabled,
      titulo: values.timelineSection.titulo,
      descripcion: values.timelineSection.descripcion,
      events: values.timelineSection.events,
    },
    contacto: {
      email: values.contact.email,
      telefono: values.contact.phone,
      ubicacion: values.contact.location,
      redes: {
        instagram: values.contact.instagram,
        youtube: values.contact.youtube,
        facebook: values.contact.facebook,
        twitter: values.contact.twitter,
        spotify: values.contact.spotify,
        tiktok: values.contact.tiktok,
      },
    },
    escuchanos: {
      titulo: values.escuchanos.titulo,
      descripcion: values.escuchanos.descripcion,
      youtube: {
        habilitado: values.escuchanos.youtube.habilitado,
        titulo: values.escuchanos.youtube.titulo,
        videos: values.escuchanos.youtube.videos,
      },
      spotify: {
        habilitado: values.escuchanos.spotify.habilitado,
        titulo: values.escuchanos.spotify.titulo,
        perfil_url: values.escuchanos.spotify.perfil_url,
        playlists: values.escuchanos.spotify.playlists,
      },
    },
    featuredRelease: {
      eyebrow: values.featuredRelease.eyebrow,
      title: values.featuredRelease.title,
      description: values.featuredRelease.description,
      coverImage: values.featuredRelease.coverImage || baseBand?.featuredRelease?.coverImage,
      spotifyUrl: values.featuredRelease.spotifyUrl,
      youtubeUrl: values.featuredRelease.youtubeUrl,
      appleMusicUrl: values.featuredRelease.appleMusicUrl,
    },
    showsSection: {
      titulo: values.showsSection.titulo,
      descripcion: values.showsSection.descripcion,
      shows: values.showsSection.shows,
    },
    gallerySection: {
      titulo: values.gallerySection.titulo,
      items: values.gallerySection.items,
    },
    seo: {
      titulo_seo: values.seo.title,
      descripcion_seo: values.seo.description,
      palabras_clave: values.seo.keywords,
    },
  }
}
