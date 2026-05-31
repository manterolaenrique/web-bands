create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'band_status') then
    create type public.band_status as enum ('draft', 'published', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'band_member_role') then
    create type public.band_member_role as enum ('owner', 'admin', 'editor', 'viewer');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 120),
  sanity_document_id text unique,
  status public.band_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.band_memberships (
  band_id uuid not null references public.bands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.band_member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (band_id, user_id)
);

create table if not exists public.band_invites (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands(id) on delete cascade,
  email text not null,
  role public.band_member_role not null default 'editor',
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  accepted_at timestamptz,
  expires_at timestamptz not null default now() + interval '7 days',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists bands_set_updated_at on public.bands;
create trigger bands_set_updated_at
before update on public.bands
for each row execute function public.set_updated_at();

drop trigger if exists band_memberships_set_updated_at on public.band_memberships;
create trigger band_memberships_set_updated_at
before update on public.band_memberships
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.profiles.display_name, excluded.display_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.has_band_role(
  target_band_id uuid,
  allowed_roles public.band_member_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.band_memberships membership
    where membership.band_id = target_band_id
      and membership.user_id = auth.uid()
      and membership.role = any(allowed_roles)
  );
$$;

alter table public.profiles enable row level security;
alter table public.bands enable row level security;
alter table public.band_memberships enable row level security;
alter table public.band_invites enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "bands_select_public_or_member" on public.bands;
create policy "bands_select_public_or_member"
on public.bands for select
using (
  status = 'published'
  or created_by = auth.uid()
  or public.has_band_role(id, array['owner', 'admin', 'editor', 'viewer']::public.band_member_role[])
);

drop policy if exists "bands_insert_creator" on public.bands;
create policy "bands_insert_creator"
on public.bands for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "bands_update_editors" on public.bands;
create policy "bands_update_editors"
on public.bands for update
to authenticated
using (public.has_band_role(id, array['owner', 'admin', 'editor']::public.band_member_role[]))
with check (public.has_band_role(id, array['owner', 'admin', 'editor']::public.band_member_role[]));

drop policy if exists "bands_delete_owners" on public.bands;
create policy "bands_delete_owners"
on public.bands for delete
to authenticated
using (public.has_band_role(id, array['owner']::public.band_member_role[]));

drop policy if exists "memberships_select_self_or_manager" on public.band_memberships;
create policy "memberships_select_self_or_manager"
on public.band_memberships for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_band_role(band_id, array['owner', 'admin']::public.band_member_role[])
);

drop policy if exists "memberships_insert_manager_or_creator_owner" on public.band_memberships;
create policy "memberships_insert_manager_or_creator_owner"
on public.band_memberships for insert
to authenticated
with check (
  public.has_band_role(band_id, array['owner', 'admin']::public.band_member_role[])
  or (
    user_id = auth.uid()
    and role = 'owner'
    and exists (
      select 1
      from public.bands band
      where band.id = public.band_memberships.band_id
        and band.created_by = auth.uid()
    )
  )
);

drop policy if exists "memberships_update_managers" on public.band_memberships;
create policy "memberships_update_managers"
on public.band_memberships for update
to authenticated
using (public.has_band_role(band_id, array['owner', 'admin']::public.band_member_role[]))
with check (public.has_band_role(band_id, array['owner', 'admin']::public.band_member_role[]));

drop policy if exists "memberships_delete_managers" on public.band_memberships;
create policy "memberships_delete_managers"
on public.band_memberships for delete
to authenticated
using (public.has_band_role(band_id, array['owner', 'admin']::public.band_member_role[]));

drop policy if exists "invites_select_managers" on public.band_invites;
create policy "invites_select_managers"
on public.band_invites for select
to authenticated
using (public.has_band_role(band_id, array['owner', 'admin']::public.band_member_role[]));

drop policy if exists "invites_insert_managers" on public.band_invites;
create policy "invites_insert_managers"
on public.band_invites for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.has_band_role(band_id, array['owner', 'admin']::public.band_member_role[])
);

drop policy if exists "invites_update_managers" on public.band_invites;
create policy "invites_update_managers"
on public.band_invites for update
to authenticated
using (public.has_band_role(band_id, array['owner', 'admin']::public.band_member_role[]))
with check (public.has_band_role(band_id, array['owner', 'admin']::public.band_member_role[]));

create index if not exists bands_slug_idx on public.bands(slug);
create index if not exists band_memberships_user_id_idx on public.band_memberships(user_id);
create index if not exists band_memberships_band_id_idx on public.band_memberships(band_id);
create index if not exists band_invites_band_id_idx on public.band_invites(band_id);
