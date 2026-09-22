# Send a saved football briefing

After completing `docs/telegram-setup.md`, open Dashboard and select **Send briefing
to Telegram**. The server reads the signed-in user's latest saved snapshot and
current team selection. No new Claude research or automatic scheduling is triggered.

One plain-text message is sent per team, up to three messages. Each includes the
research timestamp in UTC, fixtures, result, standing and up to three short stories.
Each story includes one suitable source link; Dashboard retains the full summaries
and all sources. Text is shortened to remain within Telegram's 4096-character limit,
without splitting Unicode characters or URLs. Link previews are disabled.

Missing/invalid research, changed selections and missing Telegram connections block
sending. A database reservation shares the previous step's `last_test_at` cooldown:
tests and briefings together allow one attempt per minute, including failures.
No additional migration is required beyond the Telegram connection migration.

If delivery stops midway, the response reports confirmed messages. A timeout can
occur after Telegram accepted a message; check Telegram before trying again.
There is no automatic retry or exactly-once delivery guarantee. A manual retry sends
the whole briefing again. Disconnecting cannot recall an in-flight send.

Checks: `node --test tests/telegram-briefing*.test.mjs`, `npm run lint`,
`npx tsc --noEmit`. Tests use mocked services; no live messages were sent.
After deployment, test a saved briefing, a changed shortlist, a disconnected or
blocked bot, and repeated clicks from two tabs.

API reference: https://core.telegram.org/bots/api#sendmessage

```powershell
git add -- src/lib/telegram-briefing.ts src/app/api/telegram/briefing/route.ts src/app/dashboard/SendTelegramBriefing.tsx src/app/dashboard/DashboardClient.tsx tests/telegram-briefing.test.mjs tests/telegram-briefing-route.test.mjs docs/telegram-briefing.md
git commit -m "feat(telegram): send saved football briefings from dashboard"
```
