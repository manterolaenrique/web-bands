import {describe, expect, it} from 'vitest'

import {hashIdentityParts, normalizeIdentityEmail} from './identity'

describe('identity helpers', () => {
  it('normalizes emails for rate limiting and audit keys', () => {
    expect(normalizeIdentityEmail('  Demo@Example.com ')).toBe('demo@example.com')
  })

  it('hashes normalized identity parts deterministically', () => {
    expect(hashIdentityParts(['AUTH.LOGIN', ' Demo@Example.com ', '127.0.0.1'])).toBe(
      hashIdentityParts(['auth.login', 'demo@example.com', '127.0.0.1'])
    )
  })
})
