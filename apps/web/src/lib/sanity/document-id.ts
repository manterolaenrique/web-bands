type BandDocumentReference = {
  id: string
  sanity_document_id: string | null
}

export function getBandDocumentId(bandId: string) {
  return `banda-${bandId}`
}

export function isLegacyBandDocumentId(documentId: string | null | undefined) {
  return Boolean(documentId?.startsWith('banda.'))
}

export function resolveBandDocumentId(band: BandDocumentReference) {
  if (band.sanity_document_id && !isLegacyBandDocumentId(band.sanity_document_id)) {
    return band.sanity_document_id
  }

  return getBandDocumentId(band.id)
}

export function shouldUpdateBandDocumentId(band: BandDocumentReference, documentId: string) {
  return band.sanity_document_id !== documentId
}
