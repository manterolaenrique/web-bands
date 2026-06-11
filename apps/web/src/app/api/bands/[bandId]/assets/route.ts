import {NextResponse, type NextRequest} from 'next/server'

import {isSupabaseConfigured} from '@/lib/env'
import {
  isBandArrayImageCollection,
  isBandArrayImageField,
  isBandImageField,
  type BandImageTarget,
} from '@/lib/sanity/mutations'
import {resolveRequestContext} from '@/lib/server/request-context'
import {createClient} from '@/lib/supabase/server'
import {BandServiceError} from '@/server/bands/service-error'
import {uploadBandAsset} from '@/server/bands/upload-band-asset'

export const runtime = 'nodejs'

function resolveUploadTarget(formData: FormData | null) {
  const field = formData?.get('field')
  if (typeof field === 'string' && isBandImageField(field)) {
    return {
      kind: 'field' as const,
      field,
    }
  }

  const collection = formData?.get('collection')
  const itemKey = formData?.get('itemKey')
  const imageField = formData?.get('imageField')

  if (
    typeof collection === 'string' &&
    isBandArrayImageCollection(collection) &&
    typeof itemKey === 'string' &&
    itemKey.trim().length > 0 &&
    typeof imageField === 'string' &&
    isBandArrayImageField(collection, imageField)
  ) {
    return {
      kind: 'array' as const,
      collection,
      itemKey: itemKey.trim(),
      imageField,
    }
  }

  return null satisfies BandImageTarget | null
}

type RouteContext = {
  params: Promise<{
    bandId: string
  }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({message: 'Supabase is not configured.'}, {status: 503})
  }

  const {bandId} = await context.params
  const requestContext = resolveRequestContext(request.headers)
  const supabase = await createClient()
  const {
    data: {user},
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({message: 'Authentication required.'}, {status: 401})
  }

  const formData = await request.formData().catch(() => null)
  const target = resolveUploadTarget(formData)
  const file = formData?.get('file')

  try {
    const payload = await uploadBandAsset(
      user.id,
      bandId,
      target,
      file instanceof File ? file : null,
      requestContext
    )

    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof BandServiceError) {
      const details = typeof error.details === 'object' && error.details ? {...(error.details as Record<string, unknown>)} : {}
      const headers = 'headers' in details ? (details.headers as HeadersInit | undefined) : undefined
      delete details.headers
      const body = {
        message: error.message,
        ...details,
      }

      return NextResponse.json(body, {status: error.status, headers})
    }

    throw error
  }
}
