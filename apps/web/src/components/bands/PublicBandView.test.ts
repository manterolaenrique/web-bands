import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import type {PublicBand} from '@/types/band'

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) =>
    createElement('img', {
      ...props,
      src: typeof props.src === 'string' ? props.src : '',
    }),
}))

vi.mock('@/components/ui/Reveal', () => ({
  Reveal: ({as, children, ...props}: Record<string, unknown>) =>
    createElement(typeof as === 'string' ? as : 'div', props, children as never),
}))

vi.mock('@/lib/sanity/image', () => ({
  getSanityImageUrl: (image: {asset?: {_ref?: string}} | undefined) =>
    image?.asset?._ref ? `https://cdn.test/${image.asset._ref}.jpg` : null,
}))

import {PublicBandView} from '@/components/bands/PublicBandView'

function createBand(overrides: Partial<PublicBand> = {}): PublicBand {
  return {
    _id: 'band-1',
    nombre: 'Viejas Runas',
    genero: 'Metal',
    slug: {current: 'viejas-runas'},
    logo: {
      _type: 'image',
      asset: {_type: 'reference', _ref: 'image-logo'},
    },
    hero: {
      titulo: 'Viejas Runas',
      subtitulo: 'Metal de Buenos Aires',
      descripcion: 'Una descripcion principal.',
      showSpotlightCard: true,
      imagen: {
        _type: 'image',
        asset: {_type: 'reference', _ref: 'image-hero'},
      },
    },
    about: {
      titulo: 'Nuestra historia',
      contenido: 'Primer parrafo.\n\nSegundo parrafo.',
      integrantes: [
        {
          _key: 'member-1',
          nombre: 'Ana',
          instrumento: 'Voz',
          foto: {
            _type: 'image',
            asset: {_type: 'reference', _ref: 'image-member'},
          },
        },
      ],
    },
    timelineSection: {
      enabled: true,
      titulo: 'Linea de tiempo',
      descripcion: 'Momentos clave.',
      events: [
        {
          _key: 'event-1',
          name: 'Primer show',
          date: '2024-01-15T00:00:00.000Z',
          importance: 'principal',
          image: {
            _type: 'image',
            asset: {_type: 'reference', _ref: 'image-event'},
          },
          descripcion: 'Evento importante.',
          link: 'https://example.com/evento',
          icon: 'mic',
        },
      ],
    },
    escuchanos: {
      titulo: 'Escuchanos',
      descripcion: 'Todo nuestro material.',
      youtube: {
        habilitado: true,
        titulo: 'Videos',
        videos: [
          {
            _key: 'video-1',
            titulo: 'Sesion en vivo',
            url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
            descripcion: 'Grabado en estudio.',
          },
        ],
      },
      spotify: {
        habilitado: true,
        titulo: 'Spotify',
        perfil_url: 'https://open.spotify.com/artist/1234567890ab',
        playlists: [
          {
            _key: 'playlist-1',
            titulo: 'Favoritas',
            url: 'https://open.spotify.com/playlist/1234567890ab',
            descripcion: 'Curada por la banda.',
          },
        ],
      },
    },
    featuredRelease: {
      eyebrow: 'Nuevo lanzamiento',
      title: 'Ritual',
      description: 'El nuevo corte de la banda.',
      spotifyUrl: 'https://open.spotify.com/track/demo',
      youtubeUrl: 'https://youtube.com/watch?v=ritual',
    },
    contacto: {
      email: 'booking@example.com',
      telefono: '+54 11 5555 5555',
      ubicacion: 'Buenos Aires',
      redes: {
        instagram: 'https://instagram.com/viejasrunas',
        twitter: 'https://x.com/viejasrunas',
      },
    },
    colores: {
      primario: '#d62828',
      secundario: '#f4c430',
      secundario_claro: '#7bd389',
      acento: '#2a9d44',
    },
    ...overrides,
  } as PublicBand
}

describe('PublicBandView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders member photos, embeds, and social icons in the public page', () => {
    const html = renderToStaticMarkup(createElement(PublicBandView, {band: createBand()}))

    expect(html).toContain('Foto de Ana')
    expect(html).toContain('Evento principal')
    expect(html).toContain('Sesion en vivo')
    expect(html).toContain('Favoritas')
    expect(html).toContain('X / Twitter')
    expect(html).toContain('title="YouTube: Sesion en vivo"')
    expect(html).toContain('https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0')
    expect(html).toContain('title="Spotify: perfil oficial"')
    expect(html).toContain('https://open.spotify.com/embed/playlist/1234567890ab?utm_source=generator')
    expect(html).toContain('data-network="twitter"')
    expect(html).toContain('contact-panel__icon')
  })

  it('hides the timeline when the section is disabled', () => {
    const html = renderToStaticMarkup(
      createElement(PublicBandView, {
        band: createBand({
          timelineSection: {
            enabled: false,
            titulo: 'Linea de tiempo',
            descripcion: 'No deberia verse.',
            events: [
              {
                _key: 'event-1',
                name: 'Primer show',
                date: '2024-01-15T00:00:00.000Z',
                importance: 'principal',
                icon: 'mic',
              },
            ],
          },
        }),
      })
    )

    expect(html).not.toContain('No deberia verse.')
    expect(html).not.toContain('Primer show')
  })

  it('hides the hero spotlight card when the hero toggle is disabled', () => {
    const html = renderToStaticMarkup(
      createElement(PublicBandView, {
        band: createBand({
          hero: {
            ...createBand().hero,
            showSpotlightCard: false,
          },
        }),
      })
    )

    expect(html).toContain('public-hero__content--single')
    expect(html).not.toContain('spotlight-card')
    expect(html).toContain('Ritual')
  })

  it('falls back to external links when media urls cannot be embedded', () => {
    const html = renderToStaticMarkup(
      createElement(PublicBandView, {
        band: createBand({
          escuchanos: {
            titulo: 'Escuchanos',
            descripcion: 'Todo nuestro material.',
            youtube: {
              habilitado: true,
              titulo: 'Videos',
              videos: [
                {
                  _key: 'video-1',
                  titulo: 'Sesion en vivo',
                  url: 'https://example.com/video-invalido',
                  descripcion: 'Grabado en estudio.',
                },
              ],
            },
            spotify: {
              habilitado: true,
              titulo: 'Spotify',
              perfil_url: 'https://example.com/perfil-invalido',
              playlists: [
                {
                  _key: 'playlist-1',
                  titulo: 'Favoritas',
                  url: 'https://example.com/playlist-invalida',
                  descripcion: 'Curada por la banda.',
                },
              ],
            },
          },
        }),
      })
    )

    expect(html).toContain('No se pudo embeber este video')
    expect(html).toContain('Abrir en YouTube')
    expect(html).toContain('No se pudo embeber este perfil')
    expect(html).toContain('No se pudo embeber esta playlist')
    expect(html).toContain('Abrir en Spotify')
  })
})
