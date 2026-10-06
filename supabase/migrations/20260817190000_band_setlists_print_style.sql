alter table public.band_setlists
  add column if not exists print_font_preset text not null default 'modern'
    check (print_font_preset in ('modern', 'stage', 'editorial')),
  add column if not exists print_all_caps boolean not null default false;
