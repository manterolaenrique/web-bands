import {sanityEnv} from '@/lib/env'
import type {SanityImage} from '@/types/band'

const EXTENSION_MAP: Record<string, string> = {
  jpg: 'jpg',
  png: 'png',
  webp: 'webp',
  gif: 'gif',
}

export function getSanityImageUrl(
  image: SanityImage | undefined,
  options: {width?: number; height?: number; fit?: 'crop' | 'max' | 'fill' | 'clip'} = {}
) {
  const ref = image?.asset?._ref
  if (!ref) return null

  const id = ref.replace(/^image-/, '')
  const extension = Object.keys(EXTENSION_MAP).find((ext) => id.endsWith(`-${ext}`))
  if (!extension) return null

  const assetId = id.replace(new RegExp(`-${extension}$`), `.${EXTENSION_MAP[extension]}`)
  const params = new URLSearchParams()

  if (options.width) params.set('w', String(options.width))
  if (options.height) params.set('h', String(options.height))
  if (options.fit) params.set('fit', options.fit)
  params.set('auto', 'format')
  params.set('q', '82')

  const query = params.toString()

  return `https://cdn.sanity.io/images/${sanityEnv.projectId}/${sanityEnv.dataset}/${assetId}${
    query ? `?${query}` : ''
  }`
}
