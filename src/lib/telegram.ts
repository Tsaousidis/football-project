import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function telegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_WEBHOOK_SECRET);
}
export function createTelegramLinkToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashTelegramToken(token), expiresAt: new Date(Date.now() + 10 * 60_000).toISOString() };
}
export function hashTelegramToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function verifyTelegramSecret(header: string | null) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const actual = Buffer.from(header);
  const expected = Buffer.from(secret);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function parseTelegramLinkUpdate(value: unknown): { token: string; chatId: string } | null {
  if (!value || typeof value !== "object") return null;
  const message = (value as { message?: unknown }).message;
  if (!message || typeof message !== "object") return null;
  const { chat, from, text } = message as { chat?: { type?: string; id?: number }; from?: { id?: number; is_bot?: boolean }; text?: unknown };
  if (chat?.type !== "private" || !Number.isSafeInteger(chat.id) || !chat.id || chat.id < 0 || from?.id !== chat.id || from?.is_bot) return null;
  const match = typeof text === "string" ? /^\/start(?:@[a-zA-Z0-9_]+)? ([A-Za-z0-9_-]{43})$/.exec(text.trim()) : null;
  return match ? { token: match[1], chatId: String(chat.id) } : null;
}
export async function telegramRequest(method: "getMe" | "sendMessage", body: Record<string, unknown> = {}): Promise<unknown> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Telegram is not configured.");
  try {
    const response = await fetch("https://api.telegram.org/bot" + token + "/" + method, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      cache: "no-store", signal: AbortSignal.timeout(10_000),
    });
    const payload = await response.json();
    if (!response.ok || payload.ok !== true) throw new Error("Telegram request failed.");
    return payload.result;
  } catch {
    // Never expose provider URLs/errors: they can contain the bot token.
    throw new Error("Telegram could not complete the request. Check the bot connection and try again.");
  }
}
