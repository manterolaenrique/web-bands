import {describe, expect, it} from 'vitest'

import {
  bandUpdateSchema,
  createSanityImageRef,
  toSanityBandPatch,
  toSanityBandSet,
  toSanityBandUnset,
} from '@/lib/bands/validation'

const validPayload = {
  name: 'Demo Band',
  slug: 'demo-band',
  genre: 'Rock',
  status: 'published',
  colors: {
    primary: '#111827',
    secondary: '#6b7280',
    secondaryLight: '#f3f4f6',
    accent: '#155eef',
  },
  hero: {
    title: 'Demo Band',
    subtitle: 'Rock desde Buenos Aires',
    description: 'Una banda preparada para la V2.',
    showSpotlightCard: true,
  },
  about: {
    title: 'Quienes Somos',
    content: 'Una historia con suficiente contenido para pasar la validacion.',
    integrantes: [
      {
        _key: 'member-1',
        nombre: 'Ana',
        instrumento: 'Voz',
        foto: createSanityImageRef('image-member-1-jpg'),
      },
    ],
  },
  timelineSection: {
    enabled: true,
    titulo: 'Nuestra historia',
    descripcion: 'Los hitos mas importantes de la banda.',
    events: [
      {
        _key: 'event-1',
        name: 'Primer show',
        date: '2024-01-15',
        importance: 'principal',
        image: createSanityImageRef('image-event-1-jpg'),
        descripcion: 'Nuestro primer escenario importante.',
        link: 'https://example.com/show',
        icon: '🎤',
      },
    ],
  },
  contact: {
    email: 'hola@example.com',
    phone: '+54 11 5555 5555',
    location: 'Buenos Aires',
    instagram: 'https://instagram.com/demo',
    youtube: '',
    facebook: '',
    twitter: 'https://x.com/demo-band',
    spotify: '',
    tiktok: '',
  },
  escuchanos: {
    titulo: 'Escuchanos',
    descripcion: 'Todos nuestros lanzamientos.',
    youtube: {
      habilitado: true,
      titulo: 'Videos en YouTube',
      videos: [
        {
          _key: 'video-1',
          titulo: 'Live Session',
          url: 'https://www.youtube.com/watch?v=demo123',
          descripcion: 'Grabado en vivo.',
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
          titulo: 'Favoritas',
          url: 'https://open.spotify.com/playlist/demo',
          descripcion: 'Una seleccion curada.',
        },
      ],
    },
  },
  featuredRelease: {
    eyebrow: 'Nuevo lanzamiento',
    title: 'Cybernetic Pulse',
    description: 'Nuestro nuevo corte principal.',
    coverImage: createSanityImageRef('image-cover-1-jpg'),
    spotifyUrl: 'https://open.spotify.com/track/demo',
    youtubeUrl: 'https://www.youtube.com/watch?v=feature123',
    appleMusicUrl: '',
  },
  showsSection: {
    titulo: 'Proximos shows',
    descripcion: 'Fechas destacadas.',
    shows: [
      {
        _key: 'show-1',
        date: '2026-08-12',
        venue: 'Teatro Neon',
        location: 'Buenos Aires',
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
        image: createSanityImageRef('image-gallery-1-jpg'),
        alt: 'Live at the warehouse',
        caption: 'Show principal',
        link: 'https://example.com/gallery',
      },
    ],
  },
  seo: {
    title: 'Demo Band',
    description: 'Demo Band en Web Bands.',
    keywords: ['metal argentino', 'doom', 'show en vivo'],
  },
}

describe('bandUpdateSchema', () => {
  it('normalizes valid band payloads', () => {
    const parsed = bandUpdateSchema.parse(validPayload)

    expect(parsed.slug).toBe('demo-band')
    expect(parsed.contact.youtube).toBeUndefined()
    expect(parsed.status).toBe('published')
    expect(parsed.timelineSection.events[0]?.date).toContain('2024-01-15')
    expect(parsed.showsSection.shows[0]?.date).toContain('2026-08-12')
    expect(parsed.seo.keywords).toEqual(['metal argentino', 'doom', 'show en vivo'])
    expect(parsed.hero.showSpotlightCard).toBe(true)
  })

  it('rejects invalid slugs', () => {
    const result = bandUpdateSchema.safeParse({
      ...validPayload,
      slug: 'Demo Band!',
    })

    expect(result.success).toBe(false)
  })

  it('rejects non-hex colors', () => {
    const result = bandUpdateSchema.safeParse({
      ...validPayload,
      colors: {
        ...validPayload.colors,
        primary: 'blue',
      },
    })

    expect(result.success).toBe(false)
  })

  it('allows empty optional colors from the dashboard form', () => {
    const parsed = bandUpdateSchema.parse({
      ...validPayload,
      colors: {
        ...validPayload.colors,
        secondaryLight: '',
        accent: '',
      },
    })

    expect(parsed.colors.secondaryLight).toBeUndefined()
    expect(parsed.colors.accent).toBeUndefined()
  })

  it('requires at least one timeline event when the section is enabled', () => {
    const result = bandUpdateSchema.safeParse({
      ...validPayload,
      timelineSection: {
        ...validPayload.timelineSection,
        events: [],
      },
    })

    expect(result.success).toBe(false)
  })

  it('rejects invalid nested video urls', () => {
    const result = bandUpdateSchema.safeParse({
      ...validPayload,
      escuchanos: {
        ...validPayload.escuchanos,
        youtube: {
          ...validPayload.escuchanos.youtube,
          videos: [
            {
              ...validPayload.escuchanos.youtube.videos[0],
              url: 'not-a-url',
            },
          ],
        },
      },
    })

    expect(result.success).toBe(false)
  })
})

describe('toSanityBandPatch', () => {
  it('maps dashboard payloads to Sanity field names', () => {
    const parsed = bandUpdateSchema.parse(validPayload)
    const patch = toSanityBandPatch(parsed)

    expect(patch.nombre).toBe('Demo Band')
    expect(patch.slug.current).toBe('demo-band')
    expect(patch.colores.primario).toBe('#111827')
    expect(patch.contacto.redes.instagram).toBe('https://instagram.com/demo')
    expect(patch.contacto.redes.twitter).toBe('https://x.com/demo-band')
    expect(patch.visibility).toBe('public')
    expect(patch.hero.showSpotlightCard).toBe(true)
    expect(patch.about.integrantes[0]?.foto?.asset?._ref).toBe('image-member-1-jpg')
    expect(patch.timelineSection?.events?.[0]?.image?.asset?._ref).toBe('image-event-1-jpg')
    expect(patch.featuredRelease?.coverImage?.asset?._ref).toBe('image-cover-1-jpg')
    expect(patch.gallerySection?.items?.[0]?.image?.asset?._ref).toBe('image-gallery-1-jpg')
    expect(patch.seo.palabras_clave).toEqual(['metal argentino', 'doom', 'show en vivo'])
  })

  it('creates dotted Sanity set paths and preserves nested arrays with image refs', () => {
    const parsed = bandUpdateSchema.parse(validPayload)
    const patchSet = toSanityBandSet(parsed)

    expect(patchSet['hero.titulo']).toBe('Demo Band')
    expect(patchSet['hero.showSpotlightCard']).toBe(true)
    expect(patchSet['about.contenido']).toBe('Una historia con suficiente contenido para pasar la validacion.')
    expect(patchSet['about.integrantes']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _key: 'member-1',
          foto: expect.objectContaining({
            asset: expect.objectContaining({
              _ref: 'image-member-1-jpg',
            }),
          }),
        }),
      ])
    )
    expect(patchSet['timelineSection.events']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _key: 'event-1',
          image: expect.objectContaining({
            asset: expect.objectContaining({
              _ref: 'image-event-1-jpg',
            }),
          }),
        }),
      ])
    )
    expect(patchSet['showsSection.shows']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _key: 'show-1',
          venue: 'Teatro Neon',
        }),
      ])
    )
    expect(patchSet['gallerySection.items']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _key: 'gallery-1',
          image: expect.objectContaining({
            asset: expect.objectContaining({
              _ref: 'image-gallery-1-jpg',
            }),
          }),
        }),
      ])
    )
    expect(patchSet).not.toHaveProperty('hero')
    expect(patchSet).not.toHaveProperty('contacto')
    expect(patchSet['seo.palabras_clave']).toEqual(['metal argentino', 'doom', 'show en vivo'])
  })

  it('creates unset paths for optional fields cleared in the dashboard', () => {
    const parsed = bandUpdateSchema.parse({
      ...validPayload,
      genre: '',
      hero: {
        ...validPayload.hero,
        subtitle: '',
      },
      timelineSection: {
        enabled: false,
        titulo: '',
        descripcion: '',
        events: [],
      },
      contact: {
        ...validPayload.contact,
        instagram: '',
        twitter: '',
      },
      escuchanos: {
        titulo: '',
        descripcion: '',
        youtube: {
          habilitado: false,
          titulo: '',
          videos: [],
        },
        spotify: {
          habilitado: false,
          titulo: '',
          perfil_url: '',
          playlists: [],
        },
      },
      featuredRelease: {
        eyebrow: '',
        title: '',
        description: '',
        spotifyUrl: '',
        youtubeUrl: '',
        appleMusicUrl: '',
      },
      showsSection: {
        titulo: '',
        descripcion: '',
        shows: [],
      },
      gallerySection: {
        titulo: '',
        items: [],
      },
      seo: {
        ...validPayload.seo,
        keywords: [],
      },
    })

    expect(toSanityBandUnset(parsed)).toEqual(
      expect.arrayContaining([
        'genero',
        'hero.subtitulo',
        'timelineSection',
        'contacto.redes.instagram',
        'contacto.redes.twitter',
        'escuchanos',
        'featuredRelease',
        'showsSection',
        'gallerySection',
        'seo.palabras_clave',
      ])
    )
  })
})
