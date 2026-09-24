# Deployment and acceptance checklist

## Local verification (2026-09-24)

- Production build passed and generated all 23 routes/pages.
- All 39 tests passed. These use local data and mocked services.
- ESLint and TypeScript passed.
- Production HTTP checks: homepage, sign-in, signup, forgot-password and verification
  resend returned 200. Dashboard/Profile redirected unauthenticated users to login.
- Research, team selection, Telegram status, cron and webhook rejected unauthenticated
  requests. Briefing rejected a request without an allowed origin.
- No real email, Claude research or Telegram message was sent in this verification.
- Browser visual checks, real SQL migrations and authenticated cross-service journeys
  are still pending. Local success is not proof those integrations are configured.

## Configuration still needed locally

The value-redacting checker found missing/placeholder `SUPABASE_SERVICE_ROLE_KEY`,
`CRON_SECRET` and `TELEGRAM_WEBHOOK_SECRET`, plus an app URL unsuitable for production
HTTPS. This reports the local environment only, not deployment settings.
Anthropic and Telegram bot credentials were present but were not validated remotely.

Use Node.js 24 for these scripts. Configure server-side environment variables from
`.env.example` in the hosting provider. Public Supabase URL/key are needed during the
Next.js build. Never upload `.env.local` to Git or expose service-role/provider keys
through `NEXT_PUBLIC_` variables.

```powershell
npm ci
npm run check:config
npm run lint
npm test
npm run build
npm start
```

Production uses a public HTTPS app origin. Local development can keep localhost;
the production checker intentionally rejects it. Use `npm run typecheck` for a
separate TypeScript check after Next.js has generated its route types.

## Database and service setup

1. Fresh database only: apply `supabase/schema.sql`. Do not rerun it blindly on an
   existing project because its policy creation statements are not all repeatable.
2. Apply migrations in order, recording which have already been applied:
   - `202609220001_replace_user_teams.sql`
   - `202609230001_telegram_connections.sql`
   - `202609230002_profile_scheduler.sql`
   - `202609240001_snapshot_access.sql`
3. Before the scheduler migration, enable pg_cron, pg_net and Vault. Follow
   [scheduler setup](scheduler-setup.md) for Vault secrets. That migration disables
   existing schedules; reapplying it disables them again.
4. The snapshot migration enables RLS and restricts authenticated reads/inserts to
   the user's own snapshots. Confirm this with two separate accounts after applying.
5. Complete [email setup](auth-setup.md): Confirm email, public Site URL, redirect
   allowlist, signup/recovery templates and production email delivery.
6. Deploy the matching app version. Build: `npm run build`; start: `npm start`.
   Ensure hosting request timeouts accommodate the 120-second Claude request.
   Schema changes revoke old direct-write paths, so coordinate migration and deploy.
7. Register the HTTPS Telegram webhook using [Telegram setup](telegram-setup.md).
   The deployment and registration script must use the same webhook secret.

## Real acceptance journey

- Create an account, receive the verification email, confirm and sign in.
- Resend verification for an unconfirmed account. Reset a password through email;
  verify the new password works and the old one fails.
- Save 1–3 teams; reload, replace one and confirm it disappears from the old list.
- Refresh research and verify real results, timestamps and source links.
- Connect Telegram; send a test, then a briefing, then disconnect.
- Enable a near-future schedule. Confirm exactly one account job in cron.job;
  disable/save and confirm its removal. Verify one successful scheduled update.
- Use two accounts to confirm teams, snapshots and Telegram connections are isolated.
- Check homepage, forms and Dashboard on desktop and mobile, including keyboard use.

Only then mark deployment accepted. No new feature phase is required for this list;
it completes configuration and validation of the features already implemented.

## Commit for this verification step

```powershell
git add -- package.json README.md scripts/check-config.mjs supabase/migrations/202609240001_snapshot_access.sql docs/deployment.md
git commit -m "chore(release): add deployment checks and snapshot access policies"
```
