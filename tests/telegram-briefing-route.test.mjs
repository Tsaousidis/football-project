import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function setup({ user = { id: "owner" }, connected = true, reserved = true, invalid = false, failAt = -1 } = {}) {
  const calls = [];
  const filters = [];
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table) {
      let writing = false;
      const result = () => ({ error: null, data: table === "user_teams" ? [{ team_id: "paok" }] : table === "dashboard_snapshots" ? { data: {}, generated_at: "2026-09-23T10:00:00Z" } : connected && (!writing || reserved) ? { chat_id: "123" } : null });
      const query = {
        select: () => query, order: () => query, limit: () => query, or: () => query,
        eq: (...args) => { filters.push(args); return query; },
        update: () => { writing = true; return query; },
        maybeSingle: async () => result(),
        then: (resolve, reject) => Promise.resolve(result()).then(resolve, reject),
      };
      return query;
    },
  };
  const mocks = {
    "next/server": { NextResponse: { json: (data, init) => Response.json(data, init) } },
    "@/lib/supabase-server": { createSupabaseServerClient: async () => client },
    "@/lib/supabase-admin": { createSupabaseAdminClient: () => client },
    "@/lib/telegram": { telegramConfigured: () => true, telegramRequest: async (_method, body) => { calls.push(body); if (calls.length === failAt) throw new Error("Provider failure"); } },
    "@/lib/research-payload": { validateResearchPayload: () => { if (invalid) throw new Error(); return {}; } },
    "@/lib/telegram-briefing": { formatTelegramBriefing: () => ["First message", "Second message"] },
    "@/lib/teams": { TEAM_CATALOG: [{ id: "paok", name: "PAOK" }] },
  };
  const source = readFileSync(new URL("../src/app/api/telegram/briefing/route.ts", import.meta.url), "utf8");
  const exports = {};
  new Function("require", "exports", ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText)((key) => mocks[key], exports);
  return { post: exports.POST, calls, filters };
}
const request = (origin = "https://app.example") => new Request("https://app.example/api/telegram/briefing", { method: "POST", headers: { origin } });
test("unauthenticated and cross-origin requests send nothing", async () => {
  const ctx = setup({ user: null });
  assert.equal((await ctx.post(request())).status, 401);
  assert.equal((await ctx.post(request("https://elsewhere.example"))).status, 403);
  assert.equal(ctx.calls.length, 0);
});
test("missing connection, invalid snapshot and concurrent sends stop before Telegram", async () => {
  for (const options of [{ connected: false }, { invalid: true }, { reserved: false }]) {
    const ctx = setup(options);
    assert.ok([409, 429].includes((await ctx.post(request())).status));
    assert.equal(ctx.calls.length, 0);
  }
});
test("delivery uses the stored chat and scopes database queries to the signed-in user", async () => {
  const ctx = setup();
  const response = await ctx.post(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).sent, 2);
  assert.ok(ctx.calls.every((body) => body.chat_id === "123" && !body.parse_mode));
  assert.ok(ctx.filters.filter(([key]) => key === "user_id").every(([, value]) => value === "owner"));
});
test("partial failure reports confirmed messages and does not retry automatically", async () => {
  const ctx = setup({ failAt: 2 });
  const response = await ctx.post(request());
  assert.equal(response.status, 502);
  assert.equal((await response.json()).sent, 1);
  assert.equal(ctx.calls.length, 2);
});
