import {describe, expect, it} from 'vitest'

import {buildTrackDownloadName, buildTrackStoragePath} from './shared'

describe('demos shared helpers', () => {
  it('builds deterministic storage paths inside the band folder', () => {
    expect(buildTrackStoragePath('band-1', 'track-1', 'Sobre Ruinas Demo V3.MP3')).toBe(
      'band-1/track-1/sobre-ruinas-demo-v3.mp3'
    )
  })

  it('builds friendly download names from band and track metadata', () => {
    expect(
      buildTrackDownloadName(
        'viejas-runas',
        'Sobre Ruinas Demo V3',
        'demo',
        '2026-06-08T12:00:00.000Z',
        'ruinas.mp3'
      )
    ).toBe('viejas-runas_sobre-ruinas-demo-v3_demo_2026-06-08.mp3')
  })
})
