export const BAND_PUBLIC_SECTION_KEYS = [
  'featured',
  'listen',
  'about',
  'members',
  'timeline',
  'shows',
  'gallery',
  'contact',
] as const

export type BandPublicSectionKey = (typeof BAND_PUBLIC_SECTION_KEYS)[number]

export const DEFAULT_BAND_SECTION_ORDER: BandPublicSectionKey[] = [...BAND_PUBLIC_SECTION_KEYS]

export const BAND_INTERNAL_KIT_LINK_KINDS = [
  'press',
  'demo',
  'drive',
  'instagram',
  'spotify',
  'youtube',
  'other',
] as const

export type BandInternalKitLinkKind = (typeof BAND_INTERNAL_KIT_LINK_KINDS)[number]

export function isBandPublicSectionKey(value: string): value is BandPublicSectionKey {
  return BAND_PUBLIC_SECTION_KEYS.includes(value as BandPublicSectionKey)
}

export function normalizeBandSectionOrder(
  input?: string[] | readonly string[] | null
): BandPublicSectionKey[] {
  const seen = new Set<BandPublicSectionKey>()
  const normalized: BandPublicSectionKey[] = []

  for (const value of input || []) {
    if (isBandPublicSectionKey(value) && !seen.has(value)) {
      normalized.push(value)
      seen.add(value)
    }
  }

  for (const key of DEFAULT_BAND_SECTION_ORDER) {
    if (!seen.has(key)) {
      normalized.push(key)
    }
  }

  return normalized
}
