'use client'

export type ClientMetricContextValue = string | number | boolean | null | undefined

export type ClientMetricContext = Record<string, ClientMetricContextValue>

export type ClientMetricEntry = {
  name: string
  value: number
  unit: 'ms' | 'count'
  timestamp: string
  context: Record<string, string | number | boolean | null>
}

type ClientMetricStore = {
  entries: ClientMetricEntry[]
  clear: () => void
  push: (entry: ClientMetricEntry) => void
}

const MAX_CLIENT_METRIC_ENTRIES = 200

declare global {
  interface Window {
    __WEB_BANDS_METRICS__?: ClientMetricStore
  }
}

export function normalizeClientMetricContext(
  context: ClientMetricContext | undefined
): Record<string, string | number | boolean | null> {
  if (!context) {
    return {}
  }

  return Object.fromEntries(Object.entries(context).filter(([, value]) => value !== undefined)) as Record<
    string,
    string | number | boolean | null
  >
}

export function appendClientMetricEntry(
  entries: ClientMetricEntry[],
  nextEntry: ClientMetricEntry,
  maxEntries = MAX_CLIENT_METRIC_ENTRIES
) {
  const nextEntries = [...entries, nextEntry]

  if (nextEntries.length <= maxEntries) {
    return nextEntries
  }

  return nextEntries.slice(nextEntries.length - maxEntries)
}

function getMetricNow() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now()
  }

  return Date.now()
}

function getClientMetricStore() {
  if (typeof window === 'undefined') {
    return null
  }

  if (!window.__WEB_BANDS_METRICS__) {
    const store: ClientMetricStore = {
      entries: [],
      clear() {
        store.entries = []
      },
      push(entry) {
        store.entries = appendClientMetricEntry(store.entries, entry)
      },
    }

    window.__WEB_BANDS_METRICS__ = store
  }

  return window.__WEB_BANDS_METRICS__
}

export function markClientMetric() {
  return getMetricNow()
}

export function recordClientMetric(
  name: string,
  value: number,
  options?: {
    unit?: ClientMetricEntry['unit']
    context?: ClientMetricContext
  }
) {
  if (typeof window === 'undefined') {
    return
  }

  const entry: ClientMetricEntry = {
    name,
    value: Number.isFinite(value) ? Math.round(value * 100) / 100 : 0,
    unit: options?.unit || 'ms',
    timestamp: new Date().toISOString(),
    context: normalizeClientMetricContext(options?.context),
  }

  const store = getClientMetricStore()
  store?.push(entry)

  if (process.env.NODE_ENV !== 'production') {
    console.info('[web-bands-metric]', entry)
  }
}

export function recordMeasuredClientMetric(
  name: string,
  startedAt: number,
  options?: {
    context?: ClientMetricContext
  }
) {
  const duration = Math.max(0, getMetricNow() - startedAt)
  recordClientMetric(name, duration, {
    unit: 'ms',
    context: options?.context,
  })
  return duration
}
