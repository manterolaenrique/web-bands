# V2 Preview QA - 2026-05-31

## Alcance

QA pre-release de `apps/web` sobre la V2 desplegada en Vercel (`web-bands-v2`), con foco en:

- despliegue real del estado actual del repo
- validacion automatizada local
- validacion automatizada contra URL real publica
- validacion de preview protegido por Vercel Authentication
- estado de configuracion de Resend

## Entorno validado

- Proyecto Vercel V2: `web-bands-v2`
- Dominio publico V2: `https://web-bands-v2.vercel.app`
- Preview actualizado en QA: `https://web-bands-v2-gst76onlh-manterolaenriques-projects.vercel.app`
- `NEXT_PUBLIC_SITE_URL`: confirmado apuntando a `https://web-bands-v2.vercel.app`

## Checks ejecutados

### Local

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run test:e2e:strict`

Resultado: todos verdes.

### URL real publica

Comando:

```bash
PLAYWRIGHT_BASE_URL=https://web-bands-v2.vercel.app npm run test:e2e:strict
```

Resultado: `6 passed`

Cobertura confirmada:

- home publica
- redirect guest -> login
- 404 custom para slug inexistente
- login con mensaje legible
- owner edita banda y ve reflejo en pagina publica
- invitee abre link, hace login, acepta invitacion y ve la banda en dashboard

### Preview protegido por Vercel Authentication

Hallazgo inicial:

- `PLAYWRIGHT_BASE_URL=https://<preview>` fallaba porque el preview esta protegido por Vercel Authentication.
- un `share URL` de Vercel alcanza para fetch/MCP, pero en browser headless puede redirigir igual a `vercel.com/login`

Accion aplicada:

- se agrego soporte en Playwright para sembrar cookie de acceso con:
  - `PLAYWRIGHT_VERCEL_PROTECTION_BYPASS_TOKEN`
  - `PLAYWRIGHT_VERCEL_SHARE_URL` como ayuda para QA manual / fetch protegido

Comando recomendado para E2E de previews protegidos:

```bash
PLAYWRIGHT_BASE_URL=https://tu-preview.vercel.app \
PLAYWRIGHT_VERCEL_PROTECTION_BYPASS_TOKEN=... \
PLAYWRIGHT_VERCEL_PROTECTION_PATH=/ \
npm run test:e2e:strict
```

Validacion realizada sobre el preview actualizado:

- `/_vercel_share` funcionando para fetch protegido de `home`, `login` y pagina publica de banda via Vercel MCP
- Playwright headless con share URL: redirige a `vercel.com/login`
- conclusion: para browser automation estable sobre previews protegidos hace falta bypass token o desactivar proteccion

## Estado de Resend

Variables faltantes al momento de este QA:

- `RESEND_API_KEY`
- `EMAIL_FROM`

Estado actual:

- la invitacion se crea y el flujo de aceptacion funciona
- el envio real de email sigue en modo fallback hasta completar esas env vars

## Conclusiones

- La V2 actual del repo quedo desplegada correctamente en Vercel.
- La suite automatizada esta verde localmente y contra la URL publica real.
- El mayor bloqueo operativo de preview era Vercel Authentication; ahora Playwright puede trabajar con share URL o bypass token.
- La unica parte pendiente para cerrar esta fase al 100% es configurar Resend real y verificar envio verdadero de email desde Vercel.

## Siguiente paso recomendado

1. cargar `RESEND_API_KEY` y `EMAIL_FROM` en `.env.local` y en Vercel
2. reenviar invitacion real desde dashboard
3. confirmar recepcion del email y apertura correcta de `/invite/[token]`
4. repetir `npm run test:e2e:strict` contra la URL publica o preview protegido
