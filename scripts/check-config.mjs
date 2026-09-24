// Validate configuration without printing values or making external requests.
const required = [
  "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY", "CRON_SECRET",
  "TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET",
];
let errors = 0;
for (const key of required) {
  const value = process.env[key]?.trim();
  const valid = Boolean(value) && !/^(your[-_]|<)/i.test(value);
  console.log(`${key}: ${valid ? "present" : "missing or placeholder"}`);
  if (!valid) errors++;
}
for (const key of ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SUPABASE_URL"]) {
  try {
    const url = new URL(process.env[key]);
    if (url.protocol !== "https:" || url.username || url.password || ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw new Error();
  } catch { console.log(`${key}: production requires a public HTTPS URL`); errors++; }
}
if ((process.env.CRON_SECRET?.length ?? 0) < 32) {
  console.log("CRON_SECRET: must have at least 32 characters for the scheduler"); errors++;
}
if (!/^[A-Za-z0-9_-]{1,256}$/.test(process.env.TELEGRAM_WEBHOOK_SECRET ?? "")) {
  console.log("TELEGRAM_WEBHOOK_SECRET: invalid format"); errors++;
}
console.log(`ANTHROPIC_MODEL: ${process.env.ANTHROPIC_MODEL ? "override present; verify model availability" : "application default"}`);
console.log("Presence checks do not validate credentials, migrations, Vault, email delivery or webhook registration.");
process.exitCode = errors ? 1 : 0;
