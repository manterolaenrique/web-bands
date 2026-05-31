create or replace function public.prevent_last_owner_change()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  remaining_owners integer;
begin
  if old.role <> 'owner' then
    return coalesce(new, old);
  end if;

  if tg_op = 'UPDATE' and new.role = 'owner' then
    return new;
  end if;

  select count(*)
    into remaining_owners
    from public.band_memberships membership
   where membership.band_id = old.band_id
     and membership.role = 'owner'
     and membership.user_id <> old.user_id;

  if remaining_owners = 0 then
    raise exception 'band must keep at least one owner';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists band_memberships_prevent_last_owner_change on public.band_memberships;
create trigger band_memberships_prevent_last_owner_change
before update or delete on public.band_memberships
for each row
execute function public.prevent_last_owner_change();

drop policy if exists "invites_delete_managers" on public.band_invites;
create policy "invites_delete_managers"
on public.band_invites for delete
to authenticated
using (public.has_band_role(band_id, array['owner', 'admin']::public.band_member_role[]));

create index if not exists band_invites_email_lower_idx on public.band_invites (lower(email));
