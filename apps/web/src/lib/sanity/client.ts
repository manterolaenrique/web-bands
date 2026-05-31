import {createClient} from '@sanity/client'

import {getSanityWriteToken, sanityEnv} from '@/lib/env'

export const publicSanityClient = createClient({
  projectId: sanityEnv.projectId,
  dataset: sanityEnv.dataset,
  apiVersion: sanityEnv.apiVersion,
  useCdn: false,
})

export function getServerSanityClient() {
  const token = process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN

  return publicSanityClient.withConfig({
    token,
    useCdn: !token,
    perspective: token ? 'published' : undefined,
  })
}

export function getSanityWriteClient() {
  const token = getSanityWriteToken()

  if (!token) {
    throw new Error('Missing SANITY_API_WRITE_TOKEN.')
  }

  return publicSanityClient.withConfig({
    token,
    useCdn: false,
  })
}
