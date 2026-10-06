import {describe, expect, it} from 'vitest'

import {formatCompactSetlistDate, formatSetlistDate} from './format'

describe('setlist date formatting', () => {
  it('keeps date-only values stable outside UTC', () => {
    expect(formatCompactSetlistDate('2026-10-09')).toBe('09-oct')
    expect(formatSetlistDate('2026-10-09')).toBe('09 de octubre de 2026')
  })
})
