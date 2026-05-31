import {headers} from 'next/headers'

export type HeaderReader = Pick<Headers, 'get'>

export type RequestContext = {
  ip: string | null
  requestId: string | null
  userAgent: string | null
}

function normalizeIp(value: string | null) {
  if (!value) {
    return null
  }

  const candidate = value.split(',')[0]?.trim()
  return candidate || null
}

export function resolveRequestContext(reader: HeaderReader): RequestContext {
  const ip =
    normalizeIp(reader.get('x-forwarded-for')) ||
    normalizeIp(reader.get('x-real-ip')) ||
    normalizeIp(reader.get('cf-connecting-ip'))

  return {
    ip,
    requestId: reader.get('x-vercel-id') || reader.get('x-request-id'),
    userAgent: reader.get('user-agent'),
  }
}

export async function getServerActionRequestContext() {
  const headerStore = await headers()
  return resolveRequestContext(headerStore)
}
