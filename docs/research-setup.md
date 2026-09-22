# Claude research and dashboard validation

Research continues to use Anthropic. The default model and `.env.example` now use
`claude-sonnet-4-6`. An existing `ANTHROPIC_MODEL` environment variable overrides
the default: update it in `.env.local` and the deployment if it still points to
the old model. Keep `ANTHROPIC_API_KEY` on the server.

Model reference: https://platform.claude.com/docs/en/models/sonnet-4-6/overview

The request has a 120-second SDK timeout and no automatic SDK retries. Interrupted,
truncated, refused or failed-search responses are not saved. The old narrow domain
allowlist has been removed so research can find sources for all supported clubs.
The prompt requests English and exact canonical team names.

JSON and nested data are validated before persistence. Missing, duplicate or
unexpected teams fail the update. Match dates are checked; source links accept
only HTTP(S) without embedded credentials and are deduplicated. Source counts
reflect the links actually displayed. These checks validate structure, not the
factual accuracy or freshness of the model's claims.

Dashboard validates stored snapshots too. Older incompatible snapshots show a
refresh message instead of crashing. It distinguishes missing research, loading
errors and newly selected teams missing from the snapshot. Failed refreshes leave
the displayed update in place. Ambiguous short-name matching is removed.

## Verification

Run `node --test tests/research-payload.test.mjs`, `npm run lint`, and
`npx tsc --noEmit`.

No live paid Claude request was made. After configuring the model, manually check:

- Refresh 1–3 selected teams and compare dates, scores and source links.
- Change the shortlist and verify the dashboard asks for fresh research.
- Check the first-use state and a failed refresh with an existing snapshot.
- Verify the deployment permits requests long enough for web research.

Automatic scheduling remains off. This change introduces no Telegram delivery.

```powershell
git add -- .env.example src/lib/football-research.ts src/lib/research-payload.ts src/app/api/research/route.ts src/app/dashboard/page.tsx src/app/dashboard/DashboardClient.tsx tests/research-payload.test.mjs docs/research-setup.md
git commit -m "fix(research): validate Claude responses and dashboard states"
```
