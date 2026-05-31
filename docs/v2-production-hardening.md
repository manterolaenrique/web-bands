# V2 Production Hardening - 2026-05-31

## Alcance

Esta fase endurece `apps/web` sin agregar proveedores extra. El foco queda en:

- rate limiting server-side con Supabase/Postgres
- auditoria minima de acciones sensibles
- headers de seguridad y CSP en modo report-only
- observabilidad basica para diagnostico e incident response

La V1 en `frontend/` no se toca.

## Cambios implementados

### Rate limiting

Se agrego la migracion `20260531201627_v2_production_hardening.sql` con:

- tabla `public.rate_limit_buckets`
- funcion `public.consume_rate_limit(...)`

Politicas activas en la app:

- `auth.login`: 5 intentos / 300 segundos
- `bands.update`: 20 escrituras / 300 segundos
- `bands.asset_upload`: 10 uploads / 300 segundos
- `bands.team_actions`: 20 acciones / 300 segundos

Claves usadas:

- login: `ip + email normalizado`
- edicion / upload: `user_id + band_id`
- invitaciones / miembros: `user_id + band_id`

Comportamiento:

- login: redirige a `/login?message=login-rate-limited`
- API de banda y uploads: responde `429` y setea `Retry-After`
- acciones de equipo: redirigen con `message=team-action-rate-limited`

### Auditoria

Se agrego la tabla `public.audit_logs` con soporte para:

- `auth.login.failed`
- `auth.login.succeeded`
- `band.updated`
- `band.asset_uploaded`
- `band.invite.created`
- `band.invite.updated`
- `band.invite.revoked`
- `band.invite.accepted`
- `band.member.role_updated`
- `band.member.removed`

Campos principales:

- `actor_user_id`
- `band_id`
- `action`
- `target_type`
- `target_id`
- `metadata`
- `ip_hash`
- `user_agent`
- `created_at`

La IP no se guarda en claro; se hashea antes de persistir.

### Seguridad HTTP

Headers globales activos:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security` solo en produccion
- `Content-Security-Policy-Report-Only`

La CSP queda en report-only para observar antes de endurecer en modo enforce.

### Observabilidad

La app ahora emite logs estructurados para:

- bloqueos por rate limit
- errores de auditoria
- errores de escritura/patch
- reportes CSP

Endpoint de reportes CSP:

- `POST /api/security/csp-report`

## Donde mirar cuando algo falla

### Vercel

1. Abrir el proyecto `web-bands-v2`
2. Entrar al deployment afectado
3. Revisar:
   - Runtime Logs
   - Functions
   - Request details

Eventos utiles para filtrar:

- `rate_limit.blocked`
- `rate_limit.consume_failed`
- `audit.write_failed`
- `security.csp_report`
- `band.*`
- `auth.*`

### Supabase

1. Abrir el proyecto de V2
2. Revisar:
   - Logs de Auth
   - Logs de API / Database
   - Query editor sobre `audit_logs` y `rate_limit_buckets`

Consultas utiles:

```sql
select created_at, action, actor_user_id, band_id, target_type, target_id, metadata
from public.audit_logs
order by created_at desc
limit 100;
```

```sql
select bucket, key_hash, hits, window_start, window_seconds, updated_at
from public.rate_limit_buckets
order by updated_at desc
limit 100;
```

## Incident response rapido

### Pico de login fallido

Sintomas:

- muchos `auth.login.failed`
- aparicion frecuente de `login-rate-limited`

Pasos:

1. revisar Runtime Logs en Vercel para `rate_limit.blocked`
2. revisar `audit_logs` filtrando `auth.login.failed`
3. confirmar si el trafico viene concentrado en pocos `ip_hash`
4. si persiste, subir temporalmente la proteccion en Vercel o endurecer auth flows

### Abuso de uploads

Sintomas:

- `429` en `/api/bands/[bandId]/assets`
- volumen alto de `band.asset_uploaded`

Pasos:

1. revisar Runtime Logs con `bands.assets.upload`
2. consultar `audit_logs` por `band.asset_uploaded`
3. revisar `rate_limit_buckets` para `bands.asset_upload`
4. si hace falta, bajar temporalmente el umbral de uploads o ampliar validaciones

### Intentos cross-band o acciones sospechosas

Sintomas:

- `403` repetidos en rutas privadas
- errores de permisos en dashboard/API

Pasos:

1. revisar Runtime Logs por acciones `band.*`
2. cruzar con `audit_logs` del `actor_user_id`
3. confirmar membership/rol en `band_memberships`
4. si hay patron anomalo, revocar acceso o bajar rol desde dashboard / SQL admin

## Estado despues de aplicar la migracion

- la base remota ya reconoce `consume_rate_limit`
- la tabla `audit_logs` ya existe
- `npm run test:e2e:strict` debe ejecutarse sin errores de `rate_limit.consume_failed`
- Resend real sigue fuera de esta fase

## Siguiente paso recomendado

Con este hardening listo, el siguiente bloque natural es:

1. configurar Resend real
2. validar el flujo completo `owner -> email -> invitee -> accept`
3. decidir si la V2 queda lista para cutover controlado o requiere una tanda extra de UX
