import {z} from 'zod'

import type {BandMemberRole, BandShow} from './types'
import type {BandWorkspaceSummary} from './demos'
import type {BandPrivateAsset} from './press-kit'

const optionalTrimmedString = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional()

const requiredTrimmedString = (min: number, max: number) => z.string().trim().min(min).max(max)

const optionalUuid = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .pipe(z.string().uuid().optional())

const optionalSetlistTitle = z
  .string()
  .trim()
  .max(120)
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional()

export const BAND_SETLIST_ITEM_TYPES = ['song', 'block'] as const
export const BAND_SETLIST_PRINT_FONT_PRESETS = ['modern', 'stage', 'editorial'] as const

export type BandSetlistItemType = (typeof BAND_SETLIST_ITEM_TYPES)[number]
export type BandSetlistPrintFontPreset = (typeof BAND_SETLIST_PRINT_FONT_PRESETS)[number]

export type BandSongLibraryItem = {
  id: string
  bandId: string
  title: string
  defaultNotes?: string
  defaultDurationSeconds?: number | null
  createdAt: string
  updatedAt: string
  createdBy: string
}

export type BandSetlistSummary = {
  id: string
  bandId: string
  title?: string
  showDate: string
  venueName: string
  location?: string
  pressLogoAssetId?: string
  linkedShowKey?: string
  printFontPreset: BandSetlistPrintFontPreset
  printAllCaps: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  itemCount: number
}

export type BandSetlistItem = {
  id: string
  setlistId: string
  sortOrder: number
  itemType: BandSetlistItemType
  songId?: string | null
  songTitleSnapshot?: string
  blockLabel?: string
  notesOverride?: string
  createdAt: string
}

export type BandSetlistDetail = BandSetlistSummary & {
  items: BandSetlistItem[]
}

export type BandShowPrefill = {
  key: string
  date: string
  venue: string
  location?: string
  status?: string
}

export type BandSetlistsHubPayload = {
  role: BandMemberRole
  band: BandWorkspaceSummary
  canEdit: boolean
  canManage: boolean
  publicBandHref: string | null
  initialServerSavedAt: string | null
  songs: BandSongLibraryItem[]
  setlists: BandSetlistSummary[]
  availableLogos: BandPrivateAsset[]
  showPrefills: BandShowPrefill[]
}

export type BandSetlistEditorPayload = BandSetlistsHubPayload & {
  setlist: BandSetlistDetail
}

export type BandSetlistPrintPayload = {
  role: BandMemberRole
  band: BandWorkspaceSummary
  setlist: BandSetlistDetail
  logo: BandPrivateAsset | null
}

export const bandSongLibraryItemSchema = z.object({
  title: requiredTrimmedString(2, 160),
  defaultNotes: optionalTrimmedString(2000),
  defaultDurationSeconds: z.number().int().positive().max(14400).nullable().optional(),
})

export const bandSetlistSchema = z.object({
  title: optionalSetlistTitle,
  showDate: z.string().trim().date(),
  venueName: requiredTrimmedString(2, 160),
  location: optionalTrimmedString(160),
  pressLogoAssetId: optionalUuid,
  printFontPreset: z.enum(BAND_SETLIST_PRINT_FONT_PRESETS).default('modern'),
  printAllCaps: z.boolean().default(false),
  linkedShowKey: z
    .string()
    .trim()
    .max(120)
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional(),
})

export const bandSetlistItemCreateSchema = z.discriminatedUnion('itemType', [
  z.object({
    itemType: z.literal('song'),
    songId: z.string().uuid(),
    notesOverride: optionalTrimmedString(400),
  }),
  z.object({
    itemType: z.literal('block'),
    blockLabel: requiredTrimmedString(2, 80),
    notesOverride: optionalTrimmedString(400),
  }),
])

export const bandSetlistItemUpdateSchema = z.object({
  songId: optionalUuid,
  blockLabel: z
    .string()
    .trim()
    .max(80)
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional(),
  notesOverride: optionalTrimmedString(400),
})

export const bandSetlistItemOrderSchema = z.object({
  orderedItemIds: z.array(z.string().uuid()).min(1),
})

export type BandSongLibraryItemInput = z.infer<typeof bandSongLibraryItemSchema>
export type BandSetlistInput = z.infer<typeof bandSetlistSchema>
export type BandSetlistItemCreateInput = z.infer<typeof bandSetlistItemCreateSchema>
export type BandSetlistItemUpdateInput = z.infer<typeof bandSetlistItemUpdateSchema>
export type BandSetlistItemOrderInput = z.infer<typeof bandSetlistItemOrderSchema>

export function toBandShowPrefills(shows: BandShow[] | undefined): BandShowPrefill[] {
  return (shows || [])
    .map((show, index) => ({
      key: show._key || `show-${index}`,
      date: show.date || '',
      venue: show.venue || '',
      location: show.location || undefined,
      status: show.status || undefined,
    }))
    .filter((show) => show.date && show.venue)
}
