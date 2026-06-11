import type {BandInternalKitLinkKind, BandPublicSectionKey} from './presentation'
import type {BandStatus, SanityImage} from './types'

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

export type BandEditorInternalKitLink = {
  _key: string
  label: string
  url: string
  kind: BandInternalKitLinkKind
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
  presentation: {
    sectionOrder: BandPublicSectionKey[]
  }
  internalKit: {
    shortPitch?: string
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    bookingNotes?: string
    keyLinks: BandEditorInternalKitLink[]
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
