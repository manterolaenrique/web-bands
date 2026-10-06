import {describe, expect, it} from 'vitest'

import {normalizePrivateAssetMimeType} from './press-kit-api'

describe('normalizePrivateAssetMimeType', () => {
  it('infers PNG when Windows does not provide a MIME type', () => {
    expect(normalizePrivateAssetMimeType({name: 'Logo Final.PNG', type: ''})).toBe('image/png')
  })

  it('infers PDF when the browser does not provide a MIME type', () => {
    expect(normalizePrivateAssetMimeType({name: 'rider-tecnico.pdf', type: ''})).toBe('application/pdf')
  })

  it('preserves and normalizes a browser MIME type', () => {
    expect(normalizePrivateAssetMimeType({name: 'logo.png', type: 'IMAGE/PNG'})).toBe('image/png')
  })
})
