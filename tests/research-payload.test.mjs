import { test } from "node:test";
import assert from "node:assert/strict";
import { parseResearchResponse, validateResearchPayload, safeSourceUrl } from "../src/lib/research-payload.ts";
const team = { teamName: "PAOK", competition: "Super League", nextMatch: null, lastResult: null, currentStanding: null, latestStories: [] };
const payload = (teams = [team]) => ({ generatedAt: "2026-09-22T06:00:00Z", teams });
test("valid research canonicalizes names and uses a server timestamp", () => {
  const result = parseResearchResponse(JSON.stringify(payload([{ ...team, teamName: " paok " }])), ["PAOK"]);
  assert.equal(result.teams[0].teamName, "PAOK");
  assert.ok(Number.isFinite(Date.parse(result.generatedAt)));
});
test("missing, duplicate, unexpected teams and invalid JSON are rejected", () => {
  for (const input of ["{}", "null", "broken", JSON.stringify(payload([])), JSON.stringify(payload([team, team])), JSON.stringify(payload([{ ...team, teamName: "Other" }]))]) {
    assert.throws(() => parseResearchResponse(input, ["PAOK"]));
  }
  assert.throws(() => validateResearchPayload(payload(), ["PAOK", "AEL"]));
});
test("malformed nested data cannot reach the dashboard", () => {
  for (const change of [{ latestStories: {} }, { competition: {} }, { currentStanding: { position: "first" } }, { nextMatch: { opponent: {} } }]) {
    assert.throws(() => validateResearchPayload(payload([{ ...team, ...change }]), ["PAOK"]));
  }
});
test("unsafe and duplicate source URLs are removed and count reflects actual links", () => {
  const story = { title: "News", summary: "Summary", category: "Club", importance: "High", sourceCount: 99, sourceUrls: ["javascript:alert(1)", "https://example.com/news", "https://example.com/news", "https://user:pass@example.com"] };
  const result = validateResearchPayload(payload([{ ...team, latestStories: [story] }]), ["PAOK"]);
  assert.deepEqual(result.teams[0].latestStories[0].sourceUrls, ["https://example.com/news"]);
  assert.equal(result.teams[0].latestStories[0].sourceCount, 1);
  assert.equal(safeSourceUrl("data:text/html,test"), null);
});
test("impossible match dates are rejected", () => {
  const match = { opponent: "AEL", competition: "League", venue: "Home", status: "scheduled", date: "2026-02-30", time: "20:00" };
  assert.throws(() => validateResearchPayload(payload([{ ...team, nextMatch: match }]), ["PAOK"]));
});
