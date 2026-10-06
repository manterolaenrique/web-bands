import type {BandSetlistPrintPayload} from '@web-bands/bands-domain'
import {describe, expect, it} from 'vitest'

import {renderBandSetlistPdf} from './setlist-pdf'

function buildPayload(itemCount: number): BandSetlistPrintPayload {
  return {
    role: 'owner',
    band: {
      id: 'band-1',
      name: 'Viejas Runas',
      slug: 'viejas-runas',
      status: 'published',
    },
    setlist: {
      id: 'setlist-1',
      bandId: 'band-1',
      title: 'Ciclo Lunatico',
      showDate: '2026-08-28',
      venueName: 'Hipico',
      location: 'Buenos Aires',
      printFontPreset: 'stage',
      printAllCaps: true,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
      createdBy: 'user-1',
      updatedBy: 'user-1',
      itemCount,
      items: Array.from({length: itemCount}, (_, index) => ({
        id: `item-${index}`,
        setlistId: 'setlist-1',
        sortOrder: index + 1,
        itemType: index === 6 ? ('block' as const) : ('song' as const),
        songTitleSnapshot: index === 6 ? undefined : `Tema de prueba ${index + 1}`,
        blockLabel: index === 6 ? 'Bis' : undefined,
        notesOverride: index % 5 === 0 ? 'Cover' : undefined,
        createdAt: '2026-08-01T00:00:00.000Z',
      })),
    },
    logo: null,
  }
}

describe('renderBandSetlistPdf', () => {
  it('creates a valid multipage PDF without browser chrome', async () => {
    const pdf = await renderBandSetlistPdf(buildPayload(50))
    const text = pdf.toString('latin1')

    expect(text.startsWith('%PDF-')).toBe(true)
    expect(pdf.byteLength).toBeGreaterThan(5000)
    expect(text).not.toContain('file:///')
  })
})
