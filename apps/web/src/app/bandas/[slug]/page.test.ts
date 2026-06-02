import {beforeEach, describe, expect, it, vi} from 'vitest'

const mockGetPublicBandBySlug = vi.fn()

vi.mock('@/lib/sanity/queries', () => ({
  getPublicBandBySlug: (...args: unknown[]) => mockGetPublicBandBySlug(...args),
}))

vi.mock('@/lib/sanity/image', () => ({
  getSanityImageUrl: (image: {asset?: {_ref?: string}} | undefined) =>
    image?.asset?._ref ? `https://cdn.test/${image.asset._ref}.png` : null,
}))

import {generateMetadata} from '@/app/bandas/[slug]/page'

describe('band public page metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses SEO fields, keywords, and band favicon when available', async () => {
    mockGetPublicBandBySlug.mockResolvedValue({
      nombre: 'Viejas Runas',
      hero: {
        titulo: 'Viejas Runas Hero',
        descripcion: 'Descripcion hero',
      },
      seo: {
        titulo_seo: 'Viejas Runas SEO',
        descripcion_seo: 'Descripcion SEO',
        palabras_clave: ['metal', 'argentina'],
      },
      logo_favicon: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: 'image-favicon',
        },
      },
    })

    const metadata = await generateMetadata({
      params: Promise.resolve({slug: 'viejas-runas'}),
    })

    expect(metadata.title).toBe('Viejas Runas SEO')
    expect(metadata.description).toBe('Descripcion SEO')
    expect(metadata.keywords).toEqual(['metal', 'argentina'])
    expect(metadata.icons).toEqual({icon: 'https://cdn.test/image-favicon.png'})
  })
})
