create table if not exists public.band_private_assets (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands (id) on delete cascade,
  kind text not null check (kind in ('logo')),
  label text not null,
  storage_bucket text not null default 'band-press-assets',
  storage_path text not null unique,
  original_file_name text not null,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0),
  uploaded_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists band_private_assets_band_id_created_at_idx
  on public.band_private_assets (band_id, created_at desc);

create index if not exists band_private_assets_uploaded_by_idx
  on public.band_private_assets (uploaded_by, created_at desc);

drop trigger if exists band_private_assets_set_updated_at on public.band_private_assets;
create trigger band_private_assets_set_updated_at
before update on public.band_private_assets
for each row execute function public.set_updated_at();

alter table public.band_private_assets enable row level security;

create policy "band_private_assets_select_editor"
on public.band_private_assets
for select
to authenticated
using (
  public.has_band_role(
    band_id,
    array['owner', 'admin', 'editor']::public.band_member_role[]
  )
);

create policy "band_private_assets_insert_editor"
on public.band_private_assets
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and public.has_band_role(
    band_id,
    array['owner', 'admin', 'editor']::public.band_member_role[]
  )
);

create policy "band_private_assets_update_editor"
on public.band_private_assets
for update
to authenticated
using (
  public.has_band_role(
    band_id,
    array['owner', 'admin', 'editor']::public.band_member_role[]
  )
)
with check (
  public.has_band_role(
    band_id,
    array['owner', 'admin', 'editor']::public.band_member_role[]
  )
);

create policy "band_private_assets_delete_editor"
on public.band_private_assets
for delete
to authenticated
using (
  public.has_band_role(
    band_id,
    array['owner', 'admin', 'editor']::public.band_member_role[]
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'band-press-assets',
  'band-press-assets',
  false,
  5242880,
  array['image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "band_press_assets_storage_select_editor"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'band-press-assets'
  and exists (
    select 1
    from public.band_memberships membership
    where membership.band_id::text = (storage.foldername(name))[1]
      and membership.user_id = auth.uid()
      and membership.role = any(array['owner', 'admin', 'editor']::public.band_member_role[])
  )
);

create policy "band_press_assets_storage_insert_editor"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'band-press-assets'
  and exists (
    select 1
    from public.band_memberships membership
    where membership.band_id::text = (storage.foldername(name))[1]
      and membership.user_id = auth.uid()
      and membership.role = any(array['owner', 'admin', 'editor']::public.band_member_role[])
  )
);

create policy "band_press_assets_storage_update_editor"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'band-press-assets'
  and exists (
    select 1
    from public.band_memberships membership
    where membership.band_id::text = (storage.foldername(name))[1]
      and membership.user_id = auth.uid()
      and membership.role = any(array['owner', 'admin', 'editor']::public.band_member_role[])
  )
)
with check (
  bucket_id = 'band-press-assets'
  and exists (
    select 1
    from public.band_memberships membership
    where membership.band_id::text = (storage.foldername(name))[1]
      and membership.user_id = auth.uid()
      and membership.role = any(array['owner', 'admin', 'editor']::public.band_member_role[])
  )
);

create policy "band_press_assets_storage_delete_editor"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'band-press-assets'
  and exists (
    select 1
    from public.band_memberships membership
    where membership.band_id::text = (storage.foldername(name))[1]
      and membership.user_id = auth.uid()
      and membership.role = any(array['owner', 'admin', 'editor']::public.band_member_role[])
  )
);
