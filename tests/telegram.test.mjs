import { test } from "node:test";
import assert from "node:assert/strict";
import { createTelegramLinkToken, hashTelegramToken, parseTelegramLinkUpdate, verifyTelegramSecret, telegramRequest } from "../src/lib/telegram.ts";

test("link tokens are unique, hashed and expire after ten minutes", () => {
  const first = createTelegramLinkToken();
  const second = createTelegramLinkToken();
  assert.match(first.token, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(first.token, second.token);
  assert.equal(first.hash, hashTelegramToken(first.token));
  assert.ok(Date.parse(first.expiresAt) > Date.now() + 590_000);
});
const token = "a".repeat(43);
const update = { message: { chat: { id: 123, type: "private" }, from: { id: 123, is_bot: false }, text: "/start " + token } };
test("only a valid private start message can link a chat", () => {
  assert.deepEqual(parseTelegramLinkUpdate(update), { token, chatId: "123" });
  for (const value of [null, {}, { message: null }, { message: { ...update.message, chat: { id: -123, type: "group" } } }, { message: { ...update.message, from: { id: 456 } } }, { message: { ...update.message, text: "/start short" } }, { message: { ...update.message, from: { id: 123, is_bot: true } } }]) {
    assert.equal(parseTelegramLinkUpdate(value), null);
  }
});
test("webhook authentication rejects missing, wrong and different-length secrets", () => {
  const previous = process.env.TELEGRAM_WEBHOOK_SECRET;
  try {
    process.env.TELEGRAM_WEBHOOK_SECRET = "test-secret";
    assert.equal(verifyTelegramSecret("test-secret"), true);
    for (const value of [null, "", "wrong", "test-secrex"]) assert.equal(verifyTelegramSecret(value), false);
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    assert.equal(verifyTelegramSecret("test-secret"), false);
  } finally { if (previous === undefined) delete process.env.TELEGRAM_WEBHOOK_SECRET; else process.env.TELEGRAM_WEBHOOK_SECRET = previous; }
});
test("Telegram transport sends plain text and redacts provider errors", async () => {
  const previous = process.env.TELEGRAM_BOT_TOKEN;
  const originalFetch = globalThis.fetch;
  try {
    process.env.TELEGRAM_BOT_TOKEN = "fake-secret-token";
    let body;
    globalThis.fetch = async (_url, options) => { body = JSON.parse(options.body); return Response.json({ ok: true, result: { message_id: 1 } }); };
    await telegramRequest("sendMessage", { chat_id: "123", text: "Test" });
    assert.deepEqual(body, { chat_id: "123", text: "Test" });
    globalThis.fetch = async () => { throw new Error("https://api.telegram.org/botfake-secret-token"); };
    await assert.rejects(telegramRequest("getMe"), (error) => !error.message.includes("fake-secret-token"));
    globalThis.fetch = async () => Response.json({ ok: false, description: "Blocked" });
    await assert.rejects(telegramRequest("sendMessage"));
  } finally { globalThis.fetch = originalFetch; if (previous === undefined) delete process.env.TELEGRAM_BOT_TOKEN; else process.env.TELEGRAM_BOT_TOKEN = previous; }
});
