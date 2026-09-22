import { test } from "node:test";
import assert from "node:assert/strict";
import { formatTelegramBriefing } from "../src/lib/telegram-briefing.ts";

const team = { teamName: "PAOK", competition: "Super League", nextMatch: null, lastResult: null, currentStanding: null, latestStories: [] };
const payload = (teams = [team]) => ({ generatedAt: "2026-09-23T10:00:00Z", teams });

test("briefing includes research time and honest missing-data messages", () => {
  const [message] = formatTelegramBriefing(payload());
  assert.match(message, /2026-09-23 10:00:00 UTC/);
  assert.match(message, /PAOK/);
  assert.match(message, /Details unavailable/);
  assert.match(message, /No recent stories/);
});
test("long Unicode content stays within Telegram limits without splitting a source URL", () => {
  const long = "⚽😀".repeat(5000);
  const story = { title: long, summary: long, sourceUrls: ["javascript:alert(1)", "https://example.com/news"] };
  const messages = formatTelegramBriefing(payload(Array.from({ length: 3 }, () => ({ ...team, teamName: long, competition: long, latestStories: [story, story, story] }))));
  assert.equal(messages.length, 3);
  for (const message of messages) {
    assert.ok(message.length <= 4096);
    assert.match(message, /https:\/\/example.com\/news/);
    assert.doesNotMatch(message, /javascript:/);
    assert.ok(message.isWellFormed());
  }
});
test("invalid dates and excessive team counts fail before delivery", () => {
  assert.throws(() => formatTelegramBriefing({ ...payload(), generatedAt: "invalid" }));
  assert.throws(() => formatTelegramBriefing(payload([])));
  assert.throws(() => formatTelegramBriefing(payload([team, team, team, team])));
});
