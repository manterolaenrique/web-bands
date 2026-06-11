# Procedimiento: limpieza segura de usuarios en producción

Este documento describe pasos recomendados para identificar, revisar y limpiar usuarios subidos directamente en producción.

IMPORTANTE: "limpiar todo" es destructivo. Siga los pasos de backup y dry-run antes de ejecutar cualquiera de los SQL en producción.

Pre-requisitos:
- Acceso a `SUPABASE_SERVICE_ROLE_KEY` (clave de servicio) en entorno seguro.
- Acceso al panel de Supabase o capacidad de ejecutar `psql`/`pg_dump` con credenciales de la base.

Archivos generados por la herramienta:
- `apps/web/scripts/report-prod-users.mjs` - genera `reports/prod-users.json` y `.csv` con conteos por usuario.
- `apps/web/scripts/cleanup-prod-users.mjs` - genera `reports/cleanup.sql` (DRY RUN, statements comentados) y opcionalmente `reports/cleanup.exec.sql` si se ejecuta con `--confirm=true`.

Flujo recomendado:
1. Crear backup completo de las tablas involucradas:

```bash
# Ejemplo con pg_dump (ajusta host/port/credentials)
pg_dump --schema=public --table=band_invites --table=band_memberships --table=bands --table=profiles --file=backup_tables.sql $DATABASE_URL
pg_dump --schema=auth --table=users --file=backup_auth_users.sql $DATABASE_URL
```

2. Generar reporte (staging o producción en modo lectura):

```bash
cd apps/web
SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=sk_... node scripts/report-prod-users.mjs --output=reports/prod-users.json
```

3. Revisar `reports/prod-users.json`/`.csv` para validar candidatos y detectar falsos positivos.

4. Generar SQL de limpieza en modo DRY RUN y revisarlo:

```bash
SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=sk_... node scripts/cleanup-prod-users.mjs --output=reports/cleanup.sql
# Revisar reports/cleanup.sql, quitar comentarios SOLO si está verificado.
```

5. Probar ejecutar el SQL en una copia de staging o en un snapshot de la BD. No ejecutar directamente en producción sin validación.

6. (Opcional) Para generar un SQL ejecutable (no recomendado sin backups):

```bash
SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=sk_... node scripts/cleanup-prod-users.mjs --output=reports/cleanup.sql --confirm=true
```

7. Ejecutar el SQL en producción por lotes (p.ej. 50 usuarios por transacción). Supervisar `public.audit_logs` y `public.cleanup_actions` si aplica.

Rollback:
- Si fue necesario revertir, use los dumps generados en el paso 1 y/o recree los usuarios a partir del JSON exportado por `report-prod-users`.

Notas:
- `auth.users` suele gestionarse por Supabase Auth; borrar directamente desde SQL puede ser soportado pero es más seguro usar la API de administración de Supabase.
- Siempre conservar registros de auditoría y ejecutar en ventanas de mantenimiento si hay tráfico sensible.
