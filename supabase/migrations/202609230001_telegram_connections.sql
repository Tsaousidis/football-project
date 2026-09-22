begin;
create table if not exists public.telegram_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  chat_id text unique,
  connected_at timestamptz,
  link_token_hash text unique,
  link_expires_at timestamptz,
  last_test_at timestamptz
);
alter table public.telegram_connections enable row level security;
revoke all on public.telegram_connections from public, anon, authenticated;
grant select (user_id, chat_id, connected_at) on public.telegram_connections to authenticated;
grant all on public.telegram_connections to service_role;
drop policy if exists "Read own Telegram connection" on public.telegram_connections;
create policy "Read own Telegram connection" on public.telegram_connections
  for select to authenticated using (auth.uid() = user_id);

-- Only the authenticated Telegram webhook, using the server service role, can claim links.
create or replace function public.claim_telegram_link(token_hash text, private_chat_id text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare claimed uuid;
begin
  if private_chat_id is null or private_chat_id !~ '^[1-9][0-9]*$' or token_hash is null then return false; end if;
  update public.telegram_connections
    set chat_id = private_chat_id, connected_at = now(), link_token_hash = null,
        link_expires_at = null, last_test_at = null
    where link_token_hash = token_hash and link_expires_at > now() and chat_id is null
    returning user_id into claimed;
  return claimed is not null;
exception when unique_violation then
  -- A Telegram chat cannot silently move from another application account.
  return false;
end;
$$;
revoke all on function public.claim_telegram_link(text, text) from public, anon, authenticated;
grant execute on function public.claim_telegram_link(text, text) to service_role;
commit;
