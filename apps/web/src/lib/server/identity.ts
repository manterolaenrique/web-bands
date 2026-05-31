import {createHash} from 'node:crypto'

export function normalizeIdentityEmail(email: string | null | undefined) {
  return String(email || '').trim().toLowerCase()
}

export function hashIdentityParts(parts: Array<string | null | undefined>) {
  const normalized = parts
    .map((part) => String(part || '').trim().toLowerCase())
    .filter(Boolean)
    .join('|')

  return createHash('sha256').update(normalized || 'anonymous').digest('hex')
}
