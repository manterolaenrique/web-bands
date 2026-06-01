import type {CSSProperties} from 'react'

import type {PublicBand} from '@/types/band'

const GLOBAL_THEME = {
  primary: '#ddb7ff',
  secondary: '#5de6ff',
  accent: '#fabc4e',
}

function normalizeHex(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback
  }

  const trimmed = value.trim()
  if (/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(trimmed)) {
    return trimmed
  }

  return fallback
}

function toRgb(hex: string) {
  const normalized = hex.replace('#', '')
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized

  const channels = expanded.match(/.{1,2}/g)
  if (!channels || channels.length !== 3) {
    return {r: 0, g: 0, b: 0}
  }

  return {
    r: Number.parseInt(channels[0], 16),
    g: Number.parseInt(channels[1], 16),
    b: Number.parseInt(channels[2], 16),
  }
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function toHex({r, g, b}: {r: number; g: number; b: number}) {
  return `#${[r, g, b]
    .map((value) => clampChannel(value).toString(16).padStart(2, '0'))
    .join('')}`
}

function mixHex(colorA: string, colorB: string, ratio: number) {
  const left = toRgb(colorA)
  const right = toRgb(colorB)
  const mix = {
    r: left.r + (right.r - left.r) * ratio,
    g: left.g + (right.g - left.g) * ratio,
    b: left.b + (right.b - left.b) * ratio,
  }

  return toHex(mix)
}

function withAlpha(hex: string, alpha: number) {
  const {r, g, b} = toRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function resolveBandThemeTokens(colors?: PublicBand['colores']) {
  const primary = normalizeHex(colors?.primario, GLOBAL_THEME.primary)
  const secondary = normalizeHex(colors?.secundario, GLOBAL_THEME.secondary)
  const accent = normalizeHex(colors?.acento, mixHex(primary, GLOBAL_THEME.accent, 0.5))
  const primaryUi = mixHex(primary, GLOBAL_THEME.primary, 0.58)
  const secondaryUi = mixHex(secondary, GLOBAL_THEME.secondary, 0.42)
  const secondaryLight = normalizeHex(colors?.secundario_claro, mixHex(secondaryUi, '#ffffff', 0.32))

  return {
    primary,
    secondary,
    accent,
    primaryUi,
    secondaryUi,
    secondaryLight,
    primaryGlow: withAlpha(primary, 0.34),
    secondaryGlow: withAlpha(secondary, 0.28),
    accentGlow: withAlpha(accent, 0.22),
    edge: withAlpha(secondaryLight, 0.24),
  }
}

export function buildBandThemeStyle(colors?: PublicBand['colores']) {
  const tokens = resolveBandThemeTokens(colors)

  return {
    '--band-primary': tokens.primary,
    '--band-secondary': tokens.secondary,
    '--band-accent': tokens.accent,
    '--band-primary-ui': tokens.primaryUi,
    '--band-secondary-ui': tokens.secondaryUi,
    '--band-secondary-light': tokens.secondaryLight,
    '--band-primary-glow': tokens.primaryGlow,
    '--band-secondary-glow': tokens.secondaryGlow,
    '--band-accent-glow': tokens.accentGlow,
    '--band-edge': tokens.edge,
  } as CSSProperties
}
