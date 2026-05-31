create table if not exists public.rate_limit_buckets (
  bucket text not null,
  key_hash text not null,
  window_start timestamptz not null,
  window_seconds integer not null check (window_seconds > 0),
  hits integer not null default 0 check (hits >= 0),
  updated_at timestamptz not null default now(),
  primary key (bucket, key_hash)
);

create index if not exists rate_limit_buckets_updated_at_idx
  on public.rate_limit_buckets (updated_at desc);

create or replace function public.consume_rate_limit(
  rate_bucket text,
  rate_key_hash text,
  max_attempts integer,
  window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_window timestamptz;
  current_hits integer;
  current_reset_at timestamptz;
begin
  if max_attempts <= 0 then
    raise exception 'max_attempts must be greater than zero';
  end if;

  if window_seconds <= 0 then
    raise exception 'window_seconds must be greater than zero';
  end if;

  current_window := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / window_seconds) * window_seconds
  );
  current_reset_at := current_window + make_interval(secs => window_seconds);

  insert into public.rate_limit_buckets as bucket_row (
    bucket,
    key_hash,
    window_start,
    window_seconds,
    hits,
    updated_at
  )
  values (
    rate_bucket,
    rate_key_hash,
    current_window,
    window_seconds,
    1,
    now()
  )
  on conflict (bucket, key_hash) do update
    set window_start = case
          when bucket_row.window_start = excluded.window_start then bucket_row.window_start
          else excluded.window_start
        end,
        window_seconds = excluded.window_seconds,
        hits = case
          when bucket_row.window_start = excluded.window_start then bucket_row.hits + 1
          else 1
        end,
        updated_at = now()
  returning hits into current_hits;

  return query
  select
    current_hits <= max_attempts,
    greatest(max_attempts - current_hits, 0),
    current_reset_at,
    greatest(ceil(extract(epoch from current_reset_at - clock_timestamp())), 0)::integer;
end;
$$;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  band_id uuid references public.bands(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

create index if not exists audit_logs_actor_user_id_idx
  on public.audit_logs (actor_user_id, created_at desc);

create index if not exists audit_logs_band_id_idx
  on public.audit_logs (band_id, created_at desc);

create index if not exists audit_logs_action_idx
  on public.audit_logs (action, created_at desc);

alter table public.rate_limit_buckets enable row level security;
alter table public.audit_logs enable row level security;
