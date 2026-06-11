create type public.band_audio_track_type as enum (
  'idea',
  'riff',
  'demo',
  'ensayo',
  'pre_mezcla',
  'mezcla',
  'final',
  'referencia'
);

create type public.band_audio_track_status as enum (
  'nuevo',
  'en_revision',
  'para_ensayar',
  'aprobado',
  'descartado',
  'final'
);

create table if not exists public.band_audio_tracks (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands (id) on delete cascade,
  title text not null,
  description text,
  related_song_title text,
  storage_bucket text not null default 'band-demos',
  storage_path text not null,
  original_file_name text not null,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  track_type public.band_audio_track_type not null,
  track_status public.band_audio_track_status not null default 'nuevo',
  uploaded_by uuid not null references auth.users (id) on delete cascade,
  is_downloadable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.band_audio_playlists (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands (id) on delete cascade,
  title text not null,
  description text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.band_audio_playlist_tracks (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.band_audio_playlists (id) on delete cascade,
  track_id uuid not null references public.band_audio_tracks (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (playlist_id, track_id)
);

create index if not exists band_audio_tracks_band_id_created_at_idx
  on public.band_audio_tracks (band_id, created_at desc);

create index if not exists band_audio_tracks_uploaded_by_idx
  on public.band_audio_tracks (uploaded_by, created_at desc);

create index if not exists band_audio_playlists_band_id_created_at_idx
  on public.band_audio_playlists (band_id, created_at desc);

create index if not exists band_audio_playlist_tracks_playlist_sort_idx
  on public.band_audio_playlist_tracks (playlist_id, sort_order asc, created_at asc);

drop trigger if exists band_audio_tracks_set_updated_at on public.band_audio_tracks;
create trigger band_audio_tracks_set_updated_at
before update on public.band_audio_tracks
for each row execute function public.set_updated_at();

drop trigger if exists band_audio_playlists_set_updated_at on public.band_audio_playlists;
create trigger band_audio_playlists_set_updated_at
before update on public.band_audio_playlists
for each row execute function public.set_updated_at();

create or replace function public.has_band_audio_playlist_role(
  target_playlist_id uuid,
  allowed_roles public.band_member_role[]
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.band_audio_playlists playlist
    where playlist.id = target_playlist_id
      and public.has_band_role(playlist.band_id, allowed_roles)
  );
$$;

alter table public.band_audio_tracks enable row level security;
alter table public.band_audio_playlists enable row level security;
alter table public.band_audio_playlist_tracks enable row level security;

create policy "band_audio_tracks_select_member"
on public.band_audio_tracks
for select
to authenticated
using (
  public.has_band_role(
    band_id,
    array['owner', 'admin', 'editor', 'viewer']::public.band_member_role[]
  )
);

create policy "band_audio_tracks_insert_editor"
on public.band_audio_tracks
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and public.has_band_role(
    band_id,
    array['owner', 'admin', 'editor']::public.band_member_role[]
  )
);

create policy "band_audio_tracks_update_editor"
on public.band_audio_tracks
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

create policy "band_audio_tracks_delete_editor"
on public.band_audio_tracks
for delete
to authenticated
using (
  public.has_band_role(
    band_id,
    array['owner', 'admin', 'editor']::public.band_member_role[]
  )
);

create policy "band_audio_playlists_select_member"
on public.band_audio_playlists
for select
to authenticated
using (
  public.has_band_role(
    band_id,
    array['owner', 'admin', 'editor', 'viewer']::public.band_member_role[]
  )
);

create policy "band_audio_playlists_insert_editor"
on public.band_audio_playlists
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.has_band_role(
    band_id,
    array['owner', 'admin', 'editor']::public.band_member_role[]
  )
);

create policy "band_audio_playlists_update_editor"
on public.band_audio_playlists
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

create policy "band_audio_playlists_delete_editor"
on public.band_audio_playlists
for delete
to authenticated
using (
  public.has_band_role(
    band_id,
    array['owner', 'admin', 'editor']::public.band_member_role[]
  )
);

create policy "band_audio_playlist_tracks_select_member"
on public.band_audio_playlist_tracks
for select
to authenticated
using (
  exists (
    select 1
    from public.band_audio_playlists playlist
    join public.band_audio_tracks track
      on track.id = band_audio_playlist_tracks.track_id
     and track.band_id = playlist.band_id
    where playlist.id = band_audio_playlist_tracks.playlist_id
      and public.has_band_role(
        playlist.band_id,
        array['owner', 'admin', 'editor', 'viewer']::public.band_member_role[]
      )
  )
);

create policy "band_audio_playlist_tracks_insert_editor"
on public.band_audio_playlist_tracks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.band_audio_playlists playlist
    join public.band_audio_tracks track
      on track.id = band_audio_playlist_tracks.track_id
     and track.band_id = playlist.band_id
    where playlist.id = band_audio_playlist_tracks.playlist_id
      and public.has_band_role(
        playlist.band_id,
        array['owner', 'admin', 'editor']::public.band_member_role[]
      )
  )
);

create policy "band_audio_playlist_tracks_delete_editor"
on public.band_audio_playlist_tracks
for delete
to authenticated
using (
  exists (
    select 1
    from public.band_audio_playlists playlist
    join public.band_audio_tracks track
      on track.id = band_audio_playlist_tracks.track_id
     and track.band_id = playlist.band_id
    where playlist.id = band_audio_playlist_tracks.playlist_id
      and public.has_band_role(
        playlist.band_id,
        array['owner', 'admin', 'editor']::public.band_member_role[]
      )
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'band-demos',
  'band-demos',
  false,
  52428800,
  array[
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'audio/mp4',
    'audio/x-m4a',
    'audio/ogg'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "band_demos_storage_select_member"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'band-demos'
  and exists (
    select 1
    from public.band_memberships membership
    where membership.band_id::text = (storage.foldername(name))[1]
      and membership.user_id = auth.uid()
  )
);

create policy "band_demos_storage_insert_editor"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'band-demos'
  and exists (
    select 1
    from public.band_memberships membership
    where membership.band_id::text = (storage.foldername(name))[1]
      and membership.user_id = auth.uid()
      and membership.role = any(array['owner', 'admin', 'editor']::public.band_member_role[])
  )
);

create policy "band_demos_storage_update_editor"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'band-demos'
  and exists (
    select 1
    from public.band_memberships membership
    where membership.band_id::text = (storage.foldername(name))[1]
      and membership.user_id = auth.uid()
      and membership.role = any(array['owner', 'admin', 'editor']::public.band_member_role[])
  )
)
with check (
  bucket_id = 'band-demos'
  and exists (
    select 1
    from public.band_memberships membership
    where membership.band_id::text = (storage.foldername(name))[1]
      and membership.user_id = auth.uid()
      and membership.role = any(array['owner', 'admin', 'editor']::public.band_member_role[])
  )
);

create policy "band_demos_storage_delete_editor"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'band-demos'
  and exists (
    select 1
    from public.band_memberships membership
    where membership.band_id::text = (storage.foldername(name))[1]
      and membership.user_id = auth.uid()
      and membership.role = any(array['owner', 'admin', 'editor']::public.band_member_role[])
  )
);
