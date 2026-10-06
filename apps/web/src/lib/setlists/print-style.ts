import type {BandSetlistPrintFontPreset} from '@web-bands/bands-domain'

export const SETLIST_PRINT_FONT_LABELS: Record<BandSetlistPrintFontPreset, string> = {
  modern: 'Modern',
  stage: 'Stage',
  editorial: 'Editorial',
}

export function getSetlistPrintPaperClassName(
  printFontPreset: BandSetlistPrintFontPreset,
  printAllCaps: boolean
) {
  return `setlist-print-paper setlist-print-paper--font-${printFontPreset}${printAllCaps ? ' setlist-print-paper--caps' : ''}`
}
