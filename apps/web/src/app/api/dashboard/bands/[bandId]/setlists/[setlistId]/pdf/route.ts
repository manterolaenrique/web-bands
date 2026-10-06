import {NextRequest, NextResponse} from 'next/server'

import {createAdminClient} from '@/lib/supabase/admin'
import {getBandSetlistPrintPayload} from '@/server/bands/setlists'
import {renderBandSetlistPdf} from '@/server/bands/setlist-pdf'
import {BandServiceError} from '@/server/bands/service-error'

import {mapSetlistsServiceError, requireSetlistsUser} from '../../route-utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{
    bandId: string
    setlistId: string
  }>
}
function slugifyFileName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

export function buildSetlistPdfFileName(bandName: string, title: string, showDate: string) {
  const safeBand = slugifyFileName(bandName) || 'banda'
  const safeTitle = slugifyFileName(title) || 'setlist'
  return `${safeBand}-${safeTitle}-${showDate}.pdf`
}

async function loadLogoDataUrl(storageBucket: string, storagePath: string, mimeType: string) {
  const admin = createAdminClient()
  const {data, error} = await admin.storage.from(storageBucket).download(storagePath)
  if (error || !data) {
    throw new BandServiceError('The selected setlist logo could not be loaded.', 500)
  }

  const bytes = Buffer.from(await data.arrayBuffer())
  return `data:${mimeType || 'image/png'};base64,${bytes.toString('base64')}`
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireSetlistsUser()
  if (auth.response || !auth.user) {
    return auth.response
  }

  const {bandId, setlistId} = await context.params

  try {
    const payload = await getBandSetlistPrintPayload(auth.user.id, bandId, setlistId)
    if (!payload) {
      return NextResponse.json({message: 'Setlist not found.'}, {status: 404})
    }

    const logoDataUrl = payload.logo
      ? await loadLogoDataUrl(payload.logo.storageBucket, payload.logo.storagePath, payload.logo.mimeType)
      : null
    const pdf = await renderBandSetlistPdf(payload, logoDataUrl)
    const fileName = buildSetlistPdfFileName(
      payload.band.name,
      payload.setlist.title || payload.setlist.venueName,
      payload.setlist.showDate
    )

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(pdf.byteLength),
        'Content-Type': 'application/pdf',
      },
    })
  } catch (error) {
    if (error instanceof BandServiceError) {
      return mapSetlistsServiceError(error)
    }

    throw error
  }
}
