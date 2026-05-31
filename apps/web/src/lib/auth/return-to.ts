const DEFAULT_RETURN_TO = '/dashboard'

export function resolveSafeReturnTo(value: string | null | undefined, fallback = DEFAULT_RETURN_TO) {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()

  if (!trimmed || !trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback
  }

  if (trimmed.includes('\r') || trimmed.includes('\n')) {
    return fallback
  }

  return trimmed
}

export function appendQueryParams(
  pathname: string,
  params: Record<string, string | null | undefined>
) {
  const [base, rawQuery] = pathname.split('?')
  const searchParams = new URLSearchParams(rawQuery || '')

  for (const [key, value] of Object.entries(params)) {
    if (!value) {
      searchParams.delete(key)
      continue
    }

    searchParams.set(key, value)
  }

  const query = searchParams.toString()
  return query ? `${base}?${query}` : base
}

