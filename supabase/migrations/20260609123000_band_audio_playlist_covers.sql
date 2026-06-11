alter table public.band_audio_playlists
  add column if not exists cover_storage_bucket text,
  add column if not exists cover_storage_path text,
  add column if not exists cover_original_file_name text;
