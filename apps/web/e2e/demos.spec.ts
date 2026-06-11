import {readFileSync} from 'node:fs'
import {join} from 'node:path'

import {expect, test, type Page} from '@playwright/test'
import {createClient as createSupabaseClient} from '@supabase/supabase-js'

import {loadE2EFixture} from './fixture'

const fixtureState = loadE2EFixture()
const fixture = fixtureState.ready ? fixtureState.fixture : null

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

function createCleanupClient() {
  return createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function cleanupDemosArtifacts(trackIds: string[], playlistId: string | null) {
  const supabase = createCleanupClient()

  if (playlistId) {
    await supabase.from('band_audio_playlist_tracks').delete().eq('playlist_id', playlistId)
    await supabase.from('band_audio_playlists').delete().eq('id', playlistId)
  }

  for (const trackId of trackIds) {
    const {data: trackRow} = await supabase
      .from('band_audio_tracks')
      .select('storage_bucket, storage_path')
      .eq('id', trackId)
      .maybeSingle()

    if (trackRow?.storage_bucket && trackRow.storage_path) {
      await supabase.storage.from(trackRow.storage_bucket).remove([trackRow.storage_path])
    }

    await supabase.from('band_audio_tracks').delete().eq('id', trackId)
  }
}

function getVisibleLoginSurface(page: Page) {
  return page.locator('.mobile-auth-screen:visible, .auth-card:visible').first()
}

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  const loginSurface = getVisibleLoginSurface(page)
  await loginSurface.getByLabel('Email').fill(email)
  await loginSurface.getByLabel('Password').fill(password)
  await loginSurface.getByRole('button', {name: 'Entrar'}).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

function createSilentWavFile(name: string, durationSeconds = 12) {
  const sampleRate = 44_100
  const channelCount = 1
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8
  const sampleCount = sampleRate * durationSeconds
  const dataSize = sampleCount * channelCount * bytesPerSample
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(channelCount, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * channelCount * bytesPerSample, 28)
  buffer.writeUInt16LE(channelCount * bytesPerSample, 32)
  buffer.writeUInt16LE(bitsPerSample, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  return {
    name,
    mimeType: 'audio/wav',
    buffer,
  }
}

function createTinyPngFile(name: string) {
  return {
    name,
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn0t3sAAAAASUVORK5CYII=',
      'base64'
    ),
  }
}

test.describe('demos module', () => {
  test.use({viewport: {width: 390, height: 844}})

  test('owner can create a playlist, upload a demo and attach it to a playlist', async ({page}) => {
    test.skip(!fixture, fixtureState.ready ? undefined : fixtureState.reason)

    if (!fixture) {
      return
    }

    const runId = Date.now().toString().slice(-6)
    const playlistTitle = `Playlist QA ${runId}`
    const playlistDescription = `Lista privada creada por Playwright ${runId}`
    const playlistCover = createTinyPngFile(`playlist-cover-${runId}.png`)
    const trackTitle = `Demo QA ${runId}`
    const trackTitleTwo = `Demo QA B ${runId}`
    const trackDescription = `Audio privado validado contra Supabase real ${runId}`
    const relatedSongTitle = `Cancion QA ${runId}`
    const uploadFile = createSilentWavFile(`codex-demo-${runId}.wav`, 1)
    const uploadFileTwo = createSilentWavFile(`codex-demo-${runId}-b.wav`, 1)
    let createdPlaylistId: string | null = null
    const createdTrackIds: string[] = []

    try {
      await loginAs(page, fixture.email, fixture.password)

      const bandCard = page.locator('.dashboard-mobile-band-card').filter({hasText: fixture.band.name}).first()
      await expect(bandCard).toBeVisible()
      await bandCard.getByRole('link', {name: 'Demos'}).click()

      await expect(page).toHaveURL(new RegExp(`/dashboard/bands/${fixture.band.id}/demos$`))
      await expect(page.locator('.demos-page-header').getByRole('heading', {name: 'Demos', exact: true})).toBeVisible()
      await expect(page.getByText(new RegExp(`Audios privados de ${fixture.band.name}`))).toBeVisible()

      await page.locator('.demos-page-header').getByRole('button', {name: 'Nueva playlist'}).click()
      const playlistSheet = page.locator('.demos-sheet[aria-label="Nueva playlist"]')
      await expect(playlistSheet).toBeVisible()
      await playlistSheet.getByLabel('Nombre').fill(playlistTitle)
      await playlistSheet.getByLabel('Descripcion').fill(playlistDescription)
      await playlistSheet.locator('input[type="file"]').setInputFiles(playlistCover)
      const createPlaylistResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes(`/api/dashboard/bands/${fixture.band.id}/demos/playlists`) &&
          response.request().method() === 'POST'
      )
      await playlistSheet.getByRole('button', {name: 'Crear playlist'}).click()
      const createPlaylistResponse = await createPlaylistResponsePromise
      expect(createPlaylistResponse.status()).toBe(201)
      const createPlaylistBody = await createPlaylistResponse.json()
      createdPlaylistId =
        createPlaylistBody?.playlist && typeof createPlaylistBody.playlist === 'object' && 'id' in createPlaylistBody.playlist
          ? String(createPlaylistBody.playlist.id)
          : null
      expect(createdPlaylistId).toBeTruthy()

      await page.locator('.demos-page-header').getByRole('link', {name: 'Subir demo'}).click()
      await expect(page).toHaveURL(new RegExp(`/dashboard/bands/${fixture.band.id}/demos/upload$`))
      await expect(page.getByRole('heading', {name: 'Subir demo'})).toBeVisible()

      await page.locator('input[type="file"]').setInputFiles(uploadFile)
      await page.getByLabel('Titulo').fill(trackTitle)
      await page.getByLabel('Descripcion o notas').fill(trackDescription)
      await page.getByLabel('Cancion relacionada').fill(relatedSongTitle)
      await page.getByLabel('Tipo').selectOption('demo')
      await page.getByLabel('Estado').selectOption('aprobado')

      const uploadResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes(`/api/dashboard/bands/${fixture.band.id}/demos`) &&
          response.request().method() === 'POST'
      )
      await page.getByRole('button', {name: 'Guardar demo'}).click()
      const uploadResponse = await uploadResponsePromise
      expect(uploadResponse.status()).toBe(201)
      const uploadBody = await uploadResponse.json()
      const createdTrackId =
        uploadBody?.track && typeof uploadBody.track === 'object' && 'id' in uploadBody.track
          ? String(uploadBody.track.id)
          : null
      expect(createdTrackId).toBeTruthy()
      if (createdTrackId) {
        createdTrackIds.push(createdTrackId)
      }
      await expect(page).toHaveURL(new RegExp(`/dashboard/bands/${fixture.band.id}/demos/${createdTrackId}$`))

      await expect(page.locator('.demos-page-header').getByRole('heading', {name: trackTitle, exact: true})).toBeVisible()
      await expect(page.getByText(trackDescription)).toBeVisible()
      await expect(page.getByText(relatedSongTitle)).toBeVisible()

      const streamAccess = await page.evaluate(
        async ({bandId, currentTrackId}) => {
          const response = await fetch(`/api/dashboard/bands/${bandId}/demos/${currentTrackId}/access`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({mode: 'stream'}),
          })

          return {
            status: response.status,
            body: await response.json().catch(() => null),
          }
        },
        {
          bandId: fixture.band.id,
          currentTrackId: createdTrackId,
        }
      )
      expect(streamAccess.status).toBe(200)
      expect(streamAccess.body?.access?.mode).toBe('stream')
      expect(String(streamAccess.body?.access?.url || '')).toContain('token=')

      const downloadAccess = await page.evaluate(
        async ({bandId, currentTrackId}) => {
          const response = await fetch(`/api/dashboard/bands/${bandId}/demos/${currentTrackId}/access`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({mode: 'download'}),
          })

          return {
            status: response.status,
            body: await response.json().catch(() => null),
          }
        },
        {
          bandId: fixture.band.id,
          currentTrackId: createdTrackId,
        }
      )
      expect(downloadAccess.status).toBe(200)
      expect(downloadAccess.body?.access?.mode).toBe('download')
      expect(String(downloadAccess.body?.access?.fileName || '')).toMatch(/\.wav$/)

      await page.getByRole('button', {name: 'Agregar a playlist'}).click()
      const addToPlaylistSheet = page.locator('.demos-sheet[aria-label="Agregar a playlist"]')
      await expect(addToPlaylistSheet).toBeVisible()
      await addToPlaylistSheet.getByRole('button', {name: new RegExp(playlistTitle)}).click()
      await expect(addToPlaylistSheet).toBeHidden()

      await page.locator(`a[href="/dashboard/bands/${fixture.band.id}/demos/upload"]`).click()
      await expect(page).toHaveURL(new RegExp(`/dashboard/bands/${fixture.band.id}/demos/upload$`))
      await page.locator('input[type="file"]').setInputFiles(uploadFileTwo)
      await page.getByLabel('Titulo').fill(trackTitleTwo)
      await page.getByLabel('Descripcion o notas').fill(`${trackDescription} segunda toma`)
      await page.getByLabel('Cancion relacionada').fill(relatedSongTitle)
      await page.getByLabel('Tipo').selectOption('demo')
      await page.getByLabel('Estado').selectOption('aprobado')
      const secondUploadResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes(`/api/dashboard/bands/${fixture.band.id}/demos`) &&
          response.request().method() === 'POST'
      )
      await page.getByRole('button', {name: 'Guardar demo'}).click()
      const secondUploadResponse = await secondUploadResponsePromise
      expect(secondUploadResponse.status()).toBe(201)
      const secondUploadBody = await secondUploadResponse.json()
      const createdTrackIdTwo =
        secondUploadBody?.track && typeof secondUploadBody.track === 'object' && 'id' in secondUploadBody.track
          ? String(secondUploadBody.track.id)
          : null
      expect(createdTrackIdTwo).toBeTruthy()
      if (createdTrackIdTwo) {
        createdTrackIds.push(createdTrackIdTwo)
      }

      await page.getByRole('button', {name: 'Agregar a playlist'}).click()
      const addSecondTrackSheet = page.locator('.demos-sheet[aria-label="Agregar a playlist"]')
      await expect(addSecondTrackSheet).toBeVisible()
      await addSecondTrackSheet.getByRole('button', {name: new RegExp(playlistTitle)}).click()
      await expect(addSecondTrackSheet).toBeHidden()

      await page.locator(`a[href="/dashboard/bands/${fixture.band.id}/demos/playlists"]`).click()
      await expect(page).toHaveURL(new RegExp(`/dashboard/bands/${fixture.band.id}/demos/playlists$`))
      await expect(page.locator('.demos-page-header').getByRole('heading', {name: 'Playlists', exact: true})).toBeVisible()

      const playlistCard = page.locator('.demos-playlist-card').filter({hasText: playlistTitle}).first()
      await expect(playlistCard).toBeVisible()
      await expect(playlistCard.locator('img')).toBeVisible()
      await playlistCard.getByRole('link', {name: 'Abrir'}).click()
      await expect(page).toHaveURL(new RegExp(`/dashboard/bands/${fixture.band.id}/demos/playlists/${createdPlaylistId}$`))
      await expect(page.locator('.demos-page-header').getByRole('heading', {name: playlistTitle, exact: true})).toBeVisible()
      await expect(page.getByText(trackTitle)).toBeVisible()
      await expect(page.locator('.demos-featured-card__cover img')).toBeVisible()

      await page.locator('.demos-playlist-track-row').first().locator('.demos-playlist-track-row__play').click()
      const miniPlayer = page.locator('[data-testid="demos-mini-player"]')
      await expect(miniPlayer).toBeVisible()
      await expect(miniPlayer.locator('.demos-mini-player__title')).toHaveText(trackTitle)
      await expect
        .poll(async () => miniPlayer.locator('.demos-mini-player__title').textContent(), {
          timeout: 10000,
        })
        .toContain(trackTitleTwo)

      await page.getByRole('link', {name: 'Bandas'}).click()
      await expect(page).toHaveURL(/\/dashboard$/)
      await expect(miniPlayer).toBeVisible()
    } finally {
      await cleanupDemosArtifacts(createdTrackIds, createdPlaylistId)
    }
  })
})
