create table if not exists public.band_song_library (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands (id) on delete cascade,
  title text not null,
  default_notes text null,
  default_duration_seconds integer null check (default_duration_seconds is null or default_duration_seconds > 0),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists band_song_library_band_id_title_idx
  on public.band_song_library (band_id, lower(title));

drop trigger if exists band_song_library_set_updated_at on public.band_song_library;
create trigger band_song_library_set_updated_at
before update on public.band_song_library
for each row execute function public.set_updated_at();

alter table public.band_song_library enable row level security;

create policy "band_song_library_select_editor"
on public.band_song_library
for select
to authenticated
using (
  public.has_band_role(
    band_id,
    array['owner', 'admin', 'editor']::public.band_member_role[]
  )
);

create policy "band_song_library_insert_editor"
on public.band_song_library
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.has_band_role(
    band_id,
    array['owner', 'admin', 'editor']::public.band_member_role[]
  )
);

create policy "band_song_library_update_editor"
on public.band_song_library
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

create policy "band_song_library_delete_editor"
on public.band_song_library
for delete
to authenticated
using (
  public.has_band_role(
    band_id,
    array['owner', 'admin', 'editor']::public.band_member_role[]
  )
);

create table if not exists public.band_setlists (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands (id) on delete cascade,
  title text null,
  show_date date not null,
  venue_name text not null,
  location text null,
  press_logo_asset_id uuid null references public.band_private_assets (id) on delete set null,
  linked_show_key text null,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists band_setlists_band_id_show_date_idx
  on public.band_setlists (band_id, show_date desc, updated_at desc);

drop trigger if exists band_setlists_set_updated_at on public.band_setlists;
create trigger band_setlists_set_updated_at
before update on public.band_setlists
for each row execute function public.set_updated_at();

alter table public.band_setlists enable row level security;

create policy "band_setlists_select_editor"
on public.band_setlists
for select
to authenticated
using (
  public.has_band_role(
    band_id,
    array['owner', 'admin', 'editor']::public.band_member_role[]
  )
);

create policy "band_setlists_insert_editor"
on public.band_setlists
for insert
to authenticated
with check (
  created_by = auth.uid()
  and updated_by = auth.uid()
  and public.has_band_role(
    band_id,
    array['owner', 'admin', 'editor']::public.band_member_role[]
  )
);

create policy "band_setlists_update_editor"
on public.band_setlists
for update
to authenticated
using (
  public.has_band_role(
    band_id,
    array['owner', 'admin', 'editor']::public.band_member_role[]
  )
)
with check (
  updated_by = auth.uid()
  and public.has_band_role(
    band_id,
    array['owner', 'admin', 'editor']::public.band_member_role[]
  )
);

create policy "band_setlists_delete_editor"
on public.band_setlists
for delete
to authenticated
using (
  public.has_band_role(
    band_id,
    array['owner', 'admin', 'editor']::public.band_member_role[]
  )
);

create table if not exists public.band_setlist_items (
  id uuid primary key default gen_random_uuid(),
  setlist_id uuid not null references public.band_setlists (id) on delete cascade,
  sort_order integer not null check (sort_order > 0),
  item_type text not null check (item_type in ('song', 'block')),
  song_id uuid null references public.band_song_library (id) on delete set null,
  song_title_snapshot text null,
  block_label text null,
  notes_override text null,
  created_at timestamptz not null default now(),
  constraint band_setlist_items_song_shape check (
    (
      item_type = 'song'
      and song_title_snapshot is not null
      and block_label is null
    )
    or (
      item_type = 'block'
      and block_label is not null
      and song_id is null
      and song_title_snapshot is null
    )
  )
);

create index if not exists band_setlist_items_setlist_id_sort_order_idx
  on public.band_setlist_items (setlist_id, sort_order asc, created_at asc);

alter table public.band_setlist_items enable row level security;

create policy "band_setlist_items_select_editor"
on public.band_setlist_items
for select
to authenticated
using (
  exists (
    select 1
    from public.band_setlists setlist
    where setlist.id = band_setlist_items.setlist_id
      and public.has_band_role(
        setlist.band_id,
        array['owner', 'admin', 'editor']::public.band_member_role[]
      )
  )
);

create policy "band_setlist_items_insert_editor"
on public.band_setlist_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.band_setlists setlist
    where setlist.id = band_setlist_items.setlist_id
      and public.has_band_role(
        setlist.band_id,
        array['owner', 'admin', 'editor']::public.band_member_role[]
      )
  )
);

create policy "band_setlist_items_update_editor"
on public.band_setlist_items
for update
to authenticated
using (
  exists (
    select 1
    from public.band_setlists setlist
    where setlist.id = band_setlist_items.setlist_id
      and public.has_band_role(
        setlist.band_id,
        array['owner', 'admin', 'editor']::public.band_member_role[]
      )
  )
)
with check (
  exists (
    select 1
    from public.band_setlists setlist
    where setlist.id = band_setlist_items.setlist_id
      and public.has_band_role(
        setlist.band_id,
        array['owner', 'admin', 'editor']::public.band_member_role[]
      )
  )
);

create policy "band_setlist_items_delete_editor"
on public.band_setlist_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.band_setlists setlist
    where setlist.id = band_setlist_items.setlist_id
      and public.has_band_role(
        setlist.band_id,
        array['owner', 'admin', 'editor']::public.band_member_role[]
      )
  )
);
