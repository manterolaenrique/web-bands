import {readFileSync} from 'node:fs'
import {basename, extname, join} from 'node:path'

import {expect, test, type Page, type Response} from '@playwright/test'
import {createClient as createSupabaseClient} from '@supabase/supabase-js'

import {loadE2EFixture} from './fixture'

const fixtureState = loadE2EFixture()
const fixture = fixtureState.ready ? fixtureState.fixture : null
const audioFilePath = process.env.E2E_AUDIO_FILE?.trim() || null

function loadEnvFile() {
  const envPath = join(process.cwd(), '.env.local')
  const envText = readFileSync(envPath, 'utf8')

  return Object.fromEntries(
    envText
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0 && !line.trim().startsWith('#'))
      .map((line) => {
        const delimiterIndex = line.indexOf('=')
        return [line.slice(0, delimiterIndex), line.slice(delimiterIndex + 1)]
      })
  )
}

const env = loadEnvFile()

function getVisibleLoginSurface(page: Page) {
  return page.locator('.mobile-auth-screen:visible, .auth-card:visible').first()
}

async function loginAsFixtureOwner(page: Page) {
  if (!fixture) {
    return
  }

  await page.goto('/login')
  const loginSurface = getVisibleLoginSurface(page)
  await loginSurface.getByLabel('Email').fill(fixture.email)
  await loginSurface.getByLabel('Password').fill(fixture.password)
  await loginSurface.getByRole('button', {name: 'Entrar'}).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

function createCleanupClient() {
  return createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function requireResponse(response: Response | undefined, message: string) {
  expect(response, message).toBeTruthy()
  if (!response) {
    throw new Error(message)
  }

  return response
}

async function cleanupUpload(trackId: string | null, storagePath: string | null) {
  const supabase = createCleanupClient()

  if (trackId) {
    await supabase.from('band_audio_tracks').delete().eq('id', trackId)
  }

  if (storagePath) {
    await supabase.storage.from('band-demos').remove([storagePath])
  }
}

test.describe('real demo upload', () => {
  test('uploads a real audio file through signed storage', async ({page}) => {
    test.setTimeout(180_000)
    test.skip(!fixture, fixtureState.ready ? undefined : fixtureState.reason)
    test.skip(!audioFilePath, 'Set E2E_AUDIO_FILE to run the real audio upload check.')

    if (!fixture || !audioFilePath) {
      return
    }

    const runId = Date.now().toString().slice(-8)
    const fileBaseName = basename(audioFilePath, extname(audioFilePath))
    const trackTitle = `${fileBaseName} - QA ${runId}`
    let createdTrackId: string | null = null
    let storagePath: string | null = null

    try {
      await loginAsFixtureOwner(page)
      await page.goto(`/dashboard/bands/${fixture.band.id}/demos/upload`)
      await expect(page.locator('input[type="file"]')).toHaveCount(1)

      await page.locator('input[type="file"]').setInputFiles(audioFilePath)
      await page.getByLabel('Titulo').fill(trackTitle)
      await page
        .getByLabel('Descripcion o notas')
        .fill(`Prueba automatizada de upload real ${runId}.`)
      await page.getByLabel('Cancion relacionada').fill(fileBaseName)
      await page.getByLabel('Tipo').selectOption('mezcla')
      await page.getByLabel('Estado').selectOption('nuevo')

      const uploadResponses: Response[] = []
      page.on('response', (response) => {
        const url = response.url()
        if (
          url.includes(`/api/dashboard/bands/${fixture.band.id}/demos`) ||
          url.includes('/storage/v1/object/upload/sign/')
        ) {
          uploadResponses.push(response)
        }
      })

      await page.getByRole('button', {name: 'Guardar demo'}).click()

      const outcome = await Promise.race([
        page
          .waitForURL(
            (url) =>
              url.pathname.startsWith(`/dashboard/bands/${fixture.band.id}/demos/`) &&
              url.pathname !== `/dashboard/bands/${fixture.band.id}/demos/upload`,
            {timeout: 120_000}
          )
          .then(() => 'success' as const),
        page
          .locator('.status--error')
          .waitFor({state: 'visible', timeout: 120_000})
          .then(() => 'error' as const),
      ])

      const legacyMultipartResponse = uploadResponses.find((response) => {
        const url = new URL(response.url())
        return (
          url.pathname === `/api/dashboard/bands/${fixture.band.id}/demos` &&
          response.request().headers()['content-type']?.startsWith('multipart/form-data')
        )
      })

      if (legacyMultipartResponse) {
        const responseBody = await legacyMultipartResponse.text().catch(() => '')
        throw new Error(
          `Legacy multipart upload detected: ${legacyMultipartResponse.status()} ${
            legacyMultipartResponse.headers()['x-vercel-error'] || ''
          } ${responseBody}`.trim()
        )
      }

      if (outcome === 'error') {
        throw new Error(
          `Upload UI failed: ${await page.locator('.status--error').innerText()}`
        )
      }

      const uploadStartResponse = requireResponse(
        uploadResponses.find((response) =>
          response.url().includes(`/api/dashboard/bands/${fixture.band.id}/demos/uploads`)
        ),
        'Signed upload start response was not observed.'
      )
      const uploadStartBody = await uploadStartResponse.json().catch(() => null)
      createdTrackId = uploadStartBody?.upload?.trackId || null
      storagePath = uploadStartBody?.upload?.storagePath || null
      expect(
        uploadStartResponse.status(),
        `Upload start failed: ${JSON.stringify(uploadStartBody)}`
      ).toBe(201)

      const storageUploadResponse = requireResponse(
        uploadResponses.find((response) =>
          response.url().includes('/storage/v1/object/upload/sign/')
        ),
        'Supabase Storage upload response was not observed.'
      )
      const storageUploadBody = await storageUploadResponse.text().catch(() => '')
      expect(
        storageUploadResponse.status(),
        `Storage upload failed: ${storageUploadBody}`
      ).toBeGreaterThanOrEqual(200)
      expect(storageUploadResponse.status()).toBeLessThan(300)

      const finalizeResponse = requireResponse(
        uploadResponses.find((response) => {
          const url = new URL(response.url())
          return (
            url.pathname === `/api/dashboard/bands/${fixture.band.id}/demos` &&
            response.request().headers()['content-type']?.startsWith('application/json')
          )
        }),
        'Demo finalize response was not observed.'
      )
      const finalizeBody = await finalizeResponse.json().catch(() => null)
      createdTrackId = finalizeBody?.track?.id || createdTrackId
      expect(
        finalizeResponse.status(),
        `Demo finalize failed: ${JSON.stringify(finalizeBody)}`
      ).toBe(201)

      await expect(page).toHaveURL(
        new RegExp(`/dashboard/bands/${fixture.band.id}/demos/${createdTrackId}$`)
      )
      await expect(page.getByRole('heading', {name: trackTitle, exact: true})).toBeVisible()
    } finally {
      await cleanupUpload(createdTrackId, storagePath)
    }
  })
})
