import {describe, expect, it} from 'vitest'

import {slugifyBandName} from '@/lib/bands/slug'

describe('slugifyBandName', () => {
  it('normalizes accents and punctuation', () => {
    expect(slugifyBandName('Árbol & Rock!!')).toBe('arbol-rock')
  })

  it('trims repeated hyphens', () => {
    expect(slugifyBandName('  Demo   Band  ')).toBe('demo-band')
  })
})
