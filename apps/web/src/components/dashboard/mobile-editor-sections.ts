export type MobileEditorSectionKey =
  | 'overview'
  | 'general'
  | 'images'
  | 'bio'
  | 'members'
  | 'social'
  | 'shows'
  | 'team'
  | 'preview'

export const MOBILE_EDITOR_SECTIONS: Record<
  MobileEditorSectionKey,
  {
    label: string
    title: string
    description: string
  }
> = {
  overview: {
    label: 'Indice',
    title: 'Indice del editor',
    description: 'Entradas compactas para editar la banda desde el celular sin usar un formulario gigante.',
  },
  general: {
    label: 'General',
    title: 'Datos generales',
    description: 'Nombre, slug, estado, identidad visual, orden publico y metadata base.',
  },
  images: {
    label: 'Imagenes',
    title: 'Imagenes',
    description: 'Logo, favicon, portada, bloque visual, galeria y uploads principales.',
  },
  bio: {
    label: 'Bio',
    title: 'Biografia y portada',
    description: 'Hero, historia principal y timeline publico.',
  },
  members: {
    label: 'Integrantes',
    title: 'Integrantes',
    description: 'Miembros, orden, datos y fotos para la pagina publica.',
  },
  social: {
    label: 'Redes',
    title: 'Redes y musica',
    description: 'Contacto, redes oficiales, escuchanos y lanzamiento destacado.',
  },
  shows: {
    label: 'Shows',
    title: 'Shows y fechas',
    description: 'Fechas, venues y links de entradas.',
  },
  team: {
    label: 'Equipo',
    title: 'Equipo y permisos',
    description: 'Invitaciones, roles y acceso privado de la banda para admins y owners.',
  },
  preview: {
    label: 'Preview',
    title: 'Vista previa',
    description: 'Chequeo visual de la pagina publica con el mismo renderer actual.',
  },
}

export function isMobileEditorSectionKey(value: string): value is MobileEditorSectionKey {
  return value in MOBILE_EDITOR_SECTIONS
}

export function getMobileEditorHref(bandId: string, section: MobileEditorSectionKey) {
  if (section === 'overview') {
    return `/dashboard/bands/${bandId}`
  }

  return `/dashboard/bands/${bandId}/${section}`
}
