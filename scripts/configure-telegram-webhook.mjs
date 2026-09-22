// Run explicitly after deploying the webhook endpoint. Never logs secrets.
const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
if (!token || !secret || !appUrl || !/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
  console.error("Set TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET (letters, digits, underscore or hyphen), and NEXT_PUBLIC_APP_URL.");
  process.exit(1);
}
try {
  const url = new URL("/api/telegram/webhook", appUrl);
  if (url.protocol !== "https:" || ["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error();
  const response = await fetch("https://api.telegram.org/bot" + token + "/setWebhook", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: url.href, secret_token: secret, allowed_updates: ["message"] }),
    signal: AbortSignal.timeout(15_000),
  });
  const result = await response.json();
  if (!response.ok || result.ok !== true) throw new Error();
  console.log("Telegram webhook registered successfully.");
} catch {
  console.error("Webhook registration failed. Check the HTTPS app URL, bot token and deployment. Secrets have not been logged.");
  process.exitCode = 1;
}
