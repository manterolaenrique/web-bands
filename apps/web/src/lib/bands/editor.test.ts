import {describe, expect, it} from 'vitest'

import {
  areEditorValuesEqual,
  buildSavedArrayItems,
  mergeEditorValues,
  resolveArrayItemState,
  resolveSectionState,
  shouldRestoreDraft,
  type BandEditorValues,
  type StoredBandEditorSnapshot,
} from '@/lib/bands/editor'

function createValues(): BandEditorValues {
  return {
    name: 'QA Band',
    slug: 'qa-band',
    genre: 'Rock',
    status: 'published',
    colors: {
      primary: '#111111',
      secondary: '#222222',
      secondaryLight: '#333333',
      accent: '#444444',
    },
    hero: {
      title: 'QA Band',
      subtitle: 'Testing',
      description: 'Hero description',
      showSpotlightCard: true,
    },
    about: {
      title: 'Sobre nosotros',
      content: 'Contenido suficientemente largo para pasar validaciones y pruebas locales.',
      integrantes: [
        {
          _key: 'member-1',
          nombre: 'Ana',
          instrumento: 'Voz',
        },
      ],
    },
    timelineSection: {
      enabled: true,
      titulo: 'Timeline',
      descripcion: 'Descripcion timeline',
      events: [
        {
          _key: 'event-1',
          name: 'Primer show',
          date: '2026-01-01',
          importance: 'principal',
          descripcion: 'Evento clave',
          link: 'https://example.com/evento',
          icon: 'mic',
        },
      ],
    },
    contact: {
      email: 'qa@example.com',
      phone: '+54 11 5555 5555',
      location: 'Buenos Aires',
      instagram: 'https://instagram.com/qaband',
      youtube: '',
      facebook: '',
      twitter: 'https://x.com/qaband',
      spotify: '',
      tiktok: '',
    },
    escuchanos: {
      titulo: 'Escuchanos',
      descripcion: 'Streaming links',
      youtube: {
        habilitado: true,
        titulo: 'YouTube',
        videos: [
          {
            _key: 'video-1',
            titulo: 'Live',
            url: 'https://youtube.com/watch?v=demo',
            descripcion: 'Sesion en vivo',
          },
        ],
      },
      spotify: {
        habilitado: true,
        titulo: 'Spotify',
        perfil_url: 'https://open.spotify.com/artist/demo',
        playlists: [
          {
            _key: 'playlist-1',
            titulo: 'Playlist',
            url: 'https://open.spotify.com/playlist/demo',
            descripcion: 'Curada',
          },
        ],
      },
    },
    featuredRelease: {
      eyebrow: 'Nuevo',
      title: 'Release',
      description: 'Release desc',
      spotifyUrl: 'https://open.spotify.com/track/demo',
      youtubeUrl: 'https://youtube.com/watch?v=release',
      appleMusicUrl: '',
    },
    showsSection: {
      titulo: 'Shows',
      descripcion: 'Proximas fechas',
      shows: [
        {
          _key: 'show-1',
          date: '2026-06-10',
          venue: 'Venue',
          location: 'CABA',
          ticketUrl: 'https://example.com/tickets',
          status: 'tickets',
        },
      ],
    },
    gallerySection: {
      titulo: 'Galeria',
      items: [
        {
          _key: 'gallery-1',
          alt: 'Alt',
          caption: 'Caption',
          link: 'https://example.com/gallery',
        },
      ],
    },
    seo: {
      title: 'SEO title',
      description: 'SEO description',
      keywords: ['metal', 'argentina'],
    },
  }
}

describe('band editor helpers', () => {
  it('merges restored snapshots without losing server-only nested values', () => {
    const serverValues = createValues()
    const merged = mergeEditorValues(serverValues, {
      colors: {
        ...serverValues.colors,
        primary: '#d62828',
      },
      about: {
        ...serverValues.about,
        integrantes: [
          ...serverValues.about.integrantes,
          {
            _key: 'member-2',
            nombre: 'Beto',
            instrumento: 'Bajo',
          },
        ],
      },
    })

    expect(merged.colors.primary).toBe('#d62828')
    expect(merged.hero.title).toBe(serverValues.hero.title)
    expect(merged.about.integrantes).toHaveLength(2)
  })

  it('does not restore a stale draft when the server version is newer and the baseline changed', () => {
    const currentValues = createValues()
    const staleSnapshot: Partial<StoredBandEditorSnapshot> = {
      values: {
        ...currentValues,
        colors: {
          ...currentValues.colors,
          primary: '#d62828',
        },
      },
      baseline: {
        ...currentValues,
        hero: {
          ...currentValues.hero,
          title: 'Version vieja',
        },
      },
      savedAt: '2026-06-01T10:00:00.000Z',
    }

    expect(shouldRestoreDraft(staleSnapshot, currentValues, '2026-06-01T12:00:00.000Z')).toBe(false)
  })

  it('tracks saved array keys from the persisted baseline only', () => {
    const values = createValues()
    const saved = buildSavedArrayItems(values)

    expect(saved['about.integrantes']).toEqual({['member-1']: true})
    expect(saved['timelineSection.events']).toEqual({['event-1']: true})
    expect(saved['gallerySection.items']).toEqual({['gallery-1']: true})
  })

  it('marks new array items as pending and errored items as error', () => {
    const values = createValues()
    const newMember = {
      _key: 'member-2',
      nombre: 'Beto',
      instrumento: 'Bajo',
    }

    expect(
      resolveArrayItemState({
        item: newMember,
        baselineItems: values.about.integrantes,
        savedItems: buildSavedArrayItems(values)['about.integrantes'],
        fieldErrors: {},
        pathPrefix: 'about.integrantes.1',
      })
    ).toBe('pending')

    expect(
      resolveArrayItemState({
        item: values.about.integrantes[0],
        baselineItems: values.about.integrantes,
        savedItems: buildSavedArrayItems(values)['about.integrantes'],
        fieldErrors: {
          'about.integrantes.0.nombre': ['Required'],
        },
        pathPrefix: 'about.integrantes.0',
      })
    ).toBe('error')
  })

  it('computes section state from baseline deltas', () => {
    const baseline = createValues()
    const edited = createValues()
    edited.colors.primary = '#d62828'

    expect(
      resolveSectionState({
        values: edited,
        baselineValues: baseline,
        fieldErrors: {},
        pathPrefixes: ['colors'],
      })
    ).toBe('pending')

    expect(
      resolveSectionState({
        values: baseline,
        baselineValues: baseline,
        fieldErrors: {
          'colors.primary': ['Invalid'],
        },
        pathPrefixes: ['colors'],
      })
    ).toBe('error')

    expect(areEditorValuesEqual(baseline, createValues())).toBe(true)
  })
})
