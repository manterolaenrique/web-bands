alter table public.band_audio_playlists
  add column if not exists system_key text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'band_audio_playlists_system_key_check'
  ) then
    alter table public.band_audio_playlists
      add constraint band_audio_playlists_system_key_check
      check (system_key is null or system_key = 'general');
  end if;
end
$$;

create unique index if not exists band_audio_playlists_band_id_system_key_idx
  on public.band_audio_playlists (band_id, system_key)
  where system_key is not null;
