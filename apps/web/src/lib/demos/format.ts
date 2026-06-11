import type {BandAudioTrackStatus, BandAudioTrackType} from '@web-bands/bands-domain'

const TRACK_TYPE_LABELS: Record<BandAudioTrackType, string> = {
  idea: 'Idea',
  riff: 'Riff',
  demo: 'Demo',
  ensayo: 'Ensayo',
  pre_mezcla: 'Pre mezcla',
  mezcla: 'Mezcla',
  final: 'Final',
  referencia: 'Referencia',
}

const TRACK_STATUS_LABELS: Record<BandAudioTrackStatus, string> = {
  nuevo: 'Nuevo',
  en_revision: 'En revision',
  para_ensayar: 'Para ensayar',
  aprobado: 'Aprobado',
  descartado: 'Descartado',
  final: 'Final',
}

export function getTrackTypeLabel(value: BandAudioTrackType) {
  return TRACK_TYPE_LABELS[value]
}

export function getTrackStatusLabel(value: BandAudioTrackStatus) {
  return TRACK_STATUS_LABELS[value]
}

export function formatTrackDuration(value: number | null | undefined) {
  if (!value || value <= 0) {
    return '--:--'
  }

  const minutes = Math.floor(value / 60)
  const seconds = value % 60
  return `${minutes}:${`${seconds}`.padStart(2, '0')}`
}

export function formatCompactDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha'
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
  }).format(date)
}

export function formatLongDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha'
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
