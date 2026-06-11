import {describe, expect, it} from 'vitest'

import {normalizeBandSectionOrder} from '@/lib/bands/presentation'

describe('normalizeBandSectionOrder', () => {
  it('keeps valid unique values and appends missing defaults', () => {
    expect(normalizeBandSectionOrder(['members', 'listen', 'members', 'contact'])).toEqual([
      'members',
      'listen',
      'contact',
      'featured',
      'about',
      'timeline',
      'shows',
      'gallery',
    ])
  })

  it('falls back to the default order when the input is empty', () => {
    expect(normalizeBandSectionOrder()).toEqual([
      'featured',
      'listen',
      'about',
      'members',
      'timeline',
      'shows',
      'gallery',
      'contact',
    ])
  })
})
