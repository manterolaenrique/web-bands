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
  'ðŸŽ¤',
  'ðŸ’¿',
  'ðŸŽµ',
  'ðŸŽ¬',
  'ðŸŽ¸',
  'ðŸ¥',
  'ðŸŽ¹',
  'ðŸŽº',
  'ðŸŽ»',
  'ðŸŽ§',
  'ðŸ“»',
  'ðŸŽ™ï¸',
  'ðŸŽšï¸',
  'ðŸŽ›ï¸',
  'ðŸŽ¼',
  'ðŸŽ·',
  'ðŸª•',
  'ðŸª˜',
  'ðŸª—',
  'ðŸ“…',
  'â­',
  'ðŸŽ¯',
  'ðŸ“Œ',
  'ðŸ†',
  'ðŸšŒ',
  'ðŸ¤',
  'ðŸŽª',
  'ðŸŽ­',
  'ðŸŽ¨',
  'ðŸ“º',
  'ðŸ“±',
  'ðŸ’»',
  'ðŸŒ',
  'ðŸ›ï¸',
  'ðŸŽ¡',
  'ðŸŽ¢',
  'ðŸŽ ',
  'ðŸŽ£',
  'ðŸŽ¤ðŸŽµ',
  'ðŸ’¿ðŸŽµ',
  'ðŸŽ¸ðŸŽ¤',
  'ðŸ¥ðŸŽµ',
  'ðŸŽ¹ðŸŽ¼',
  'ðŸŽºðŸŽ·',
  'ðŸŽ»ðŸŽ¼',
  'ðŸŽ§ðŸŽµ',
  'ðŸ“»ðŸŽµ',
  'ðŸŽ™ï¸ðŸŽšï¸',
  'ðŸŽ¼ðŸŽµ',
  'ðŸŽªðŸŽ­',
  'ðŸ†â­',
  'ðŸšŒðŸŒ',
  'ðŸ¤ðŸŽµ',
  'ðŸ“…â­',
  'ðŸŽ¤ðŸ†',
  'ðŸ’¿ðŸ†',
  'ðŸŽµðŸ†',
  'ðŸŽ¬ðŸ†',
  'ðŸŽ¸ðŸ†',
  'ðŸŽªðŸ†',
  'ðŸŽ­ðŸ†',
  'ðŸŽ¨ðŸ†',
  'ðŸ“ºðŸ†',
  'ðŸ“±ðŸ†',
  'ðŸ’»ðŸ†',
  'ðŸŒðŸ†',
  'ðŸ›ï¸ðŸ†',
  'ðŸŽ¡ðŸ†',
  'ðŸŽ¢ðŸ†',
  'ðŸŽ ðŸ†',
  'ðŸŽ£ðŸ†',
] as const

export type TimelineIcon = (typeof TIMELINE_ICON_VALUES)[number]

export const TIMELINE_ICON_OPTIONS: Array<{
  value: TimelineIcon
  label: string
}> = TIMELINE_ICON_VALUES.map((value) => ({
  value,
  label: value,
}))

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
