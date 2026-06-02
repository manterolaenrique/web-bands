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

async function fillAllMatching(page: Page, selector: string, createValue: (index: number) => string) {
  const locator = page.locator(selector)
  const count = await locator.count()

  for (let index = 0; index < count; index += 1) {
    await locator.nth(index).fill(createValue(index))
  }
}

function createUploadFile(name: string, color: 'red' | 'green') {
  const payload =
    color === 'red'
      ? 'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAASSURBVBhXY7imofEfGTOQLgAAi0giUdqFnesAAAAASUVORK5CYII='
      : 'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAASSURBVBhXY9Ca6/IfGTOQLgAARJAgoQRi7i0AAAAASUVORK5CYII='

  return {
    name,
    mimeType: 'image/png',
    buffer: Buffer.from(payload, 'base64'),
  }
}

test('owner can edit their band and see the public update', async ({page}) => {
  test.skip(!fixture, fixtureState.ready ? undefined : fixtureState.reason)

  if (!fixture) {
    return
  }

  const runId = Date.now().toString().slice(-6)
  const heroTitle = `Codex E2E Hero ${runId}`
  const aboutContent =
    `Contenido actualizado por Playwright para verificar el flujo autenticado de dashboard a pagina publica. ${runId}`
  const memberName = `Integrante Codex ${runId}`
  const memberInstrument = 'Sintetizador'
  const timelineTitle = `Cronologia Codex ${runId}`
  const timelineDescription = `Linea de tiempo actualizada desde el dashboard privado. ${runId}`
  const timelineEventName = `Primer lanzamiento ${runId}`
  const listenDescription = `Escuchanos en todas las plataformas desde esta prueba E2E. ${runId}`
  const youtubeVideoTitle = `Video Codex ${runId}`
  const spotifyPlaylistTitle = `Playlist Codex ${runId}`
  const spotifyProfileUrl = 'https://open.spotify.com/artist/4NHQUGzhtTLFvgF5SZesLK'
  const contactEmail = `booking-${runId}@webbands.dev`
  const contactLocation = 'Buenos Aires, Argentina'
  const contactTwitter = `https://x.com/webbands_${runId}`
  const featuredTitle = `Lanzamiento QA ${runId}`
  const featuredEyebrow = 'Release activo'
  const featuredDescription = `Bloque principal actualizado para verificar persistencia completa. ${runId}`
  const featuredSpotifyUrl = 'https://open.spotify.com/track/e2e-track-123'
  const showVenue = 'Teatro QA'
  const showLocation = 'La Plata'
  const galleryCaption = `Archivo visual QA ${runId}`
  const seoTitle = `QA Band SEO ${runId}`
  const seoDescription = `Metadata SEO actualizada desde Playwright. ${runId}`
  const seoKeywords = 'metal argentino, doom, directo en vivo'
  const primaryColor = '#D62828'
  const secondaryColor = '#F4C430'
  const secondaryLightColor = '#7BD389'
  const accentColor = '#2A9D44'

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
  await page.locator('input[name="hero.showSpotlightCard"]').uncheck()
  await page.locator('textarea[name="about.content"]').fill(aboutContent)
  await page.locator('input[name="colors.primary"]').fill(primaryColor)
  await page.locator('input[name="colors.secondary"]').fill(secondaryColor)
  await page.locator('input[name="colors.secondaryLight"]').fill(secondaryLightColor)
  await page.locator('input[name="colors.accent"]').fill(accentColor)
  await page.getByRole('button', {name: 'Agregar integrante'}).click()
  await expect(page.getByText('Integrante agregado.')).toBeVisible()
  const memberNameInput = page.locator('input[name^="about.integrantes."][name$=".nombre"]').last()
  const memberSection = memberNameInput.locator('xpath=ancestor::section[1]')
  await expect(memberSection.getByText('Pendiente')).toBeVisible()
  await expect(memberSection.locator('.editor-inline-note')).toContainText(
    'Completa los campos y guarda para habilitar la imagen.'
  )
  await expect(memberSection.locator('input[type="file"]')).toBeDisabled()
  await memberSection.scrollIntoViewIfNeeded()
  const saveBarBox = await page.locator('.editor-savebar').boundingBox()
  expect(saveBarBox?.y ?? 999).toBeGreaterThanOrEqual(0)
  expect(saveBarBox?.y ?? 999).toBeLessThan(200)
  await memberNameInput.fill(memberName)
  await page
    .locator('input[name^="about.integrantes."][name$=".instrumento"]')
    .last()
    .fill(memberInstrument)

  await page.locator('input[name="timelineSection.enabled"]').check()
  await page.locator('input[name="timelineSection.titulo"]').fill(timelineTitle)
  await page.locator('textarea[name="timelineSection.descripcion"]').fill(timelineDescription)
  await page.getByRole('button', {name: 'Agregar evento'}).click()
  await expect(page.getByText('Evento agregado.')).toBeVisible()
  const timelineEventNameInput = page.locator('input[name^="timelineSection.events."][name$=".name"]').last()
  const timelineSection = timelineEventNameInput.locator('xpath=ancestor::section[1]')
  await expect(timelineSection.getByText('Pendiente')).toBeVisible()
  await expect(timelineSection.locator('.editor-inline-note')).toContainText(
    'Completa los campos y guarda para habilitar la imagen.'
  )
  await timelineEventNameInput.fill(timelineEventName)
  await page.locator('input[name^="timelineSection.events."][name$=".date"]').last().fill('2024-02-20')

  await page.locator('input[name="escuchanos.titulo"]').fill('Escuchanos')
  await page.locator('textarea[name="escuchanos.descripcion"]').fill(listenDescription)
  await page.locator('input[name="escuchanos.youtube.habilitado"]').check()
  await page.locator('input[name="escuchanos.youtube.titulo"]').fill('Canal principal')
  await ensureArrayItem(page, 'Agregar video', 'input[name^="escuchanos.youtube.videos."][name$=".titulo"]')
  await page.locator('input[name^="escuchanos.youtube.videos."][name$=".titulo"]').last().fill(youtubeVideoTitle)
  await page
    .locator('input[name^="escuchanos.youtube.videos."][name$=".url"]')
    .last()
    .fill('https://www.youtube.com/watch?v=codexe2e123')
  await page
    .locator('textarea[name^="escuchanos.youtube.videos."][name$=".descripcion"]')
    .last()
    .fill('Video destacado desde la prueba E2E.')

  await page.locator('input[name="escuchanos.spotify.habilitado"]').check()
  await page.locator('input[name="escuchanos.spotify.titulo"]').fill('Perfil oficial')
  await page.locator('input[name="escuchanos.spotify.perfil_url"]').fill(spotifyProfileUrl)
  await ensureArrayItem(page, 'Agregar playlist', 'input[name^="escuchanos.spotify.playlists."][name$=".titulo"]')
  await fillAllMatching(
    page,
    'input[name^="escuchanos.spotify.playlists."][name$=".titulo"]',
    (index) => `${spotifyPlaylistTitle} ${index + 1}`
  )
  await fillAllMatching(
    page,
    'input[name^="escuchanos.spotify.playlists."][name$=".url"]',
    (index) => `https://open.spotify.com/playlist/codexe2e${runId}${index + 1}`
  )
  await page.locator('input[name="contact.email"]').fill(contactEmail)
  await page.locator('input[name="contact.location"]').fill(contactLocation)
  await page.locator('input[name="contact.twitter"]').fill(contactTwitter)

  await page.locator('input[name="featuredRelease.eyebrow"]').fill(featuredEyebrow)
  await page.locator('input[name="featuredRelease.title"]').fill(featuredTitle)
  await page.locator('textarea[name="featuredRelease.description"]').fill(featuredDescription)
  await page.locator('input[name="featuredRelease.spotifyUrl"]').fill(featuredSpotifyUrl)

  await ensureArrayItem(page, 'Agregar show', 'input[name^="showsSection.shows."][name$=".venue"]')
  await page.locator('input[name="showsSection.titulo"]').fill('Shows QA')
  await page.locator('textarea[name="showsSection.descripcion"]').fill('Fechas de prueba para validar el bloque publico.')
  await page.locator('input[name^="showsSection.shows."][name$=".date"]').last().fill('2026-07-20')
  await page.locator('input[name^="showsSection.shows."][name$=".venue"]').last().fill(showVenue)
  await page.locator('input[name^="showsSection.shows."][name$=".location"]').last().fill(showLocation)
  await page
    .locator('input[name^="showsSection.shows."][name$=".ticketUrl"]')
    .last()
    .fill('https://example.com/e2e-show')

  await ensureArrayItem(page, 'Agregar imagen', 'input[name^="gallerySection.items."][name$=".caption"]')
  await page.locator('input[name="gallerySection.titulo"]').fill('Galeria QA')
  await page.locator('input[name^="gallerySection.items."][name$=".alt"]').last().fill('Poster QA')
  await page.locator('input[name^="gallerySection.items."][name$=".caption"]').last().fill(galleryCaption)
  await page
    .locator('input[name^="gallerySection.items."][name$=".link"]')
    .last()
    .fill('https://example.com/e2e-gallery')

  await page.locator('input[name="seo.title"]').fill(seoTitle)
  await page.locator('textarea[name="seo.description"]').fill(seoDescription)
  await page.locator('input[name="seo.keywords"]').fill(seoKeywords)

  await expect(page.getByRole('button', {name: 'Guardar cambios'})).toBeEnabled()
  const saveResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/bands/${fixture.band.id}`) &&
      response.request().method() === 'PATCH'
  )
  await page.getByRole('button', {name: 'Guardar cambios'}).click()
  const saveResponse = await saveResponsePromise
  const saveBody = await saveResponse.json().catch(() => ({}))
  expect(saveResponse.status(), JSON.stringify(saveBody)).toBe(200)
  await expect(page.getByText('Cambios guardados. La pagina publica ya esta sincronizada.')).toBeVisible()
  await expect(memberSection.locator('input[type="file"]')).toBeEnabled()
  await memberSection.locator('input[type="file"]').setInputFiles(createUploadFile('member-red.png', 'red'))
  await expect(memberSection.getByText('Imagen subida correctamente.')).toBeVisible()

  const featuredSection = page.locator('.form-section').filter({hasText: 'Lanzamiento destacado'}).first()
  await featuredSection.locator('input[type="file"]').setInputFiles(createUploadFile('featured-red.png', 'red'))
  await expect(featuredSection.getByText('Imagen subida correctamente.')).toBeVisible()

  await page.goto('/dashboard')
  await expect(page.getByRole('heading', {name: 'Mis bandas'})).toBeVisible()
  await bandCard.getByRole('link', {name: 'Editar'}).click()
  await expect(page).toHaveURL(new RegExp(`/dashboard/bands/${fixture.band.id}$`))
  await expect(page.locator('input[name="colors.primary"]')).toHaveValue(primaryColor)
  await expect(page.locator('input[name="colors.secondary"]')).toHaveValue(secondaryColor)
  await expect(page.locator('input[name="hero.showSpotlightCard"]')).not.toBeChecked()
  await expect(page.locator('input[name="contact.email"]')).toHaveValue(contactEmail)
  await expect(page.locator('input[name="contact.twitter"]')).toHaveValue(contactTwitter)
  await expect(page.locator('input[name="featuredRelease.title"]')).toHaveValue(featuredTitle)
  await expect(page.locator('input[name="seo.title"]')).toHaveValue(seoTitle)
  await expect(page.locator('input[name="seo.keywords"]')).toHaveValue(seoKeywords)
  await expect(page.getByText('Guardado').first()).toBeVisible()

  const featuredPreview = await featuredSection
    .locator('.asset-uploader__preview')
    .evaluate((node) => getComputedStyle(node).backgroundImage)
  expect(featuredPreview).not.toBe('none')

  await page.goto(`/bandas/${fixture.band.slug}`)
  await expect(page.getByRole('heading', {level: 1, name: heroTitle})).toBeVisible()
  await expect(page.getByText(aboutContent)).toBeVisible()
  await expect(page.getByText(memberName)).toBeVisible()
  await expect(page.getByRole('heading', {level: 2, name: timelineTitle})).toBeVisible()
  await expect(page.getByText(timelineDescription)).toBeVisible()
  await expect(page.getByText(timelineEventName)).toBeVisible()
  await expect(page.getByRole('heading', {level: 2, name: featuredTitle})).toBeVisible()
  await expect(page.getByText(showVenue)).toBeVisible()
  await expect(page.locator(`img[alt="Foto de ${memberName}"]`)).toBeVisible()
  await expect(page.locator('.spotlight-card')).toHaveCount(0)
  await expect(page.locator('.public-hero__content')).toHaveClass(/public-hero__content--single/)
  await expect(page.getByText(youtubeVideoTitle)).toBeVisible()
  await expect(page.getByText(`${spotifyPlaylistTitle} 1`)).toBeVisible()
  await expect(page.locator(`iframe[title="YouTube: ${youtubeVideoTitle}"]`)).toBeVisible()
  await expect(page.locator('iframe[title="Spotify: perfil oficial"]')).toBeVisible()
  await expect(page.locator(`iframe[title="Spotify: ${spotifyPlaylistTitle} 1"]`)).toBeVisible()
  await expect(page.locator('.contact-panel--social[data-network="twitter"] .contact-panel__icon')).toBeVisible()
  await expect(page.getByRole('link', {name: 'X / Twitter'})).toHaveAttribute('href', contactTwitter)

  const bandTheme = await page.locator('main.public-band-shell').evaluate((node) => ({
    primary: getComputedStyle(node).getPropertyValue('--band-primary').trim().toLowerCase(),
    secondary: getComputedStyle(node).getPropertyValue('--band-secondary').trim().toLowerCase(),
    accent: getComputedStyle(node).getPropertyValue('--band-accent').trim().toLowerCase(),
    secondaryLight: getComputedStyle(node).getPropertyValue('--band-secondary-light').trim().toLowerCase(),
  }))

  expect(bandTheme.primary).toBe(primaryColor.toLowerCase())
  expect(bandTheme.secondary).toBe(secondaryColor.toLowerCase())
  expect(bandTheme.accent).toBe(accentColor.toLowerCase())
  expect(bandTheme.secondaryLight).toBe(secondaryLightColor.toLowerCase())
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
      /Invitacion enviada correctamente.|La invitacion fue creada, pero no se pudo enviar el email.|La invitacion pendiente fue actualizada.|La invitacion fue actualizada, pero no se pudo enviar el email.|Ese usuario ya pertenece a la banda./
    )
  ).toBeVisible()

  if (await page.getByText('Ese usuario ya pertenece a la banda.').isVisible()) {
    return
  }

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
