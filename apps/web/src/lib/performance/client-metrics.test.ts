import {describe, expect, it} from 'vitest'

import {
  appendClientMetricEntry,
  normalizeClientMetricContext,
  type ClientMetricEntry,
} from './client-metrics'

function createEntry(name: string): ClientMetricEntry {
  return {
    name,
    value: 12,
    unit: 'ms',
    timestamp: '2026-08-18T00:00:00.000Z',
    context: {},
  }
}

describe('normalizeClientMetricContext', () => {
  it('drops undefined values and keeps the rest stable', () => {
    expect(
      normalizeClientMetricContext({
        route: '/dashboard',
        duration: 120,
        visible: true,
        nullable: null,
        ignored: undefined,
      })
    ).toEqual({
      route: '/dashboard',
      duration: 120,
      visible: true,
      nullable: null,
    })
  })
})

describe('appendClientMetricEntry', () => {
  it('keeps only the latest entries when the limit is exceeded', () => {
    expect(
      appendClientMetricEntry([createEntry('one'), createEntry('two')], createEntry('three'), 2).map(
        (entry) => entry.name
      )
    ).toEqual(['two', 'three'])
  })
})
