import type {BandStatus} from '@/types/band'

export function isBandPublic(status: BandStatus | string | null | undefined) {
  return status === 'published'
}

export function getBandStatusLabel(status: BandStatus | string | null | undefined) {
  switch (status) {
    case 'published':
      return 'Publicada'
    case 'archived':
      return 'Archivada'
    case 'draft':
    default:
      return 'Borrador'
  }
}

export function getBandStatusTone(status: BandStatus | string | null | undefined) {
  switch (status) {
    case 'published':
      return 'success'
    case 'archived':
      return 'muted'
    case 'draft':
    default:
      return 'warning'
  }
}

export function getBandVisibilityLabel(status: BandStatus | string | null | undefined) {
  return isBandPublic(status) ? 'Publica' : 'Privada'
}

export function getBandVisibilityMessage(status: BandStatus | string | null | undefined) {
  return isBandPublic(status)
    ? 'La banda ya puede verse desde su URL publica.'
    : 'La banda no se muestra en el directorio publico hasta pasar a Publicada.'
}
