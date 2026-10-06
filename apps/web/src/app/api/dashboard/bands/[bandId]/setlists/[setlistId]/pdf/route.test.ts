import {NextRequest} from 'next/server'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

const mockIsSupabaseConfigured = vi.fn()
const mockCreateClient = vi.fn()
const mockCreateAdminClient = vi.fn()
const mockGetBandSetlistPrintPayload = vi.fn()
const mockRenderBandSetlistPdf = vi.fn()

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mockCreateAdminClient,
}))

vi.mock('@/server/bands/setlists', () => ({
  getBandSetlistPrintPayload: mockGetBandSetlistPrintPayload,
}))

vi.mock('@/server/bands/setlist-pdf', () => ({
  renderBandSetlistPdf: mockRenderBandSetlistPdf,
}))

let GET: typeof import('./route').GET
let buildSetlistPdfFileName: typeof import('./route').buildSetlistPdfFileName

function createSupabaseMock(user: {id: string} | null = {id: 'user-1'}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({data: {user}}),
    },
  }
}

function buildPayload(withLogo = false) {
  return {
    role: 'editor',
    band: {id: 'band-1', name: 'Viejas Runas', slug: 'viejas-runas', status: 'published'},
    setlist: {
      id: 'setlist-1',
      title: 'Ciclo Lunatico',
      venueName: 'Hipico',
      showDate: '2026-08-28',
      items: [],
      printFontPreset: 'stage',
      printAllCaps: true,
    },
    logo: withLogo
      ? {
          id: 'logo-1',
          storageBucket: 'band-press-assets',
          storagePath: 'band-1/logo.png',
          mimeType: 'image/png',
        }
      : null,
  }
}

beforeAll(async () => {
  ;({GET, buildSetlistPdfFileName} = await import('./route'))
})

beforeEach(() => {
  vi.clearAllMocks()
  mockIsSupabaseConfigured.mockReturnValue(true)
  mockCreateClient.mockResolvedValue(createSupabaseMock())
  mockRenderBandSetlistPdf.mockResolvedValue(Buffer.from('%PDF-clean'))
})

describe('GET /api/dashboard/bands/[bandId]/setlists/[setlistId]/pdf', () => {
  it('downloads a clean PDF with a stable file name', async () => {
    mockGetBandSetlistPrintPayload.mockResolvedValue(buildPayload())

    const response = await GET(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/setlists/setlist-1/pdf'),
      {params: Promise.resolve({bandId: 'band-1', setlistId: 'setlist-1'})}
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/pdf')
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="viejas-runas-ciclo-lunatico-2026-08-28.pdf"'
    )
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe('%PDF-clean')
    expect(mockRenderBandSetlistPdf).toHaveBeenCalledWith(expect.objectContaining({role: 'editor'}), null)
  })

  it('loads the selected private logo and embeds it as a data URL', async () => {
    const download = vi.fn().mockResolvedValue({data: new Blob(['png-bytes']), error: null})
    mockCreateAdminClient.mockReturnValue({storage: {from: vi.fn().mockReturnValue({download})}})
    mockGetBandSetlistPrintPayload.mockResolvedValue(buildPayload(true))

    const response = await GET(
      new NextRequest('http://localhost/api/dashboard/bands/band-1/setlists/setlist-1/pdf'),
      {params: Promise.resolve({bandId: 'band-1', setlistId: 'setlist-1'})}
    )

    expect(response.status).toBe(200)
    expect(download).toHaveBeenCalledWith('band-1/logo.png')
    expect(mockRenderBandSetlistPdf).toHaveBeenCalledWith(
      expect.any(Object),
      `data:image/png;base64,${Buffer.from('png-bytes').toString('base64')}`
    )
  })

  it('normalizes accents and unsafe characters in the download name', () => {
    expect(buildSetlistPdfFileName('Banda Naci\u00f3n', 'Festival / Aniversario', '2026-10-06')).toBe(
      'banda-nacion-festival-aniversario-2026-10-06.pdf'
    )
  })
})
