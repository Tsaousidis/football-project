begin;
alter table public.dashboard_snapshots enable row level security;
revoke all on public.dashboard_snapshots from public, anon, authenticated;
grant select, insert on public.dashboard_snapshots to authenticated;
grant all on public.dashboard_snapshots to service_role;

drop policy if exists "Read own research snapshots" on public.dashboard_snapshots;
create policy "Read own research snapshots" on public.dashboard_snapshots
  for select to authenticated using (user_id = auth.uid()::text);
drop policy if exists "Insert own research snapshots" on public.dashboard_snapshots;
create policy "Insert own research snapshots" on public.dashboard_snapshots
  for insert to authenticated with check (user_id = auth.uid()::text);

-- Keep ownership mandatory even if a project already has a broader permissive policy.
drop policy if exists "Enforce snapshot ownership" on public.dashboard_snapshots;
create policy "Enforce snapshot ownership" on public.dashboard_snapshots
  as restrictive for all to authenticated
  using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);
commit;
