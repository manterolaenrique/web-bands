import {expect, test, type Page} from '@playwright/test'

function getVisibleLoginSurface(page: Page) {
  return page.locator('.mobile-auth-screen:visible, .auth-card:visible').first()
}

test('home shows the public bands directory', async ({page}) => {
  await page.goto('/')

  await expect(page.getByRole('heading', {name: 'Bandas listas para descubrir'})).toBeVisible()
  await expect(page.getByRole('heading', {name: 'Bandas publicadas'})).toBeVisible()
  await expect(page.locator('a[href^="/bandas/"]').first()).toBeVisible()
})

test('dashboard redirects guests to login', async ({page}) => {
  await page.goto('/dashboard')

  await expect(page).toHaveURL(/\/login$/)
  const loginSurface = getVisibleLoginSurface(page)
  await expect(loginSurface.getByRole('heading', {name: 'Entrar al dashboard'})).toBeVisible()
  await expect(loginSurface.getByRole('button', {name: 'Continuar con Google'})).toBeVisible()
})

test('unknown band slugs render the custom not found state', async ({page}) => {
  await page.goto('/bandas/__slug-que-no-existe__')

  await expect(page.getByRole('heading', {name: 'Pagina no encontrada'})).toBeVisible()
  await expect(page.getByText('La pagina que buscas no existe o todavia no esta publicada.')).toBeVisible()
})

test('login shows a readable auth message from the query string', async ({page}) => {
  await page.goto('/login?message=email-not-confirmed')

  const loginSurface = getVisibleLoginSurface(page)
  await expect(loginSurface.getByRole('heading', {name: 'Entrar al dashboard'})).toBeVisible()
  await expect(loginSurface.getByText('Confirma tu email antes de iniciar sesion.')).toBeVisible()
})

test('login rate limit eventually shows a temporary block message', async ({page}) => {
  const email = `rate-limit-${Date.now()}@example.com`
  const password = 'password-incorrecto'

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    await page.goto('/login')
    const loginSurface = getVisibleLoginSurface(page)
    await loginSurface.getByLabel('Email').fill(email)
    await loginSurface.getByLabel('Password').fill(password)
    await loginSurface.getByRole('button', {name: 'Entrar'}).click()

    if (attempt < 6) {
      await expect(loginSurface.getByText('El email o el password no coinciden con una cuenta valida.')).toBeVisible()
    }
  }

  await expect(getVisibleLoginSurface(page).getByText('Demasiados intentos por ahora. Espera unos minutos antes de volver a intentar.')).toBeVisible()
})

test.describe('mobile public surfaces', () => {
  test.use({viewport: {width: 390, height: 844}})

  test('home renders the mobile directory shell', async ({page}) => {
    await page.goto('/')

    await expect(page.locator('.public-mobile-topbar')).toBeVisible()
    await expect(page.locator('.mobile-band-card').first()).toBeVisible()
  })

  test('public band pages use the mobile shell', async ({page}) => {
    await page.goto('/')
    await page.locator('.mobile-band-card a[href^="/bandas/"]').first().click()

    await expect(page.locator('.public-mobile-topbar')).toBeVisible()
    await expect(page.locator('.public-band-body')).toBeVisible()
    await expect(page.locator('.public-mobile-footer')).toBeVisible()
  })
})
