alter table public.band_private_assets
  drop constraint if exists band_private_assets_kind_check;

alter table public.band_private_assets
  add constraint band_private_assets_kind_check
  check (kind in ('logo', 'technical_rider'));

create unique index if not exists band_private_assets_one_technical_rider_per_band_idx
  on public.band_private_assets (band_id)
  where kind = 'technical_rider';

update storage.buckets
set
  file_size_limit = 26214400,
  allowed_mime_types = array['image/png', 'application/pdf']
where id = 'band-press-assets';

create or replace function public.insert_band_setlist_item_at(
  p_setlist_id uuid,
  p_item_type text,
  p_song_id uuid default null,
  p_block_label text default null,
  p_notes_override text default null,
  p_insert_index integer default null
)
returns public.band_setlist_items
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_setlist public.band_setlists%rowtype;
  v_song public.band_song_library%rowtype;
  v_item public.band_setlist_items%rowtype;
  v_item_count integer;
  v_insert_order integer;
begin
  select *
  into v_setlist
  from public.band_setlists
  where id = p_setlist_id
  for update;

  if not found then
    raise exception 'Setlist not found.' using errcode = 'P0002';
  end if;

  select count(*)::integer
  into v_item_count
  from public.band_setlist_items
  where setlist_id = p_setlist_id;

  v_insert_order := least(greatest(coalesce(p_insert_index, v_item_count), 0), v_item_count) + 1;

  if p_item_type = 'song' then
    select *
    into v_song
    from public.band_song_library
    where id = p_song_id
      and band_id = v_setlist.band_id;

    if not found then
      raise exception 'Song not found in the band library.' using errcode = 'P0002';
    end if;
  elsif p_item_type = 'block' then
    if nullif(btrim(coalesce(p_block_label, '')), '') is null then
      raise exception 'Block label is required.' using errcode = '22023';
    end if;
  else
    raise exception 'Invalid setlist item type.' using errcode = '22023';
  end if;

  update public.band_setlist_items
  set sort_order = sort_order + 1
  where setlist_id = p_setlist_id
    and sort_order >= v_insert_order;

  insert into public.band_setlist_items (
    id,
    setlist_id,
    sort_order,
    item_type,
    song_id,
    song_title_snapshot,
    block_label,
    notes_override
  )
  values (
    gen_random_uuid(),
    p_setlist_id,
    v_insert_order,
    p_item_type,
    case when p_item_type = 'song' then v_song.id else null end,
    case when p_item_type = 'song' then v_song.title else null end,
    case when p_item_type = 'block' then btrim(p_block_label) else null end,
    case
      when p_notes_override is not null then nullif(btrim(p_notes_override), '')
      when p_item_type = 'song' then v_song.default_notes
      else null
    end
  )
  returning * into v_item;

  return v_item;
end;
$$;

create or replace function public.reorder_band_setlist_items(
  p_setlist_id uuid,
  p_ordered_item_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_current_count integer;
  v_incoming_count integer;
  v_distinct_count integer;
begin
  perform 1
  from public.band_setlists
  where id = p_setlist_id
  for update;

  if not found then
    raise exception 'Setlist not found.' using errcode = 'P0002';
  end if;

  select count(*)::integer
  into v_current_count
  from public.band_setlist_items
  where setlist_id = p_setlist_id;

  select count(*)::integer, count(distinct item_id)::integer
  into v_incoming_count, v_distinct_count
  from unnest(p_ordered_item_ids) as incoming(item_id);

  if v_current_count <> v_incoming_count or v_incoming_count <> v_distinct_count then
    raise exception 'Setlist order payload does not match current items.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(p_ordered_item_ids) as incoming(item_id)
    left join public.band_setlist_items current
      on current.id = incoming.item_id
      and current.setlist_id = p_setlist_id
    where current.id is null
  ) then
    raise exception 'Setlist order payload does not match current items.' using errcode = '22023';
  end if;

  update public.band_setlist_items item
  set sort_order = desired.position::integer
  from unnest(p_ordered_item_ids) with ordinality as desired(item_id, position)
  where item.setlist_id = p_setlist_id
    and item.id = desired.item_id;
end;
$$;

revoke all on function public.insert_band_setlist_item_at(uuid, text, uuid, text, text, integer) from public;
grant execute on function public.insert_band_setlist_item_at(uuid, text, uuid, text, text, integer) to authenticated;

revoke all on function public.reorder_band_setlist_items(uuid, uuid[]) from public;
grant execute on function public.reorder_band_setlist_items(uuid, uuid[]) to authenticated;
