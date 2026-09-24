-- Enable pg_cron, pg_net and Vault in Supabase before applying.
begin;
alter table public.schedule_settings add column if not exists last_attempt_at timestamptz;

create or replace function public.dispatch_football_schedule(target_user text)
returns void language plpgsql security definer set search_path = '' as $$
declare config public.schedule_settings; local_now timestamp; app_url text; secret text;
begin
  select * into config from public.schedule_settings where user_id = target_user and enabled;
  if not found then return; end if;
  local_now := now() at time zone config.timezone;
  if local_now::time < config.run_time
     or (config.frequency = 'weekly' and extract(dow from local_now)::int <> config.day_of_week)
     or (config.last_run_at at time zone config.timezone)::date = local_now::date
     or config.last_attempt_at > now() - interval '10 minutes' then return; end if;
  select decrypted_secret into app_url from vault.decrypted_secrets where name = 'football_app_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'football_cron_secret';
  if app_url is null or secret is null then raise exception 'Scheduler configuration missing'; end if;
  perform net.http_get(url := rtrim(app_url, '/') || '/api/cron/research',
    params := jsonb_build_object('user_id', target_user),
    headers := jsonb_build_object('Authorization', 'Bearer ' || secret), timeout_milliseconds := 180000);
end;
$$;
revoke all on function public.dispatch_football_schedule(text) from public, anon, authenticated;

create or replace function public.sync_football_schedule()
returns trigger language plpgsql security definer set search_path = '' as $$
declare job_name text; existing bigint; app_url text; secret text;
begin
  job_name := 'football-user-' || coalesce(new.user_id, old.user_id);
  select jobid into existing from cron.job where jobname = job_name;
  if existing is not null then perform cron.unschedule(existing); end if;
  if tg_op <> 'DELETE' and new.enabled then
    select decrypted_secret into app_url from vault.decrypted_secrets where name = 'football_app_url';
    select decrypted_secret into secret from vault.decrypted_secrets where name = 'football_cron_secret';
    if app_url is null or app_url !~ '^https://' or secret is null or length(secret) < 32 then
      raise exception 'Configure football scheduler Vault secrets before enabling';
    end if;
    perform cron.schedule(job_name, '*/15 * * * *',
      format('select public.dispatch_football_schedule(%L)', new.user_id));
  end if;
  return coalesce(new, old);
end;
$$;
revoke all on function public.sync_football_schedule() from public, anon, authenticated;
drop trigger if exists sync_football_schedule on public.schedule_settings;
create trigger sync_football_schedule after insert or update of enabled, frequency, day_of_week, run_time, timezone or delete
  on public.schedule_settings for each row execute function public.sync_football_schedule();

-- Fresh opt-in: preferences from the former manual-only implementation must not activate jobs.
update public.schedule_settings set enabled = false where enabled;

create or replace function public.save_football_schedule(p_enabled boolean, p_frequency text, p_day integer, p_time time, p_timezone text)
returns setof public.schedule_settings language plpgsql security definer set search_path = '' as $$
declare uid text := auth.uid()::text;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if p_enabled is null or p_frequency is null or p_frequency not in ('daily', 'weekly')
    or p_day is null or p_day not between 0 and 6 or p_time is null or p_time >= time '24:00'
    or p_timezone is null or not exists (select 1 from pg_timezone_names where name = p_timezone) then
    raise exception 'Invalid schedule';
  end if;
  return query insert into public.schedule_settings(user_id, enabled, frequency, day_of_week, run_time, timezone, updated_at)
    values(uid, p_enabled, p_frequency, p_day, p_time, p_timezone, now())
    on conflict (user_id) do update set enabled = excluded.enabled, frequency = excluded.frequency,
      day_of_week = excluded.day_of_week, run_time = excluded.run_time, timezone = excluded.timezone, updated_at = now()
    returning *;
end;
$$;
revoke all on function public.save_football_schedule(boolean, text, integer, time, text) from public, anon;
grant execute on function public.save_football_schedule(boolean, text, integer, time, text) to authenticated;
revoke insert, update, delete on public.schedule_settings from public, anon, authenticated;

create or replace function public.claim_football_schedule(target_user text)
returns setof public.schedule_settings language plpgsql security definer set search_path = '' as $$
declare config public.schedule_settings; local_now timestamp;
begin
  select * into config from public.schedule_settings where user_id = target_user for update;
  if not found or not config.enabled then return; end if;
  local_now := now() at time zone config.timezone;
  if local_now::time < config.run_time
     or (config.frequency = 'weekly' and extract(dow from local_now)::int <> config.day_of_week)
     or (config.last_run_at at time zone config.timezone)::date = local_now::date
     or config.last_attempt_at > now() - interval '10 minutes' then return; end if;
  return query update public.schedule_settings set last_attempt_at = now() where user_id = target_user returning *;
end;
$$;
revoke all on function public.claim_football_schedule(text) from public, anon, authenticated;
grant execute on function public.claim_football_schedule(text) to service_role;

create or replace function public.finish_football_schedule(target_user text, attempt_at timestamptz, snapshot_data jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.schedule_settings where user_id = target_user and last_attempt_at = attempt_at for update;
  if not found then return false; end if;
  insert into public.dashboard_snapshots(user_id, generated_at, data)
    values(target_user, (snapshot_data->>'generatedAt')::timestamptz, snapshot_data);
  update public.schedule_settings set last_run_at = attempt_at, last_attempt_at = null where user_id = target_user;
  return true;
end;
$$;
revoke all on function public.finish_football_schedule(text, timestamptz, jsonb) from public, anon, authenticated;
grant execute on function public.finish_football_schedule(text, timestamptz, jsonb) to service_role;
commit;
