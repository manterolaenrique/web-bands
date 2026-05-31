export const MAX_TIMELINE_EVENTS = 10

export const TIMELINE_IMPORTANCE_VALUES = ['principal', 'secundario', 'tercero'] as const

export type TimelineImportance = (typeof TIMELINE_IMPORTANCE_VALUES)[number]

export const TIMELINE_IMPORTANCE_OPTIONS: Array<{
  value: TimelineImportance
  label: string
}> = [
  {value: 'principal', label: 'Principal'},
  {value: 'secundario', label: 'Secundario'},
  {value: 'tercero', label: 'Tercero'},
]

export const TIMELINE_ICON_VALUES = [
  '🎤',
  '💿',
  '🎵',
  '🎬',
  '🎸',
  '🥁',
  '🎹',
  '🎺',
  '🎻',
  '🎧',
  '📻',
  '🎙️',
  '🎚️',
  '🎛️',
  '🎼',
  '🎷',
  '🪕',
  '🪘',
  '🪗',
  '📅',
  '⭐',
  '🎯',
  '📌',
  '🏆',
  '🚌',
  '🤝',
  '🎪',
  '🎭',
  '🎨',
  '📺',
  '📱',
  '💻',
  '🌐',
  '🏛️',
  '🎡',
  '🎢',
  '🎠',
  '🎣',
  '🎤🎵',
  '💿🎵',
  '🎸🎤',
  '🥁🎵',
  '🎹🎼',
  '🎺🎷',
  '🎻🎼',
  '🎧🎵',
  '📻🎵',
  '🎙️🎚️',
  '🎼🎵',
  '🎪🎭',
  '🏆⭐',
  '🚌🌐',
  '🤝🎵',
  '📅⭐',
  '🎤🏆',
  '💿🏆',
  '🎵🏆',
  '🎬🏆',
  '🎸🏆',
  '🎪🏆',
  '🎭🏆',
  '🎨🏆',
  '📺🏆',
  '📱🏆',
  '💻🏆',
  '🌐🏆',
  '🏛️🏆',
  '🎡🏆',
  '🎢🏆',
  '🎠🏆',
  '🎣🏆',
] as const

export type TimelineIcon = (typeof TIMELINE_ICON_VALUES)[number]

export const TIMELINE_ICON_OPTIONS: Array<{
  value: TimelineIcon
  label: string
}> = [
  {value: '🎤', label: '🎤 Micrófono (Concierto/Show)'},
  {value: '💿', label: '💿 Disco (Álbum/CD)'},
  {value: '🎵', label: '🎵 Nota musical (Single/Canción)'},
  {value: '🎬', label: '🎬 Cámara (Video/Clip)'},
  {value: '🎸', label: '🎸 Guitarra (Inicio/Formación)'},
  {value: '🥁', label: '🥁 Tambor (Batería/Ritmo)'},
  {value: '🎹', label: '🎹 Piano (Teclado/Instrumental)'},
  {value: '🎺', label: '🎺 Trompeta (Vientos)'},
  {value: '🎻', label: '🎻 Violín (Cuerdas)'},
  {value: '🎧', label: '🎧 Auriculares (Escuchar)'},
  {value: '📻', label: '📻 Radio (Transmisión)'},
  {value: '🎙️', label: '🎙️ Micrófono de estudio (Grabación)'},
  {value: '🎚️', label: '🎚️ Control de mezcla (Producción)'},
  {value: '🎛️', label: '🎛️ Control de volumen (Audio)'},
  {value: '🎼', label: '🎼 Partitura (Composición)'},
  {value: '🎷', label: '🎷 Saxofón (Jazz/Fusion)'},
  {value: '🪕', label: '🪕 Banjo/Mandolina (Folk)'},
  {value: '🪘', label: '🪘 Gong/Percusión'},
  {value: '🪗', label: '🪗 Acordeón (Tango/Folk)'},
  {value: '📅', label: '📅 Calendario (Fecha/Evento)'},
  {value: '⭐', label: '⭐ Estrella (Principal)'},
  {value: '🎯', label: '🎯 Diana (Secundario)'},
  {value: '📌', label: '📌 Pin (General)'},
  {value: '🏆', label: '🏆 Trofeo (Premio/Reconocimiento)'},
  {value: '🚌', label: '🚌 Autobús (Tour/Gira)'},
  {value: '🤝', label: '🤝 Apretón de manos (Colaboración)'},
  {value: '🎪', label: '🎪 Carpa (Festival)'},
  {value: '🎭', label: '🎭 Máscaras (Teatro/Show)'},
  {value: '🎨', label: '🎨 Paleta (Arte/Creatividad)'},
  {value: '📺', label: '📺 TV (Televisión)'},
  {value: '📱', label: '📱 Móvil (Digital/App)'},
  {value: '💻', label: '💻 Computadora (Online/Digital)'},
  {value: '🌐', label: '🌐 Mundo (Internacional)'},
  {value: '🏛️', label: '🏛️ Edificio (Venue/Lugar)'},
  {value: '🎡', label: '🎡 Rueda de la fortuna (Feria)'},
  {value: '🎢', label: '🎢 Montaña rusa (Aventura)'},
  {value: '🎠', label: '🎠 Caballito (Nostalgia)'},
  {value: '🎣', label: '🎣 Caña de pescar (Paciencia)'},
  {value: '🎤🎵', label: '🎤🎵 Micrófono con nota (Live)'},
  {value: '💿🎵', label: '💿🎵 Disco con nota (Álbum)'},
  {value: '🎸🎤', label: '🎸🎤 Guitarra con micrófono (Rock)'},
  {value: '🥁🎵', label: '🥁🎵 Tambor con nota (Ritmo)'},
  {value: '🎹🎼', label: '🎹🎼 Piano con partitura (Clásico)'},
  {value: '🎺🎷', label: '🎺🎷 Trompeta y saxofón (Jazz)'},
  {value: '🎻🎼', label: '🎻🎼 Violín con partitura (Orquesta)'},
  {value: '🎧🎵', label: '🎧🎵 Auriculares con nota (Escuchar)'},
  {value: '📻🎵', label: '📻🎵 Radio con nota (Transmisión)'},
  {value: '🎙️🎚️', label: '🎙️🎚️ Micrófono con controles (Grabación)'},
  {value: '🎼🎵', label: '🎼🎵 Partitura con nota (Composición)'},
  {value: '🎪🎭', label: '🎪🎭 Carpa con máscaras (Festival)'},
  {value: '🏆⭐', label: '🏆⭐ Trofeo con estrella (Premio principal)'},
  {value: '🚌🌐', label: '🚌🌐 Autobús con mundo (Gira internacional)'},
  {value: '🤝🎵', label: '🤝🎵 Apretón con nota (Colaboración musical)'},
  {value: '📅⭐', label: '📅⭐ Calendario con estrella (Fecha importante)'},
  {value: '🎤🏆', label: '🎤🏆 Micrófono con trofeo (Concierto premiado)'},
  {value: '💿🏆', label: '💿🏆 Disco con trofeo (Álbum premiado)'},
  {value: '🎵🏆', label: '🎵🏆 Nota con trofeo (Canción premiada)'},
  {value: '🎬🏆', label: '🎬🏆 Cámara con trofeo (Video premiado)'},
  {value: '🎸🏆', label: '🎸🏆 Guitarra con trofeo (Instrumento premiado)'},
  {value: '🎪🏆', label: '🎪🏆 Carpa con trofeo (Festival premiado)'},
  {value: '🎭🏆', label: '🎭🏆 Máscaras con trofeo (Show premiado)'},
  {value: '🎨🏆', label: '🎨🏆 Paleta con trofeo (Arte premiado)'},
  {value: '📺🏆', label: '📺🏆 TV con trofeo (Televisión premiada)'},
  {value: '📱🏆', label: '📱🏆 Móvil con trofeo (Digital premiado)'},
  {value: '💻🏆', label: '💻🏆 Computadora con trofeo (Online premiado)'},
  {value: '🌐🏆', label: '🌐🏆 Mundo con trofeo (Internacional premiado)'},
  {value: '🏛️🏆', label: '🏛️🏆 Edificio con trofeo (Venue premiado)'},
  {value: '🎡🏆', label: '🎡🏆 Rueda con trofeo (Feria premiada)'},
  {value: '🎢🏆', label: '🎢🏆 Montaña rusa con trofeo (Aventura premiada)'},
  {value: '🎠🏆', label: '🎠🏆 Caballito con trofeo (Nostalgia premiada)'},
  {value: '🎣🏆', label: '🎣🏆 Caña con trofeo (Paciencia premiada)'},
]

export function createBandEditorKey(prefix = 'item') {
  return `${prefix}-${crypto.randomUUID()}`
}

export function formatTimelineDateForInput(value?: string) {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toISOString().slice(0, 10)
}
