drop policy if exists "bands_select_public_or_member" on public.bands;
create policy "bands_select_public_or_member"
on public.bands for select
using (
  status = 'published'
  or created_by = auth.uid()
  or public.has_band_role(id, array['owner', 'admin', 'editor', 'viewer']::public.band_member_role[])
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
