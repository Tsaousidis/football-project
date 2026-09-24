# Profile-controlled automatic research

## Behaviour

Enable schedule and save in Profile creates one Supabase Cron job for your account.
Disable and save removes that job. Disabled accounts have no recurring application
checks or HTTP requests. The shared Supabase database scheduler itself remains running.
There is no recurring GitHub Actions trigger.

While enabled, the job checks every 15 minutes inside PostgreSQL. Only a due
schedule sends a request to the application. Time and weekday follow the selected
IANA timezone, including daylight saving time. This is not an exact-time service;
an enabled weekly schedule missed for the whole selected day waits until next week.

The endpoint rechecks enabled/time/date while atomically claiming an attempt. A
10-minute lease prevents overlapping scheduled runs. Success saves the snapshot
and last-run timestamp together, once per local day. Failure can retry at the next
15-minute check. This can incur another Claude request. Disabling removes future
checks; an already claimed request may finish. Manual Dashboard refresh is independent.

Telegram delivery stays manual: enabling research does not consent to message delivery.

## Required setup

1. Enable **pg_cron** (Supabase Cron), **pg_net**, and **Vault** in your Supabase project.
2. Set a random server-side `CRON_SECRET` of at least 32 characters in the deployment.
3. In Supabase Vault create:
   - `football_app_url`: the HTTPS origin of the deployed application.
   - `football_cron_secret`: exactly the same value as the deployment's `CRON_SECRET`.
   Do not expose these secrets in browser variables or paste them in commit files.
4. Apply `supabase/migrations/202609230002_profile_scheduler.sql` through the SQL editor
   after the existing schema. Apply as the project database owner (normally postgres).
   **This migration disables existing schedules for fresh opt-in. Re-running it will
   disable them again.** It does not call Claude or send Telegram messages.
5. Deploy the matching code. Ensure the deployment allows the research request to
   finish (Claude SDK timeout: 120 seconds; scheduler HTTP timeout: 180 seconds).
6. In Profile select a timezone/time, enable and save. A missing Vault configuration
   makes the save fail and rolls back the job/settings changes.

The migration replaces direct authenticated writes to schedule_settings with the
`save_football_schedule` RPC. Older app deployments cannot save after the migration.
Keep the former GitHub scheduled workflows disabled if still published elsewhere.

## Acceptance checks

In Supabase SQL editor inspect only this application's jobs:

```sql
select jobid, jobname, schedule, active
from cron.job where jobname like 'football-user-%';
```

- Before opt-in: no job for your account.
- Enable/save: exactly one job; repeated saves still leave one.
- Disable/save: no job for that account; other accounts' jobs remain unchanged.
- Enable with a near-future local time and selected teams: after the next check,
  verify a new dashboard snapshot and last_run_at.
- Trigger the same enabled schedule twice: only one request should claim it.
- Test a missing secret: saving enabled should fail without changing prior settings.
- Test a failed provider request: the old snapshot remains and a later check can retry.
- Check `cron.job_run_details` for SQL failures and `net._http_response` for HTTP
  failures. Cron success means the request was queued, not that research succeeded.

Local tests mock Supabase. This migration and real scheduling were not executed
against a live project. Test the above after database setup; local tests alone do
not validate extension permissions, SQL execution or deployment timeouts.

References: [Supabase scheduling](https://supabase.com/docs/guides/functions/schedule-functions),
[Cron management](https://supabase.com/docs/guides/cron/quickstart).

```powershell
git add -- README.md .github/workflows/scheduled-research.yml src/app/api/schedule/route.ts src/app/api/cron/research/route.ts src/app/profile/ScheduleSettings.tsx supabase/migrations/202609230002_profile_scheduler.sql tests/scheduled-research.test.mjs docs/scheduler-setup.md
git commit -m "feat(automation): control per-user research jobs from profile"
```
