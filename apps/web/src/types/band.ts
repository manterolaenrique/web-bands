export type BandStatus = 'draft' | 'published' | 'archived'
export type BandVisibility = 'public' | 'unlisted' | 'private'
export type BandMemberRole = 'owner' | 'admin' | 'editor' | 'viewer'

export type SanityImage = {
  _type?: 'image'
  asset?: {
    _type?: 'reference'
    _ref?: string
  }
}

export type PublicBandListItem = {
  _id: string
  bandId?: string
  nombre?: string
  genero?: string
  slug?: {
    current?: string
  }
  logo?: SanityImage
  logo_favicon?: SanityImage
  heroImage?: SanityImage
  heroTitle?: string
  status?: BandStatus
  visibility?: BandVisibility
}

export type PublicBand = PublicBandListItem & {
  lastSyncedAt?: string
  colores?: {
    primario?: string
    secundario?: string
    secundario_claro?: string
    acento?: string
  }
  hero?: {
    titulo?: string
    subtitulo?: string
    imagen?: SanityImage
    descripcion?: string
  }
  about?: {
    titulo?: string
    contenido?: string
    imagen?: SanityImage
    integrantes?: Array<{
      _key?: string
      nombre?: string
      instrumento?: string
      foto?: SanityImage
    }>
  }
  timelineSection?: {
    enabled?: boolean
    titulo?: string
    descripcion?: string
    events?: Array<{
      _key?: string
      name?: string
      date?: string
      importance?: string
      image?: SanityImage
      descripcion?: string
      link?: string
      icon?: string
    }>
  }
  contacto?: {
    email?: string
    telefono?: string
    ubicacion?: string
    redes?: Record<string, string | undefined>
  }
  escuchanos?: {
    titulo?: string
    descripcion?: string
    youtube?: {
      habilitado?: boolean
      titulo?: string
      videos?: Array<{
        _key?: string
        titulo?: string
        url?: string
        descripcion?: string
      }>
    }
    spotify?: {
      habilitado?: boolean
      titulo?: string
      perfil_url?: string
      playlists?: Array<{
        _key?: string
        titulo?: string
        url?: string
        descripcion?: string
      }>
    }
  }
  seo?: {
    titulo_seo?: string
    descripcion_seo?: string
    palabras_clave?: string[]
  }
}

export type SupabaseBand = {
  id: string
  slug: string
  name: string
  sanity_document_id: string | null
  status: BandStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export type BandProfile = {
  id: string
  email: string
  display_name: string | null
}

export type BandMemberSummary = {
  bandId: string
  userId: string
  role: BandMemberRole
  createdAt: string
  profile: BandProfile | null
}

export type BandInviteSummary = {
  id: string
  bandId: string
  email: string
  role: BandMemberRole
  token: string
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
  band?: Pick<SupabaseBand, 'id' | 'name' | 'slug' | 'status'>
}
