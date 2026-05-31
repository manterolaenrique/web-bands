import {describe, expect, it} from 'vitest'

import {resolveRequestContext} from './request-context'

describe('request context helpers', () => {
  it('extracts the first forwarded ip, request id and user agent', () => {
    const headers = new Headers({
      'user-agent': 'Vitest Browser',
      'x-forwarded-for': '203.0.113.9, 10.0.0.1',
      'x-vercel-id': 'gru1:iad1::abc',
    })

    expect(resolveRequestContext(headers)).toEqual({
      ip: '203.0.113.9',
      requestId: 'gru1:iad1::abc',
      userAgent: 'Vitest Browser',
    })
  })
})
