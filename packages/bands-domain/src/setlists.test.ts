import {describe, expect, it} from 'vitest'

import {
  bandSetlistItemCreateSchema,
  bandSetlistItemOrderSchema,
  bandSetlistSchema,
  toBandShowPrefills,
} from './setlists'

describe('bandSetlistSchema', () => {
  it('accepts empty optional fields as undefined', () => {
    const parsed = bandSetlistSchema.parse({
      title: '',
      showDate: '2026-08-20',
      venueName: 'Groove',
      location: '',
      pressLogoAssetId: '',
      linkedShowKey: '',
    })

    expect(parsed.title).toBeUndefined()
    expect(parsed.location).toBeUndefined()
    expect(parsed.pressLogoAssetId).toBeUndefined()
    expect(parsed.printFontPreset).toBe('modern')
    expect(parsed.printAllCaps).toBe(false)
    expect(parsed.linkedShowKey).toBeUndefined()
  })

  it('accepts an explicit print style selection', () => {
    const parsed = bandSetlistSchema.parse({
      showDate: '2026-08-20',
      venueName: 'Groove',
      pressLogoAssetId: '',
      printFontPreset: 'stage',
      printAllCaps: true,
    })

    expect(parsed.printFontPreset).toBe('stage')
    expect(parsed.printAllCaps).toBe(true)
  })
})

describe('bandSetlistItemCreateSchema', () => {
  it('validates block labels', () => {
    const parsed = bandSetlistItemCreateSchema.parse({
      itemType: 'block',
      blockLabel: 'Bis',
      notesOverride: '',
    })

    expect(parsed.itemType).toBe('block')
    expect(parsed.notesOverride).toBeUndefined()
  })

  it('accepts an exact zero-based insertion index', () => {
    const parsed = bandSetlistItemCreateSchema.parse({
      itemType: 'song',
      songId: '00000000-0000-4000-8000-000000000001',
      insertIndex: 3,
    })

    expect(parsed.insertIndex).toBe(3)
  })

  it('rejects negative insertion indexes', () => {
    expect(() =>
      bandSetlistItemCreateSchema.parse({
        itemType: 'song',
        songId: '00000000-0000-4000-8000-000000000001',
        insertIndex: -1,
      })
    ).toThrow()
  })
})

describe('bandSetlistItemOrderSchema', () => {
  it('requires at least one ordered item id', () => {
    expect(() => bandSetlistItemOrderSchema.parse({orderedItemIds: []})).toThrow()
  })
})

describe('toBandShowPrefills', () => {
  it('filters incomplete shows and preserves keys', () => {
    const result = toBandShowPrefills([
      {_key: 'show-1', date: '2026-08-20', venue: 'Teatro Vorterix', location: 'Buenos Aires'},
      {date: '2026-08-21', venue: ''},
    ])

    expect(result).toEqual([
      {
        key: 'show-1',
        date: '2026-08-20',
        venue: 'Teatro Vorterix',
        location: 'Buenos Aires',
        status: undefined,
      },
    ])
  })
})
