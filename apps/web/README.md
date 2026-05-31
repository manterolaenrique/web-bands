# Web Bands V2

Next.js V2 app for the multi-band platform.

## Development

```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

`npm run dev` usa Webpack por defecto. En este proyecto, `next dev` con Turbopack puede disparar errores intermitentes del tipo `React Client Manifest` / `global-error.js#default` aunque la app compile y funcione bien con Webpack.

Si queres volver a probar Turbopack despues de actualizar Next.js:

```bash
npm run dev:turbo
```

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run test:e2e:strict
npm run build
```

`npm run test:e2e` prepares a fixture before launching Playwright.
Use `SUPABASE_SERVICE_ROLE_KEY` to let the setup script create the user and band automatically, or set `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`, `E2E_TEST_BAND_ID` and `E2E_TEST_BAND_SLUG` in `.env.local` to reuse an existing account.

- `npm run test:e2e`: smoke publico siempre y flujo autenticado cuando hay fixture valida.
- `npm run test:e2e:strict`: pensado para preview/CI; falla si no se puede preparar el fixture autenticado.

Si queres correr Playwright contra un preview de Vercel protegido por Vercel Authentication:

```bash
PLAYWRIGHT_BASE_URL=https://tu-preview.vercel.app \
PLAYWRIGHT_VERCEL_PROTECTION_BYPASS_TOKEN=... \
PLAYWRIGHT_VERCEL_PROTECTION_PATH=/ \
npm run test:e2e:strict
```

Un `share URL` de Vercel sigue siendo util para QA manual o para fetches protegidos via MCP:

```bash
PLAYWRIGHT_BASE_URL=https://tu-preview.vercel.app \
PLAYWRIGHT_VERCEL_SHARE_URL='https://tu-preview.vercel.app/?_vercel_share=...' \
npm run test:e2e:strict
```

Pero en browser headless puede terminar en `vercel.com/login`. Si pasa eso, usa `PLAYWRIGHT_VERCEL_PROTECTION_BYPASS_TOKEN` o desactiva temporalmente la proteccion del preview.

## Notes

- The current Vite app remains in `frontend/`.
- This app expects Supabase migrations from `supabase/migrations`.
- Sanity writes require `SANITY_API_WRITE_TOKEN` server-side only.
- Google login is configured in Supabase Auth providers and must allow `/auth/callback` for local and Vercel V2 URLs.
- Invite emails use Resend through `RESEND_API_KEY` and `EMAIL_FROM`.
- Dashboard image uploads support logo, favicon, hero and about images through server-side Sanity asset uploads.
- Si aparece un error de desarrollo con `React Client Manifest` en Next 16, usar `npm run dev` en lugar de `npm run dev:turbo`.
- El hardening de produccion y la guia operativa estan documentados en `docs/v2-production-hardening.md`.
