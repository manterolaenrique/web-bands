import {describe, expect, it} from 'vitest'

import {buildBandThemeStyle, resolveBandThemeTokens} from '@/lib/bands/theme'

describe('resolveBandThemeTokens', () => {
  it('uses band colors when provided', () => {
    const tokens = resolveBandThemeTokens({
      primario: '#111827',
      secundario: '#22d3ee',
      secundario_claro: '#7dd3fc',
      acento: '#f59e0b',
    })

    expect(tokens.primary).toBe('#111827')
    expect(tokens.secondary).toBe('#22d3ee')
    expect(tokens.secondaryLight).toBe('#7dd3fc')
    expect(tokens.accent).toBe('#f59e0b')
  })

  it('derives missing accent and light tokens from fallbacks', () => {
    const tokens = resolveBandThemeTokens({
      primario: '#0f172a',
      secundario: '#38bdf8',
    })

    expect(tokens.accent).toMatch(/^#/)
    expect(tokens.secondaryLight).toMatch(/^#/)
    expect(tokens.primaryGlow).toContain('rgba(')
    expect(tokens.secondaryGlow).toContain('rgba(')
  })
})

describe('buildBandThemeStyle', () => {
  it('creates css variables for themed public pages', () => {
    const style = buildBandThemeStyle({
      primario: '#312e81',
      secundario: '#06b6d4',
    }) as Record<string, string>

    expect(style['--band-primary']).toBe('#312e81')
    expect(style['--band-secondary']).toBe('#06b6d4')
    expect(style['--band-accent']).toBeTruthy()
  })
})
