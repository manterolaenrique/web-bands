import {chromium, type FullConfig} from '@playwright/test'
import {mkdir, rm} from 'node:fs/promises'
import path from 'node:path'

const generatedDir = path.join(process.cwd(), 'e2e', '.generated')
const storageStatePath = path.join(generatedDir, 'vercel-protection-state.json')

function getConfiguredBaseURL(config: FullConfig) {
  const configured = config.projects.find((project) => typeof project.use.baseURL === 'string')?.use.baseURL
  return typeof configured === 'string' ? configured : process.env.PLAYWRIGHT_BASE_URL
}

function getVercelProtectionSeedUrl(baseURL: string | undefined) {
  const shareUrl = process.env.PLAYWRIGHT_VERCEL_SHARE_URL?.trim()
  if (shareUrl) {
    return shareUrl
  }

  const bypassToken = process.env.PLAYWRIGHT_VERCEL_PROTECTION_BYPASS_TOKEN?.trim()
  if (!bypassToken) {
    return null
  }

  if (!baseURL) {
    throw new Error(
      'PLAYWRIGHT_BASE_URL is required when using PLAYWRIGHT_VERCEL_PROTECTION_BYPASS_TOKEN.'
    )
  }

  const targetPath = process.env.PLAYWRIGHT_VERCEL_PROTECTION_PATH?.trim() || '/'
  const seedUrl = new URL(targetPath, baseURL)
  seedUrl.searchParams.set('x-vercel-set-bypass-cookie', 'true')
  seedUrl.searchParams.set('x-vercel-protection-bypass', bypassToken)

  return seedUrl.toString()
}

async function clearVercelProtectionState() {
  await rm(storageStatePath, {force: true})
}

export default async function globalSetup(config: FullConfig) {
  const baseURL = getConfiguredBaseURL(config)
  const protectionSeedUrl = getVercelProtectionSeedUrl(baseURL)

  if (!protectionSeedUrl) {
    await clearVercelProtectionState()
    return
  }

  await mkdir(generatedDir, {recursive: true})

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    const response = await page.goto(protectionSeedUrl, {
      timeout: 60_000,
      waitUntil: 'domcontentloaded',
    })
    await page.waitForTimeout(2_000)

    if (page.url().startsWith('https://vercel.com/login')) {
      throw new Error(
        'The Vercel preview still redirected to vercel.com/login. For headless Playwright runs, prefer PLAYWRIGHT_VERCEL_PROTECTION_BYPASS_TOKEN or disable preview protection temporarily.'
      )
    }

    if (!response || !response.ok()) {
      const status = response ? `${response.status()} ${response.statusText()}` : 'no response'
      throw new Error(`Could not initialize Vercel preview access for Playwright (${status}).`)
    }

    await context.storageState({path: storageStatePath})
  } finally {
    await context.close()
    await browser.close()
  }
}
