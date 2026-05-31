import {expect, test, type Page} from '@playwright/test'

import {loadE2EFixture} from './fixture'

const fixtureState = loadE2EFixture()
const fixture = fixtureState.ready ? fixtureState.fixture : null

async function login(page: Page) {
  if (!fixture) {
    throw new Error(fixtureState.reason)
  }

  await loginAs(page, fixture.email, fixture.password)
}

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', {name: 'Entrar'}).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

async function ensureArrayItem(page: Page, addButtonName: string, selector: string) {
  if ((await page.locator(selector).count()) === 0) {
    await page.getByRole('button', {name: addButtonName}).click()
  }
}

test('owner can edit their band and see the public update', async ({page}) => {
  test.skip(!fixture, fixtureState.ready ? undefined : fixtureState.reason)

  if (!fixture) {
    return
  }

  const heroTitle = 'Codex E2E Hero Updated'
  const aboutContent =
    'Contenido actualizado por Playwright para verificar el flujo autenticado de dashboard a pagina publica.'
  const memberName = 'Integrante Codex E2E'
  const memberInstrument = 'Sintetizador'
  const timelineTitle = 'Cronologia Codex'
  const timelineDescription = 'Linea de tiempo actualizada desde el dashboard privado.'
  const timelineEventName = 'Primer lanzamiento E2E'
  const listenDescription = 'Escuchanos en todas las plataformas desde esta prueba E2E.'
  const youtubeVideoTitle = 'Video Codex E2E'
  const spotifyPlaylistTitle = 'Playlist Codex E2E'

  await login(page)
  await expect(page.getByRole('heading', {name: 'Mis bandas'})).toBeVisible()

  const bandCard = page
    .locator('article.dashboard-card')
    .filter({hasText: fixture.band.name})
    .first()
  await expect(bandCard).toBeVisible()
  await bandCard.getByRole('link', {name: 'Editar'}).click()

  await expect(page).toHaveURL(new RegExp(`/dashboard/bands/${fixture.band.id}$`))
  await page.locator('input[name="hero.title"]').fill(heroTitle)
  await page.locator('textarea[name="about.content"]').fill(aboutContent)
  await ensureArrayItem(page, 'Agregar integrante', 'input[name^="about.integrantes."][name$=".nombre"]')
  await page.locator('input[name^="about.integrantes."][name$=".nombre"]').last().fill(memberName)
  await page
    .locator('input[name^="about.integrantes."][name$=".instrumento"]')
    .last()
    .fill(memberInstrument)

  await page.locator('input[name="timelineSection.enabled"]').check()
  await page.locator('input[name="timelineSection.titulo"]').fill(timelineTitle)
  await page.locator('textarea[name="timelineSection.descripcion"]').fill(timelineDescription)
  await ensureArrayItem(page, 'Agregar evento', 'input[name^="timelineSection.events."][name$=".name"]')
  await page.locator('input[name^="timelineSection.events."][name$=".name"]').last().fill(timelineEventName)
  await page.locator('input[name^="timelineSection.events."][name$=".date"]').last().fill('2024-02-20')

  await page.locator('input[name="escuchanos.titulo"]').fill('Escuchanos')
  await page.locator('textarea[name="escuchanos.descripcion"]').fill(listenDescription)
  await page.locator('input[name="escuchanos.youtube.habilitado"]').check()
  await ensureArrayItem(page, 'Agregar video', 'input[name^="escuchanos.youtube.videos."][name$=".titulo"]')
  await page.locator('input[name^="escuchanos.youtube.videos."][name$=".titulo"]').last().fill(youtubeVideoTitle)
  await page
    .locator('input[name^="escuchanos.youtube.videos."][name$=".url"]')
    .last()
    .fill('https://www.youtube.com/watch?v=codexe2e123')

  await page.locator('input[name="escuchanos.spotify.habilitado"]').check()
  await ensureArrayItem(page, 'Agregar playlist', 'input[name^="escuchanos.spotify.playlists."][name$=".titulo"]')
  await page
    .locator('input[name^="escuchanos.spotify.playlists."][name$=".titulo"]')
    .last()
    .fill(spotifyPlaylistTitle)
  await page
    .locator('input[name^="escuchanos.spotify.playlists."][name$=".url"]')
    .last()
    .fill('https://open.spotify.com/playlist/codexe2e123')
  await page.getByRole('button', {name: 'Guardar cambios'}).click()

  await expect(page.getByText('Banda guardada. La pagina publica fue revalidada.')).toBeVisible()

  await page.goto('/dashboard')
  await expect(page.getByRole('heading', {name: 'Mis bandas'})).toBeVisible()
  await bandCard.getByRole('link', {name: 'Editar'}).click()
  await expect(page).toHaveURL(new RegExp(`/dashboard/bands/${fixture.band.id}$`))
  await expect(page.locator('input[name^="escuchanos.spotify.playlists."][name$=".titulo"]').last()).toHaveValue(
    spotifyPlaylistTitle
  )

  await page.goto(`/bandas/${fixture.band.slug}`)
  await expect(page.getByRole('heading', {level: 1, name: heroTitle})).toBeVisible()
  await expect(page.getByText(aboutContent)).toBeVisible()
  await expect(page.getByText(memberName)).toBeVisible()
  await expect(page.getByRole('heading', {level: 2, name: timelineTitle})).toBeVisible()
  await expect(page.getByText(timelineDescription)).toBeVisible()
  await expect(page.getByText(timelineEventName)).toBeVisible()
  await expect(page.getByText(listenDescription)).toBeVisible()
  await expect(page.getByText(youtubeVideoTitle)).toBeVisible()
})

test('invitee can open the invite link, authenticate, and accept the band access', async ({page}) => {
  test.skip(!fixture, fixtureState.ready ? undefined : fixtureState.reason)
  test.skip(!fixture?.invitee, 'Missing invitee fixture. Configure E2E_INVITEE_* or use managed fixture.')

  if (!fixture || !fixture.invitee) {
    return
  }

  await login(page)
  const bandCard = page
    .locator('article.dashboard-card')
    .filter({hasText: fixture.band.name})
    .first()
  await expect(bandCard).toBeVisible()
  await bandCard.getByRole('link', {name: 'Editar'}).click()
  await expect(page).toHaveURL(new RegExp(`/dashboard/bands/${fixture.band.id}$`))

  await page.locator('input[name="email"]').last().fill(fixture.invitee.email)
  await page.locator('select[name="role"]').last().selectOption('editor')
  await page.getByRole('button', {name: 'Enviar invitacion'}).click()

  await expect(
    page.getByText(
      /Invitacion enviada correctamente.|La invitacion fue creada, pero no se pudo enviar el email.|La invitacion pendiente fue actualizada.|La invitacion fue actualizada, pero no se pudo enviar el email./
    )
  ).toBeVisible()

  const inviteCard = page.locator('.member-card').filter({hasText: fixture.invitee.email}).first()
  await expect(inviteCard).toBeVisible()
  const inviteLink = inviteCard.getByRole('link', {name: 'Abrir enlace'})
  const inviteHref = await inviteLink.getAttribute('href')

  expect(inviteHref).toMatch(/^\/invite\//)

  await page.getByRole('button', {name: 'Cerrar sesion'}).click()
  await expect(page).toHaveURL(/\/login$/)

  await page.goto(inviteHref!)
  await expect(page.getByText('Inicia sesion con el email invitado para aceptar esta invitacion.')).toBeVisible()
  await page.getByRole('link', {name: 'Entrar para continuar'}).click()
  await expect(page).toHaveURL(/\/login\?next=/)

  await page.getByLabel('Email').fill(fixture.invitee.email)
  await page.getByLabel('Password').fill(fixture.invitee.password)
  await page.getByRole('button', {name: 'Entrar'}).click()
  await expect(page).toHaveURL(new RegExp(`${inviteHref!.replace('/', '\\/')}$`))
  await expect(page.getByText('Todo listo. Acepta la invitacion para sumar esta banda a tu dashboard.')).toBeVisible()

  await page.getByRole('button', {name: 'Aceptar invitacion'}).click()
  await expect(page).toHaveURL(/\/dashboard(\?|$)/)

  const inviteeBandCard = page
    .locator('article.dashboard-card')
    .filter({hasText: fixture.band.name})
    .first()
  await expect(inviteeBandCard).toBeVisible()
})
