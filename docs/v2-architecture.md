# Web Bands V2 Architecture

## Summary

The V2 is implemented as a parallel Next.js application in `apps/web`. The current Vite app in
`frontend/` remains untouched so production can keep serving the V1 while the V2 is tested in a
separate Vercel project or preview deployment.

The V2 splits responsibilities:

- Next.js renders public pages, protected dashboard screens and Route Handlers.
- Supabase Auth owns identity.
- Supabase Postgres owns private tenancy metadata and permissions.
- Sanity remains the CMS for public band content.
- Server-side API routes write to Sanity with `SANITY_API_WRITE_TOKEN`.

## Implemented Routes

- `/`: public directory of published bands from Sanity.
- `/bandas/[slug]`: public band page.
- `/banda/[slug]`: permanent redirect to `/bandas/[slug]` for V1 URL compatibility.
- `/login`: Supabase email/password sign in and sign up.
- `/auth/callback`: Supabase email confirmation callback.
- `/dashboard`: protected list of bands assigned to the signed-in user.
- `/dashboard/bands/[bandId]`: protected editor for core band information.
- `/invite/[token]`: landing segura para invitaciones por email con login y aceptacion explicita.
- `/api/bands/[bandId]`: authenticated PATCH endpoint that validates membership, writes Sanity and updates Supabase metadata.
- `/api/bands/[bandId]/assets`: authenticated image upload endpoint for logo, favicon, hero and about images.
- `/studio`: internal admin placeholder that links to the existing Sanity Studio.

## Supabase Model

Migration: `supabase/migrations/20260524144500_v2_auth_dashboard.sql`

Tables:

- `profiles`: one row per `auth.users` user.
- `bands`: private tenant metadata, public slug and Sanity document mapping.
- `band_memberships`: user-to-band role assignments.
- `band_invites`: invitaciones por email y aceptacion segura por token.

Roles:

- `owner`: full control.
- `admin`: manage members and edit content.
- `editor`: edit content.
- `viewer`: read-only dashboard access.

RLS is enabled on every table. The helper `public.has_band_role()` is security-definer to avoid
recursive membership policies while still keeping permissions centralized.

## Sanity Model

The existing `banda` document keeps all current content fields. The V2 adds only metadata fields:

- `bandId`
- `status`
- `visibility`
- `updatedBy`
- `lastSyncedAt`

The public V2 queries only return documents where:

```groq
coalesce(status, "published") == "published" &&
coalesce(visibility, "public") == "public"
```

This keeps existing V1 documents visible by default while allowing future draft/private control.

## Environment Variables

Create `apps/web/.env.local` from `apps/web/.env.example`.

Public:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `NEXT_PUBLIC_SANITY_API_VERSION`

Server-only:

- `SANITY_API_WRITE_TOKEN`
- `SANITY_API_READ_TOKEN`
- `REVALIDATION_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SECRET_KEY` as a local backward-compatible alias only

Never expose server-only values with a `NEXT_PUBLIC_` prefix.

## Deployment Strategy

Keep the existing Vercel project pointing at `frontend/` until V2 acceptance tests pass.

Recommended V2 preview setup:

1. Create a second Vercel project from the same repository.
2. Set Root Directory to `apps/web`.
3. Add the V2 environment variables.
4. Deploy previews from `feature/v2-auth-dashboard`.
5. Enable `E2E_REQUIRE_AUTH=true` in the preview/CI environment so authenticated Playwright stops being optional.
6. Promote `apps/web` to production only after validating public pages, auth, RLS and Sanity writes.

Rollback is simple because V1 remains in `frontend/`.

## Acceptance Checklist

- Public directory loads published Sanity bands.
- `/banda/[slug]` redirects to `/bandas/[slug]`.
- Login and signup work with Supabase Auth.
- A user without membership cannot access/edit another band.
- Owner/admin/editor can update their band through `/api/bands/[bandId]`.
- Sanity write token is never present in browser bundles.
- Vercel preview builds from `apps/web`.
- Preview or CI runs `npm run test:e2e:strict` with a valid authenticated fixture setup.

## Dashboard Image Uploads

The dashboard uploads images through a server Route Handler, never directly from the browser to
Sanity with a token.

Supported fields:

- `logo`
- `logoFavicon`
- `heroImage`
- `aboutImage`

Validation:

- Only `image/jpeg`, `image/png` and `image/webp`.
- Maximum size: 5MB.
- Requires `owner`, `admin` or `editor` membership.
- Creates the Sanity document on first upload if it does not already exist.
