import {describe, expect, it} from 'vitest'

import {getBandDocumentId, isLegacyBandDocumentId, resolveBandDocumentId} from '@/lib/sanity/document-id'

describe('Sanity band document IDs', () => {
  it('generates public-readable document IDs without dot segments', () => {
    expect(getBandDocumentId('123')).toBe('banda-123')
  })

  it('detects legacy private document IDs', () => {
    expect(isLegacyBandDocumentId('banda.123')).toBe(true)
    expect(isLegacyBandDocumentId('banda-123')).toBe(false)
  })

  it('replaces legacy document IDs with the public-readable format', () => {
    expect(resolveBandDocumentId({id: '123', sanity_document_id: 'banda.123'})).toBe('banda-123')
    expect(resolveBandDocumentId({id: '123', sanity_document_id: 'custom-id'})).toBe('custom-id')
  })
})
