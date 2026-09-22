# Telegram connection setup

This step adds account linking, connection status, an explicitly requested test
message and disconnect. Football briefing delivery is the next separate step.
All interface and message text is English.

## Setup

1. Create a bot with Telegram's official `@BotFather` using `/newbot`. Keep the bot
   token private. Use a separate bot for development if production already uses one.
2. Apply `supabase/migrations/202609230001_telegram_connections.sql` in the Supabase
   SQL editor. It creates a private connection table and a service-role-only function
   that consumes a single-use connection token. Reapplying the migration is safe.
3. Set these server environment values in `.env.local` and on the deployment:

   ```dotenv
   TELEGRAM_BOT_TOKEN=<BotFather token>
   TELEGRAM_WEBHOOK_SECRET=<random secret>
   NEXT_PUBLIC_APP_URL=https://your-deployed-app.example
   SUPABASE_SERVICE_ROLE_KEY=<Supabase service role key>
   ```

   Keep the existing Supabase public URL/key too. Generate a secret with
   `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
   No private key uses a `NEXT_PUBLIC_` prefix. Anthropic variables remain unchanged.
4. Deploy the application to a publicly reachable HTTPS address. Restart local
   development after environment changes. Telegram cannot call a localhost URL.
5. From the project directory, explicitly register the webhook:

   ```powershell
   node --env-file=.env.local scripts/configure-telegram-webhook.mjs
   ```

   This changes the bot's webhook to the configured deployment. The script prints
   success/failure without printing the bot token. The deployed webhook secret must
   match the value used by this command. One bot has one webhook: do not point a
   production bot at a development tunnel accidentally.

## Connect and test

1. Sign in and open **Profile → Telegram → Connect Telegram**.
2. Select **Open Telegram**, then **Start** inside your private chat with the bot.
3. Return to Profile and select **Check connection**. There is no background polling.
4. Select **Send test message**. This sends one fixed message to your linked chat.
5. **Disconnect** clears both the connection and pending links. A test already being
   sent can still arrive. **Cancel connection** invalidates an unused link.

Links expire after ten minutes; generating a new one invalidates the old one.
Do not share a connection link: whoever opens it can link their chat to your account.
One chat can connect to only one application account. Disconnect from the previous
account before reusing that chat. A used, expired or conflicting link does not connect;
check status in Profile and generate a new link if needed. The bot does not send an
automatic confirmation message in this step.

Only token hashes are stored. The webhook requires Telegram's secret header, accepts
private human `/start` messages only, and consumes tokens atomically in PostgreSQL.
Clients cannot write the chat ID directly. Tests are limited to one attempt per minute,
including failed delivery attempts. Telegram blocking/network failures appear in Profile.

## Verification and limits

Local checks: `node --test tests/telegram.test.mjs`, `npm run lint`, `npx tsc --noEmit`.
These tests mock Telegram; they send no real messages. The migration, bot registration
and delivery still require testing against your configured services.

After setup, check linking, replay/expiry, disconnect, a second account attempting
to reuse a linked chat, and a blocked bot failing to deliver a test. Connection
status records the link; successful test delivery confirms the bot can currently send.

References: [Telegram deep links](https://core.telegram.org/bots/features#deep-linking),
[webhook setup](https://core.telegram.org/bots/api#setwebhook).

## Commit

```powershell
git add -- .gitignore .env.example src/lib/telegram.ts src/app/api/telegram src/app/profile/TelegramSettings.tsx src/app/profile/page.tsx supabase/migrations/202609230001_telegram_connections.sql scripts/configure-telegram-webhook.mjs tests/telegram.test.mjs docs/telegram-setup.md
git commit -m "feat(telegram): add account linking and connection controls"
```
