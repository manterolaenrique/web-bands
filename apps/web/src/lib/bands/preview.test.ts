import {describe, expect, it} from 'vitest'

import {createPublicBandDraft} from '@/lib/bands/preview'
import type {BandEditorValues} from '@/lib/bands/editor'
import type {PublicBand} from '@/types/band'

function createValues(): BandEditorValues {
  return {
    name: 'QA Band',
    slug: 'qa-band',
    genre: 'Metal',
    status: 'published',
    colors: {
      primary: '#111111',
      secondary: '#222222',
      secondaryLight: '#333333',
      accent: '#444444',
    },
    hero: {
      title: 'Hero draft',
      subtitle: 'Subdraft',
      description: 'Descripcion draft',
      showSpotlightCard: true,
    },
    about: {
      title: 'Historia',
      content: 'Contenido de historia en draft.',
      integrantes: [],
    },
    timelineSection: {
      enabled: false,
      titulo: '',
      descripcion: '',
      events: [],
    },
    contact: {},
    escuchanos: {
      youtube: {habilitado: false, videos: []},
      spotify: {habilitado: false, playlists: []},
    },
    featuredRelease: {},
    showsSection: {
      shows: [],
    },
    gallerySection: {
      items: [],
    },
    presentation: {
      sectionOrder: ['members', 'featured', 'listen', 'about', 'timeline', 'shows', 'gallery', 'contact'],
    },
    internalKit: {
      keyLinks: [],
    },
    seo: {},
  }
}

describe('createPublicBandDraft', () => {
  it('reuses persisted images from the base band and current live text values', () => {
    const values = createValues()
    const baseBand: PublicBand = {
      _id: 'band-1',
      nombre: 'Base band',
      slug: {current: 'base-band'},
      logo: {
        _type: 'image',
        asset: {_type: 'reference', _ref: 'image-logo'},
      },
      hero: {
        imagen: {
          _type: 'image',
          asset: {_type: 'reference', _ref: 'image-hero'},
        },
      },
      about: {
        imagen: {
          _type: 'image',
          asset: {_type: 'reference', _ref: 'image-about'},
        },
      },
      featuredRelease: {
        coverImage: {
          _type: 'image',
          asset: {_type: 'reference', _ref: 'image-cover'},
        },
      },
    }

    const draft = createPublicBandDraft(values, baseBand)

    expect(draft.nombre).toBe('QA Band')
    expect(draft.hero?.titulo).toBe('Hero draft')
    expect(draft.hero?.imagen?.asset?._ref).toBe('image-hero')
    expect(draft.about?.imagen?.asset?._ref).toBe('image-about')
    expect(draft.featuredRelease?.coverImage?.asset?._ref).toBe('image-cover')
    expect(draft.presentation?.sectionOrder?.[0]).toBe('members')
  })
})
