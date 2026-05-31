-- Replace the UUIDs below with real values from auth.users and your Sanity document.
-- Run only after applying migrations and creating/confirming the user in Supabase Auth.

with new_band as (
  insert into public.bands (id, slug, name, sanity_document_id, status, created_by)
  values (
    '00000000-0000-0000-0000-000000000001',
    'demo-band',
    'Demo Band',
    'banda.00000000-0000-0000-0000-000000000001',
    'draft',
    '00000000-0000-0000-0000-000000000000'
  )
  on conflict (id) do update
    set slug = excluded.slug,
        name = excluded.name,
        sanity_document_id = excluded.sanity_document_id,
        status = excluded.status
  returning id
)
insert into public.band_memberships (band_id, user_id, role)
select id, '00000000-0000-0000-0000-000000000000', 'owner'
from new_band
on conflict (band_id, user_id) do update
  set role = excluded.role;
