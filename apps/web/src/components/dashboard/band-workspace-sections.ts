export type BandWorkspaceSectionKey = 'summary' | 'site' | 'demos' | 'setlists' | 'press-kit' | 'team'
export type BandWorkspaceGroupKey = 'public' | 'private' | 'admin'

type BandWorkspaceSectionDefinition = {
  key: BandWorkspaceSectionKey
  label: string
  title: string
  description: string
  group: BandWorkspaceGroupKey
  requiresManage?: boolean
}

const BAND_WORKSPACE_SECTIONS: BandWorkspaceSectionDefinition[] = [
  {
    key: 'summary',
    label: 'Resumen',
    title: 'Resumen de la banda',
    description: 'Entrada principal para entender rapido el estado, los accesos y las herramientas disponibles.',
    group: 'public',
  },
  {
    key: 'site',
    label: 'Sitio publico',
    title: 'Sitio publico',
    description: 'Edita la web publica, sus secciones, imagenes, bio, shows y vista previa.',
    group: 'public',
  },
  {
    key: 'demos',
    label: 'Demos',
    title: 'Demos privados',
    description: 'Audios privados, playlists, referencias y subidas para trabajar puertas adentro.',
    group: 'private',
  },
  {
    key: 'setlists',
    label: 'Setlists',
    title: 'Setlists privadas',
    description: 'Hojas por fecha, biblioteca de temas y armado A4 listo para escenario.',
    group: 'private',
  },
  {
    key: 'press-kit',
    label: 'Centro de prensa',
    title: 'Centro de prensa',
    description: 'Logos PNG, biografias y recursos privados listos para copiar, descargar o compartir.',
    group: 'private',
  },
  {
    key: 'team',
    label: 'Equipo',
    title: 'Equipo y permisos',
    description: 'Gestiona miembros, roles e invitaciones para la parte privada de la banda.',
    group: 'admin',
    requiresManage: true,
  },
]

export function getBandWorkspaceSectionHref(bandId: string, section: BandWorkspaceSectionKey) {
  if (section === 'summary') {
    return `/dashboard/bands/${bandId}`
  }

  if (section === 'site') {
    return `/dashboard/bands/${bandId}/site`
  }

  return `/dashboard/bands/${bandId}/${section}`
}

export function getBandWorkspaceSection(section: BandWorkspaceSectionKey) {
  return BAND_WORKSPACE_SECTIONS.find((item) => item.key === section) || BAND_WORKSPACE_SECTIONS[0]
}

export function getVisibleBandWorkspaceSections(bandId: string, canManage: boolean) {
  return BAND_WORKSPACE_SECTIONS.filter((section) => !section.requiresManage || canManage).map((section) => ({
    ...section,
    href: getBandWorkspaceSectionHref(bandId, section.key),
  }))
}

export function getBandWorkspaceSectionsByGroup(bandId: string, canManage: boolean, group: BandWorkspaceGroupKey) {
  return getVisibleBandWorkspaceSections(bandId, canManage).filter((section) => section.group === group)
}
