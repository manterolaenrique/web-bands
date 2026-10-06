import {beforeEach, describe, expect, it, vi} from 'vitest'

const mockCreateClient = vi.fn()
const mockWriteAuditLog = vi.fn()
const mockRevalidatePath = vi.fn()

vi.mock('@/lib/supabase/server', () => ({createClient: mockCreateClient}))
vi.mock('@/lib/server/audit', () => ({writeAuditLog: mockWriteAuditLog}))
vi.mock('next/cache', () => ({revalidatePath: mockRevalidatePath}))
vi.mock('./editor-payload', () => ({getBandEditorPayload: vi.fn()}))
vi.mock('./press-kit', () => ({listBandPrivateAssets: vi.fn()}))

const requestContext = {
  ip: null,
  requestId: 'request-1',
  userAgent: 'Vitest',
}

function createMembershipQuery() {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({data: {role: 'owner'}, error: null}),
        })),
      })),
    })),
  }
}

describe('setlist item mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWriteAuditLog.mockResolvedValue(true)
  })

  it('inserts a song at the requested index with one atomic RPC', async () => {
    const rpc = vi.fn((name: string, input: Record<string, unknown>) => {
      expect(name).toBe('insert_band_setlist_item_at')
      expect(input).toMatchObject({
        p_setlist_id: '00000000-0000-4000-8000-000000000010',
        p_song_id: '00000000-0000-4000-8000-000000000020',
        p_insert_index: 2,
      })

      return {
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: '00000000-0000-4000-8000-000000000030',
            setlist_id: '00000000-0000-4000-8000-000000000010',
            sort_order: 3,
            item_type: 'song',
            song_id: '00000000-0000-4000-8000-000000000020',
            song_title_snapshot: 'Tema tres',
            block_label: null,
            notes_override: null,
            created_at: '2026-10-06T10:00:00.000Z',
          },
          error: null,
        }),
      }
    })
    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        expect(table).toBe('band_memberships')
        return createMembershipQuery()
      }),
      rpc,
    })

    const {createBandSetlistItem} = await import('./setlists')
    const result = await createBandSetlistItem(
      'user-1',
      'band-1',
      '00000000-0000-4000-8000-000000000010',
      {
        itemType: 'song',
        songId: '00000000-0000-4000-8000-000000000020',
        insertIndex: 2,
      },
      requestContext
    )

    expect(result.item).toMatchObject({sortOrder: 3, songTitleSnapshot: 'Tema tres'})
    expect(rpc).toHaveBeenCalledTimes(1)
  })

  it('persists a complete order with one RPC instead of one update per item', async () => {
    const orderedItemIds = [
      '00000000-0000-4000-8000-000000000031',
      '00000000-0000-4000-8000-000000000032',
    ]
    const rpc = vi.fn().mockResolvedValue({data: null, error: null})
    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        expect(table).toBe('band_memberships')
        return createMembershipQuery()
      }),
      rpc,
    })

    const {reorderBandSetlistItems} = await import('./setlists')
    await reorderBandSetlistItems(
      'user-1',
      'band-1',
      '00000000-0000-4000-8000-000000000010',
      {orderedItemIds},
      requestContext
    )

    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('reorder_band_setlist_items', {
      p_setlist_id: '00000000-0000-4000-8000-000000000010',
      p_ordered_item_ids: orderedItemIds,
    })
  })

  it('rejects viewers before running a mutation RPC', async () => {
    const rpc = vi.fn()
    mockCreateClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({data: {role: 'viewer'}, error: null}),
            })),
          })),
        })),
      })),
      rpc,
    })

    const {reorderBandSetlistItems} = await import('./setlists')
    await expect(
      reorderBandSetlistItems(
        'user-1',
        'band-1',
        '00000000-0000-4000-8000-000000000010',
        {orderedItemIds: ['00000000-0000-4000-8000-000000000031']},
        requestContext
      )
    ).rejects.toMatchObject({status: 403})
    expect(rpc).not.toHaveBeenCalled()
  })
})
