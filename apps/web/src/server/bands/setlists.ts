import {revalidatePath} from 'next/cache'

import type {
  BandSetlistDetail,
  BandSetlistEditorPayload,
  BandSetlistInput,
  BandSetlistItem,
  BandSetlistItemCreateInput,
  BandSetlistItemOrderInput,
  BandSetlistItemUpdateInput,
  BandSetlistPrintPayload,
  BandSetlistSummary,
  BandSetlistsHubPayload,
  BandSongLibraryItem,
  BandSongLibraryItemInput,
  BandShowPrefill,
} from '@web-bands/bands-domain'
import {
  bandSetlistItemCreateSchema,
  bandSetlistItemOrderSchema,
  bandSetlistItemUpdateSchema,
  bandSetlistSchema,
  bandSongLibraryItemSchema,
  toBandShowPrefills,
} from '@web-bands/bands-domain'
import {ZodError} from 'zod'

import {writeAuditLog} from '@/lib/server/audit'
import {logServerWarning} from '@/lib/server/log'
import {createClient} from '@/lib/supabase/server'
import {getBandEditorPayload} from './editor-payload'
import {listBandPrivateAssets} from './press-kit'
import {BandServiceError} from './service-error'

type RequestContext = {
  ip: string | null
  requestId: string | null
  userAgent: string | null
}

type SongLibraryRow = {
  id: string
  band_id: string
  title: string
  default_notes: string | null
  default_duration_seconds: number | null
  created_by: string
  created_at: string
  updated_at: string
}

type SetlistRow = {
  id: string
  band_id: string
  title: string | null
  show_date: string
  venue_name: string
  location: string | null
  press_logo_asset_id: string | null
  print_font_preset: 'modern' | 'stage' | 'editorial'
  print_all_caps: boolean
  linked_show_key: string | null
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

type SetlistItemRow = {
  id: string
  setlist_id: string
  sort_order: number
  item_type: 'song' | 'block'
  song_id: string | null
  song_title_snapshot: string | null
  block_label: string | null
  notes_override: string | null
  created_at: string
}

const SONG_SELECT_FIELDS =
  'id, band_id, title, default_notes, default_duration_seconds, created_by, created_at, updated_at' as const
const SETLIST_SELECT_FIELDS =
  'id, band_id, title, show_date, venue_name, location, press_logo_asset_id, print_font_preset, print_all_caps, linked_show_key, created_by, updated_by, created_at, updated_at' as const
const SETLIST_ITEM_SELECT_FIELDS =
  'id, setlist_id, sort_order, item_type, song_id, song_title_snapshot, block_label, notes_override, created_at' as const
const SETLISTS_INFRASTRUCTURE_TABLES = ['band_song_library', 'band_setlists', 'band_setlist_items'] as const

function isMissingSetlistsTableError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as {code?: string; details?: string; message?: string; hint?: string}
  const haystack = `${candidate.message || ''} ${candidate.details || ''} ${candidate.hint || ''}`.toLowerCase()

  return (
    candidate.code === '42P01' ||
    candidate.code === 'PGRST205' ||
    SETLISTS_INFRASTRUCTURE_TABLES.some((tableName) => haystack.includes(tableName))
  )
}

function getMissingSetlistsInfrastructureMessage() {
  return 'The setlists storage is not installed in this environment yet. Apply the Supabase migration for band_setlists_private first.'
}

function getValidationIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

function toSongLibraryItem(row: SongLibraryRow): BandSongLibraryItem {
  return {
    id: row.id,
    bandId: row.band_id,
    title: row.title,
    defaultNotes: row.default_notes || undefined,
    defaultDurationSeconds: row.default_duration_seconds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  }
}

function toSetlistSummary(row: SetlistRow, itemCount: number): BandSetlistSummary {
  return {
    id: row.id,
    bandId: row.band_id,
    title: row.title || undefined,
    showDate: row.show_date,
    venueName: row.venue_name,
    location: row.location || undefined,
    pressLogoAssetId: row.press_logo_asset_id || undefined,
    printFontPreset: row.print_font_preset,
    printAllCaps: row.print_all_caps,
    linkedShowKey: row.linked_show_key || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    itemCount,
  }
}

function toSetlistItem(row: SetlistItemRow): BandSetlistItem {
  return {
    id: row.id,
    setlistId: row.setlist_id,
    sortOrder: row.sort_order,
    itemType: row.item_type,
    songId: row.song_id,
    songTitleSnapshot: row.song_title_snapshot || undefined,
    blockLabel: row.block_label || undefined,
    notesOverride: row.notes_override || undefined,
    createdAt: row.created_at,
  }
}

async function requireSetlistsEditorPayload(userId: string, bandId: string) {
  const payload = await getBandEditorPayload(userId, bandId)
  if (!payload) {
    throw new BandServiceError('Band not found.', 404)
  }

  if (!payload.canEdit) {
    throw new BandServiceError('You do not have permission to access setlists.', 403)
  }

  return payload
}

async function loadSongRows(bandId: string) {
  const supabase = await createClient()
  const {data, error} = await supabase
    .from('band_song_library')
    .select(SONG_SELECT_FIELDS)
    .eq('band_id', bandId)
    .order('title', {ascending: true})

  if (error) {
    if (isMissingSetlistsTableError(error)) {
      logServerWarning('bands.setlists.infrastructure_missing', {
        bandId,
        table: 'band_song_library',
      })
      return []
    }

    throw new BandServiceError('Song library could not be loaded.', 500)
  }

  return ((data as SongLibraryRow[]) || []).map(toSongLibraryItem)
}

async function loadSetlistItemCountMap(setlistIds: string[]) {
  if (setlistIds.length === 0) {
    return new Map<string, number>()
  }

  const supabase = await createClient()
  const {data, error} = await supabase
    .from('band_setlist_items')
    .select('setlist_id')
    .in('setlist_id', setlistIds)

  if (error) {
    if (isMissingSetlistsTableError(error)) {
      return new Map<string, number>()
    }

    throw new BandServiceError('Setlist items could not be loaded.', 500)
  }

  return ((data || []) as Array<{setlist_id: string}>).reduce<Map<string, number>>((result, row) => {
    result.set(row.setlist_id, (result.get(row.setlist_id) || 0) + 1)
    return result
  }, new Map())
}

async function loadSetlistRows(bandId: string) {
  const supabase = await createClient()
  const {data, error} = await supabase
    .from('band_setlists')
    .select(SETLIST_SELECT_FIELDS)
    .eq('band_id', bandId)
    .order('show_date', {ascending: false})
    .order('updated_at', {ascending: false})

  if (error) {
    if (isMissingSetlistsTableError(error)) {
      logServerWarning('bands.setlists.infrastructure_missing', {
        bandId,
        table: 'band_setlists',
      })
      return []
    }

    throw new BandServiceError('Setlists could not be loaded.', 500)
  }

  return (data as SetlistRow[]) || []
}

async function loadSetlistRowById(bandId: string, setlistId: string) {
  const supabase = await createClient()
  const {data, error} = await supabase
    .from('band_setlists')
    .select(SETLIST_SELECT_FIELDS)
    .eq('band_id', bandId)
    .eq('id', setlistId)
    .maybeSingle()

  if (error) {
    if (isMissingSetlistsTableError(error)) {
      return null
    }

    throw new BandServiceError('Setlist could not be loaded.', 500)
  }

  return (data as SetlistRow | null) || null
}

async function loadSetlistItems(setlistId: string) {
  const supabase = await createClient()
  const {data, error} = await supabase
    .from('band_setlist_items')
    .select(SETLIST_ITEM_SELECT_FIELDS)
    .eq('setlist_id', setlistId)
    .order('sort_order', {ascending: true})
    .order('created_at', {ascending: true})

  if (error) {
    if (isMissingSetlistsTableError(error)) {
      return []
    }

    throw new BandServiceError('Setlist items could not be loaded.', 500)
  }

  return ((data as SetlistItemRow[]) || []).map(toSetlistItem)
}

async function requireBandLogo(bandId: string, assetId: string | undefined) {
  if (!assetId) {
    return null
  }

  const supabase = await createClient()
  const {data, error} = await supabase
    .from('band_private_assets')
    .select('id')
    .eq('band_id', bandId)
    .eq('id', assetId)
    .maybeSingle()

  if (error) {
    throw new BandServiceError('Press kit logos could not be verified.', 500)
  }

  if (!data) {
    throw new BandServiceError('The selected press logo does not belong to this band.', 400)
  }

  return data
}

function getShowPrefillMap(shows: BandShowPrefill[]) {
  return new Map(shows.map((show) => [show.key, show]))
}

function assertLinkedShowKey(showPrefillMap: Map<string, BandShowPrefill>, linkedShowKey: string | undefined) {
  if (!linkedShowKey) {
    return
  }

  if (!showPrefillMap.has(linkedShowKey)) {
    throw new BandServiceError('The selected show prefill is no longer available.', 400)
  }
}

function buildSetlistsHubPayloadBase(
  payload: Awaited<ReturnType<typeof requireSetlistsEditorPayload>>
) {
  const showPrefills = toBandShowPrefills(payload.initialValues.showsSection.shows)

  return {
    role: payload.role,
    band: {
      id: payload.band.id,
      name: payload.band.name,
      slug: payload.band.slug,
      status: payload.band.status,
    },
    canEdit: payload.canEdit,
    canManage: payload.canManage,
    publicBandHref: payload.publicBandHref,
    initialServerSavedAt: payload.initialServerSavedAt,
    showPrefills,
  }
}

function buildSetlistDetail(setlistRow: SetlistRow, items: BandSetlistItem[]): BandSetlistDetail {
  return {
    ...toSetlistSummary(setlistRow, items.length),
    items,
  }
}

export async function getBandSetlistsHubPayload(
  userId: string,
  bandId: string
): Promise<BandSetlistsHubPayload | null> {
  const payload = await getBandEditorPayload(userId, bandId)
  if (!payload || !payload.canEdit) {
    return null
  }

  const [songs, setlistRows, availableLogos] = await Promise.all([
    loadSongRows(bandId),
    loadSetlistRows(bandId),
    listBandPrivateAssets(userId, bandId),
  ])
  const itemCountMap = await loadSetlistItemCountMap(setlistRows.map((row) => row.id))

  return {
    ...buildSetlistsHubPayloadBase(payload),
    songs,
    setlists: setlistRows.map((row) => toSetlistSummary(row, itemCountMap.get(row.id) || 0)),
    availableLogos,
  }
}

export async function getBandSetlistEditorPayload(
  userId: string,
  bandId: string,
  setlistId: string
): Promise<BandSetlistEditorPayload | null> {
  const payload = await getBandSetlistsHubPayload(userId, bandId)
  if (!payload) {
    return null
  }

  const setlistRow = await loadSetlistRowById(bandId, setlistId)
  if (!setlistRow) {
    return null
  }

  const items = await loadSetlistItems(setlistId)

  return {
    ...payload,
    setlist: buildSetlistDetail(setlistRow, items),
  }
}

export async function getBandSetlistPrintPayload(
  userId: string,
  bandId: string,
  setlistId: string
): Promise<BandSetlistPrintPayload | null> {
  const editorPayload = await getBandSetlistEditorPayload(userId, bandId, setlistId)
  if (!editorPayload) {
    return null
  }

  return {
    role: editorPayload.role,
    band: editorPayload.band,
    setlist: editorPayload.setlist,
    logo:
      editorPayload.availableLogos.find((asset) => asset.id === editorPayload.setlist.pressLogoAssetId) || null,
  }
}

export async function createBandSongLibraryItem(
  userId: string,
  bandId: string,
  rawInput: unknown,
  requestContext: RequestContext
) {
  await requireSetlistsEditorPayload(userId, bandId)

  let parsed: BandSongLibraryItemInput
  try {
    parsed = bandSongLibraryItemSchema.parse(rawInput)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BandServiceError('Invalid song library payload.', 400, {
        errors: getValidationIssues(error),
      })
    }

    throw error
  }

  const supabase = await createClient()
  const {data, error} = await supabase
    .from('band_song_library')
    .insert({
      band_id: bandId,
      title: parsed.title,
      default_notes: parsed.defaultNotes || null,
      default_duration_seconds: parsed.defaultDurationSeconds ?? null,
      created_by: userId,
    })
    .select(SONG_SELECT_FIELDS)
    .maybeSingle()

  if (error) {
    if (isMissingSetlistsTableError(error)) {
      throw new BandServiceError(getMissingSetlistsInfrastructureMessage(), 503)
    }

    throw new BandServiceError('Song could not be created.', 500)
  }

  if (!data) {
    throw new BandServiceError('Song could not be created.', 500)
  }

  revalidatePath(`/dashboard/bands/${bandId}/setlists`)

  await writeAuditLog({
    action: 'band.setlist_song_created',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      requestId: requestContext.requestId,
      title: parsed.title,
    },
    targetId: data.id,
    targetType: 'band_song_library',
    userAgent: requestContext.userAgent,
  })

  return {
    ok: true,
    song: toSongLibraryItem(data as SongLibraryRow),
  }
}

export async function updateBandSongLibraryItem(
  userId: string,
  bandId: string,
  songId: string,
  rawInput: unknown,
  requestContext: RequestContext
) {
  await requireSetlistsEditorPayload(userId, bandId)

  let parsed: BandSongLibraryItemInput
  try {
    parsed = bandSongLibraryItemSchema.parse(rawInput)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BandServiceError('Invalid song library payload.', 400, {
        errors: getValidationIssues(error),
      })
    }

    throw error
  }

  const supabase = await createClient()
  const {data, error} = await supabase
    .from('band_song_library')
    .update({
      title: parsed.title,
      default_notes: parsed.defaultNotes || null,
      default_duration_seconds: parsed.defaultDurationSeconds ?? null,
    })
    .eq('band_id', bandId)
    .eq('id', songId)
    .select(SONG_SELECT_FIELDS)
    .maybeSingle()

  if (error) {
    if (isMissingSetlistsTableError(error)) {
      throw new BandServiceError(getMissingSetlistsInfrastructureMessage(), 503)
    }

    throw new BandServiceError('Song could not be updated.', 500)
  }

  if (!data) {
    throw new BandServiceError('Song not found.', 404)
  }

  revalidatePath(`/dashboard/bands/${bandId}/setlists`)

  await writeAuditLog({
    action: 'band.setlist_song_updated',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      requestId: requestContext.requestId,
      songId,
      title: parsed.title,
    },
    targetId: songId,
    targetType: 'band_song_library',
    userAgent: requestContext.userAgent,
  })

  return {
    ok: true,
    song: toSongLibraryItem(data as SongLibraryRow),
  }
}

export async function deleteBandSongLibraryItem(
  userId: string,
  bandId: string,
  songId: string,
  requestContext: RequestContext
) {
  await requireSetlistsEditorPayload(userId, bandId)

  const supabase = await createClient()
  const {data, error} = await supabase
    .from('band_song_library')
    .delete()
    .eq('band_id', bandId)
    .eq('id', songId)
    .select(SONG_SELECT_FIELDS)
    .maybeSingle()

  if (error) {
    if (isMissingSetlistsTableError(error)) {
      throw new BandServiceError(getMissingSetlistsInfrastructureMessage(), 503)
    }

    throw new BandServiceError('Song could not be deleted.', 500)
  }

  if (!data) {
    throw new BandServiceError('Song not found.', 404)
  }

  revalidatePath(`/dashboard/bands/${bandId}/setlists`)

  await writeAuditLog({
    action: 'band.setlist_song_deleted',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      requestId: requestContext.requestId,
      songId,
    },
    targetId: songId,
    targetType: 'band_song_library',
    userAgent: requestContext.userAgent,
  })

  return {ok: true}
}

export async function createBandSetlist(
  userId: string,
  bandId: string,
  rawInput: unknown,
  requestContext: RequestContext
) {
  const payload = await requireSetlistsEditorPayload(userId, bandId)

  let parsed: BandSetlistInput
  try {
    parsed = bandSetlistSchema.parse(rawInput)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BandServiceError('Invalid setlist payload.', 400, {
        errors: getValidationIssues(error),
      })
    }

    throw error
  }

  const showPrefillMap = getShowPrefillMap(toBandShowPrefills(payload.initialValues.showsSection.shows))
  assertLinkedShowKey(showPrefillMap, parsed.linkedShowKey)
  await requireBandLogo(bandId, parsed.pressLogoAssetId)

  const supabase = await createClient()
  const setlistId = crypto.randomUUID()
  const {error} = await supabase.from('band_setlists').insert({
    id: setlistId,
    band_id: bandId,
    title: parsed.title || null,
    show_date: parsed.showDate,
    venue_name: parsed.venueName,
    location: parsed.location || null,
    press_logo_asset_id: parsed.pressLogoAssetId || null,
    print_font_preset: parsed.printFontPreset,
    print_all_caps: parsed.printAllCaps,
    linked_show_key: parsed.linkedShowKey || null,
    created_by: userId,
    updated_by: userId,
  })

  if (error) {
    if (isMissingSetlistsTableError(error)) {
      throw new BandServiceError(getMissingSetlistsInfrastructureMessage(), 503)
    }

    throw new BandServiceError('Setlist could not be created.', 500)
  }

  const setlistRow = await loadSetlistRowById(bandId, setlistId)
  if (!setlistRow) {
    throw new BandServiceError('Setlist could not be created.', 500)
  }

  revalidatePath(`/dashboard/bands/${bandId}/setlists`)

  await writeAuditLog({
    action: 'band.setlist_created',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      requestId: requestContext.requestId,
      setlistId,
      showDate: parsed.showDate,
      venueName: parsed.venueName,
    },
    targetId: setlistId,
    targetType: 'band_setlist',
    userAgent: requestContext.userAgent,
  })

  return {
    ok: true,
    setlist: toSetlistSummary(setlistRow, 0),
  }
}

export async function updateBandSetlist(
  userId: string,
  bandId: string,
  setlistId: string,
  rawInput: unknown,
  requestContext: RequestContext
) {
  const payload = await requireSetlistsEditorPayload(userId, bandId)

  let parsed: BandSetlistInput
  try {
    parsed = bandSetlistSchema.parse(rawInput)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BandServiceError('Invalid setlist payload.', 400, {
        errors: getValidationIssues(error),
      })
    }

    throw error
  }

  const setlistRow = await loadSetlistRowById(bandId, setlistId)
  if (!setlistRow) {
    throw new BandServiceError('Setlist not found.', 404)
  }

  const showPrefillMap = getShowPrefillMap(toBandShowPrefills(payload.initialValues.showsSection.shows))
  assertLinkedShowKey(showPrefillMap, parsed.linkedShowKey)
  await requireBandLogo(bandId, parsed.pressLogoAssetId)

  const supabase = await createClient()
  const {error} = await supabase
    .from('band_setlists')
    .update({
      title: parsed.title || null,
      show_date: parsed.showDate,
      venue_name: parsed.venueName,
      location: parsed.location || null,
      press_logo_asset_id: parsed.pressLogoAssetId || null,
      print_font_preset: parsed.printFontPreset,
      print_all_caps: parsed.printAllCaps,
      linked_show_key: parsed.linkedShowKey || null,
      updated_by: userId,
    })
    .eq('band_id', bandId)
    .eq('id', setlistId)

  if (error) {
    if (isMissingSetlistsTableError(error)) {
      throw new BandServiceError(getMissingSetlistsInfrastructureMessage(), 503)
    }

    throw new BandServiceError('Setlist could not be updated.', 500)
  }

  const nextRow = await loadSetlistRowById(bandId, setlistId)
  if (!nextRow) {
    throw new BandServiceError('Setlist not found.', 404)
  }

  const items = await loadSetlistItems(setlistId)
  revalidateSetlistPaths(bandId, setlistId)

  await writeAuditLog({
    action: 'band.setlist_updated',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      requestId: requestContext.requestId,
      setlistId,
    },
    targetId: setlistId,
    targetType: 'band_setlist',
    userAgent: requestContext.userAgent,
  })

  return {
    ok: true,
    setlist: buildSetlistDetail(nextRow, items),
  }
}

function revalidateSetlistPaths(bandId: string, setlistId: string) {
  revalidatePath(`/dashboard/bands/${bandId}/setlists`)
  revalidatePath(`/dashboard/bands/${bandId}/setlists/${setlistId}`)
  revalidatePath(`/dashboard/bands/${bandId}/setlists/${setlistId}/print`)
}

export async function deleteBandSetlist(
  userId: string,
  bandId: string,
  setlistId: string,
  requestContext: RequestContext
) {
  await requireSetlistsEditorPayload(userId, bandId)

  const supabase = await createClient()
  const {data, error} = await supabase
    .from('band_setlists')
    .delete()
    .eq('band_id', bandId)
    .eq('id', setlistId)
    .select(SETLIST_SELECT_FIELDS)
    .maybeSingle()

  if (error) {
    if (isMissingSetlistsTableError(error)) {
      throw new BandServiceError(getMissingSetlistsInfrastructureMessage(), 503)
    }

    throw new BandServiceError('Setlist could not be deleted.', 500)
  }

  if (!data) {
    throw new BandServiceError('Setlist not found.', 404)
  }

  revalidateSetlistPaths(bandId, setlistId)

  await writeAuditLog({
    action: 'band.setlist_deleted',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      requestId: requestContext.requestId,
      setlistId,
    },
    targetId: setlistId,
    targetType: 'band_setlist',
    userAgent: requestContext.userAgent,
  })

  return {ok: true}
}

export async function duplicateBandSetlist(
  userId: string,
  bandId: string,
  setlistId: string,
  requestContext: RequestContext
) {
  await requireSetlistsEditorPayload(userId, bandId)

  const source = await loadSetlistRowById(bandId, setlistId)
  if (!source) {
    throw new BandServiceError('Setlist not found.', 404)
  }

  const items = await loadSetlistItems(setlistId)
  const supabase = await createClient()
  const duplicateId = crypto.randomUUID()
  const duplicateTitle = source.title ? `${source.title} copia` : `${source.venue_name} copia`
  const {error: insertError} = await supabase.from('band_setlists').insert({
    id: duplicateId,
    band_id: bandId,
    title: duplicateTitle,
    show_date: source.show_date,
    venue_name: source.venue_name,
    location: source.location,
    press_logo_asset_id: source.press_logo_asset_id,
    print_font_preset: source.print_font_preset,
    print_all_caps: source.print_all_caps,
    linked_show_key: source.linked_show_key,
    created_by: userId,
    updated_by: userId,
  })

  if (insertError) {
    if (isMissingSetlistsTableError(insertError)) {
      throw new BandServiceError(getMissingSetlistsInfrastructureMessage(), 503)
    }

    throw new BandServiceError('Setlist could not be duplicated.', 500)
  }

  if (items.length > 0) {
    const insertItems = items.map((item, index) => ({
      id: crypto.randomUUID(),
      setlist_id: duplicateId,
      sort_order: index + 1,
      item_type: item.itemType,
      song_id: item.itemType === 'song' ? item.songId || null : null,
      song_title_snapshot: item.itemType === 'song' ? item.songTitleSnapshot || null : null,
      block_label: item.itemType === 'block' ? item.blockLabel || null : null,
      notes_override: item.notesOverride || null,
    }))

    const {error: itemInsertError} = await supabase.from('band_setlist_items').insert(insertItems)
    if (itemInsertError) {
      if (isMissingSetlistsTableError(itemInsertError)) {
        throw new BandServiceError(getMissingSetlistsInfrastructureMessage(), 503)
      }

      throw new BandServiceError('Setlist items could not be duplicated.', 500)
    }
  }

  const duplicateRow = await loadSetlistRowById(bandId, duplicateId)
  if (!duplicateRow) {
    throw new BandServiceError('Setlist could not be duplicated.', 500)
  }

  revalidateSetlistPaths(bandId, duplicateId)

  await writeAuditLog({
    action: 'band.setlist_duplicated',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      duplicateId,
      requestId: requestContext.requestId,
      sourceSetlistId: setlistId,
    },
    targetId: duplicateId,
    targetType: 'band_setlist',
    userAgent: requestContext.userAgent,
  })

  return {
    ok: true,
    setlist: toSetlistSummary(duplicateRow, items.length),
  }
}

export async function createBandSetlistItem(
  userId: string,
  bandId: string,
  setlistId: string,
  rawInput: unknown,
  requestContext: RequestContext
) {
  await requireSetlistsEditorPayload(userId, bandId)

  let parsed: BandSetlistItemCreateInput
  try {
    parsed = bandSetlistItemCreateSchema.parse(rawInput)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BandServiceError('Invalid setlist item payload.', 400, {
        errors: getValidationIssues(error),
      })
    }

    throw error
  }

  const setlistRow = await loadSetlistRowById(bandId, setlistId)
  if (!setlistRow) {
    throw new BandServiceError('Setlist not found.', 404)
  }

  const supabase = await createClient()
  const {data: currentItems, error: currentItemsError} = await supabase
    .from('band_setlist_items')
    .select('sort_order')
    .eq('setlist_id', setlistId)
    .order('sort_order', {ascending: false})
    .limit(1)

  if (currentItemsError) {
    if (isMissingSetlistsTableError(currentItemsError)) {
      throw new BandServiceError(getMissingSetlistsInfrastructureMessage(), 503)
    }

    throw new BandServiceError('Setlist items could not be loaded.', 500)
  }

  let songRow: SongLibraryRow | null = null
  if (parsed.itemType === 'song') {
    const {data, error} = await supabase
      .from('band_song_library')
      .select(SONG_SELECT_FIELDS)
      .eq('band_id', bandId)
      .eq('id', parsed.songId)
      .maybeSingle()

    if (error) {
      if (isMissingSetlistsTableError(error)) {
        throw new BandServiceError(getMissingSetlistsInfrastructureMessage(), 503)
      }

      throw new BandServiceError('Song library could not be loaded.', 500)
    }

    if (!data) {
      throw new BandServiceError('Song not found in the band library.', 404)
    }

    songRow = data as SongLibraryRow
  }

  const nextSortOrder = ((currentItems || [])[0]?.sort_order || 0) + 1
  const itemId = crypto.randomUUID()
  const {data: insertedItem, error} = await supabase
    .from('band_setlist_items')
    .insert({
      id: itemId,
      setlist_id: setlistId,
      sort_order: nextSortOrder,
      item_type: parsed.itemType,
      song_id: parsed.itemType === 'song' ? parsed.songId : null,
      song_title_snapshot: parsed.itemType === 'song' ? songRow?.title || null : null,
      block_label: parsed.itemType === 'block' ? parsed.blockLabel : null,
      notes_override:
        parsed.itemType === 'song'
          ? parsed.notesOverride || songRow?.default_notes || null
          : parsed.notesOverride || null,
    })
    .select(SETLIST_ITEM_SELECT_FIELDS)
    .maybeSingle()

  if (error) {
    if (isMissingSetlistsTableError(error)) {
      throw new BandServiceError(getMissingSetlistsInfrastructureMessage(), 503)
    }

    throw new BandServiceError('Setlist item could not be created.', 500)
  }

  if (!insertedItem) {
    throw new BandServiceError('Setlist item could not be created.', 500)
  }

  revalidateSetlistPaths(bandId, setlistId)

  await writeAuditLog({
    action: 'band.setlist_item_created',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      itemType: parsed.itemType,
      requestId: requestContext.requestId,
      setlistId,
    },
    targetId: itemId,
    targetType: 'band_setlist_item',
    userAgent: requestContext.userAgent,
  })

  return {
    ok: true,
    item: toSetlistItem(insertedItem as SetlistItemRow),
  }
}

export async function updateBandSetlistItem(
  userId: string,
  bandId: string,
  setlistId: string,
  itemId: string,
  rawInput: unknown,
  requestContext: RequestContext
) {
  await requireSetlistsEditorPayload(userId, bandId)

  let parsed: BandSetlistItemUpdateInput
  try {
    parsed = bandSetlistItemUpdateSchema.parse(rawInput)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BandServiceError('Invalid setlist item payload.', 400, {
        errors: getValidationIssues(error),
      })
    }

    throw error
  }

  const setlistRow = await loadSetlistRowById(bandId, setlistId)
  if (!setlistRow) {
    throw new BandServiceError('Setlist not found.', 404)
  }

  const supabase = await createClient()
  const {data: currentItem, error: currentItemError} = await supabase
    .from('band_setlist_items')
    .select(SETLIST_ITEM_SELECT_FIELDS)
    .eq('setlist_id', setlistId)
    .eq('id', itemId)
    .maybeSingle()

  if (currentItemError) {
    if (isMissingSetlistsTableError(currentItemError)) {
      throw new BandServiceError(getMissingSetlistsInfrastructureMessage(), 503)
    }

    throw new BandServiceError('Setlist item could not be loaded.', 500)
  }

  if (!currentItem) {
    throw new BandServiceError('Setlist item not found.', 404)
  }

  const typedCurrentItem = currentItem as SetlistItemRow
  let nextSongRow: SongLibraryRow | null = null

  if (typedCurrentItem.item_type === 'song' && parsed.songId) {
    const {data, error} = await supabase
      .from('band_song_library')
      .select(SONG_SELECT_FIELDS)
      .eq('band_id', bandId)
      .eq('id', parsed.songId)
      .maybeSingle()

    if (error) {
      if (isMissingSetlistsTableError(error)) {
        throw new BandServiceError(getMissingSetlistsInfrastructureMessage(), 503)
      }

      throw new BandServiceError('Song library could not be loaded.', 500)
    }

    if (!data) {
      throw new BandServiceError('Song not found in the band library.', 404)
    }

    nextSongRow = data as SongLibraryRow
  }

  const {data: updatedItem, error} = await supabase
    .from('band_setlist_items')
    .update({
      song_id:
        typedCurrentItem.item_type === 'song'
          ? parsed.songId || typedCurrentItem.song_id
          : null,
      song_title_snapshot:
        typedCurrentItem.item_type === 'song'
          ? nextSongRow?.title || typedCurrentItem.song_title_snapshot
          : null,
      block_label:
        typedCurrentItem.item_type === 'block'
          ? parsed.blockLabel || typedCurrentItem.block_label
          : null,
      notes_override:
        parsed.notesOverride !== undefined ? parsed.notesOverride || null : typedCurrentItem.notes_override,
    })
    .eq('setlist_id', setlistId)
    .eq('id', itemId)
    .select(SETLIST_ITEM_SELECT_FIELDS)
    .maybeSingle()

  if (error) {
    if (isMissingSetlistsTableError(error)) {
      throw new BandServiceError(getMissingSetlistsInfrastructureMessage(), 503)
    }

    throw new BandServiceError('Setlist item could not be updated.', 500)
  }

  if (!updatedItem) {
    throw new BandServiceError('Setlist item could not be updated.', 500)
  }

  revalidateSetlistPaths(bandId, setlistId)

  await writeAuditLog({
    action: 'band.setlist_item_updated',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      itemId,
      requestId: requestContext.requestId,
      setlistId,
    },
    targetId: itemId,
    targetType: 'band_setlist_item',
    userAgent: requestContext.userAgent,
  })

  return {
    ok: true,
    item: toSetlistItem(updatedItem as SetlistItemRow),
  }
}

export async function deleteBandSetlistItem(
  userId: string,
  bandId: string,
  setlistId: string,
  itemId: string,
  requestContext: RequestContext
) {
  await requireSetlistsEditorPayload(userId, bandId)

  const setlistRow = await loadSetlistRowById(bandId, setlistId)
  if (!setlistRow) {
    throw new BandServiceError('Setlist not found.', 404)
  }

  const supabase = await createClient()
  const {data, error} = await supabase
    .from('band_setlist_items')
    .delete()
    .eq('setlist_id', setlistId)
    .eq('id', itemId)
    .select(SETLIST_ITEM_SELECT_FIELDS)
    .maybeSingle()

  if (error) {
    if (isMissingSetlistsTableError(error)) {
      throw new BandServiceError(getMissingSetlistsInfrastructureMessage(), 503)
    }

    throw new BandServiceError('Setlist item could not be deleted.', 500)
  }

  if (!data) {
    throw new BandServiceError('Setlist item not found.', 404)
  }

  revalidateSetlistPaths(bandId, setlistId)

  await writeAuditLog({
    action: 'band.setlist_item_deleted',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      itemId,
      requestId: requestContext.requestId,
      setlistId,
    },
    targetId: itemId,
    targetType: 'band_setlist_item',
    userAgent: requestContext.userAgent,
  })

  return {ok: true}
}

export async function reorderBandSetlistItems(
  userId: string,
  bandId: string,
  setlistId: string,
  rawInput: unknown,
  requestContext: RequestContext
) {
  await requireSetlistsEditorPayload(userId, bandId)

  let parsed: BandSetlistItemOrderInput
  try {
    parsed = bandSetlistItemOrderSchema.parse(rawInput)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BandServiceError('Invalid setlist order payload.', 400, {
        errors: getValidationIssues(error),
      })
    }

    throw error
  }

  const setlistRow = await loadSetlistRowById(bandId, setlistId)
  if (!setlistRow) {
    throw new BandServiceError('Setlist not found.', 404)
  }

  const supabase = await createClient()
  const {data: currentRows, error} = await supabase
    .from('band_setlist_items')
    .select('id')
    .eq('setlist_id', setlistId)

  if (error) {
    if (isMissingSetlistsTableError(error)) {
      throw new BandServiceError(getMissingSetlistsInfrastructureMessage(), 503)
    }

    throw new BandServiceError('Setlist order could not be loaded.', 500)
  }

  const currentIds = ((currentRows || []) as Array<{id: string}>).map((row) => row.id).sort()
  const incomingIds = [...parsed.orderedItemIds].sort()

  if (currentIds.length !== incomingIds.length || currentIds.join('|') !== incomingIds.join('|')) {
    throw new BandServiceError('Setlist order payload does not match current items.', 400)
  }

  await Promise.all(
    parsed.orderedItemIds.map((id, index) =>
      supabase.from('band_setlist_items').update({sort_order: index + 1}).eq('setlist_id', setlistId).eq('id', id)
    )
  )

  revalidateSetlistPaths(bandId, setlistId)

  await writeAuditLog({
    action: 'band.setlist_reordered',
    actorUserId: userId,
    bandId,
    ip: requestContext.ip,
    metadata: {
      orderedItemIds: parsed.orderedItemIds,
      requestId: requestContext.requestId,
      setlistId,
    },
    targetId: setlistId,
    targetType: 'band_setlist',
    userAgent: requestContext.userAgent,
  })

  return {ok: true}
}
