import {createClient} from '@sanity/client'

import {getSanityWriteToken, sanityEnv} from '@/lib/env'

export const publicSanityClient = createClient({
  projectId: sanityEnv.projectId,
  dataset: sanityEnv.dataset,
  apiVersion: sanityEnv.apiVersion,
  useCdn: false,
})

function resolveSanityServerToken() {
  const readToken = process.env.SANITY_API_READ_TOKEN?.trim()
  if (readToken && readToken !== 'sk_sanity_read_token_optional') {
    return readToken
  }

  return process.env.SANITY_API_WRITE_TOKEN?.trim()
}

export function getServerSanityClient() {
  const token = resolveSanityServerToken()

  return publicSanityClient.withConfig({
    token,
    useCdn: false,
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
