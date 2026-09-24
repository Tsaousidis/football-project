import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function setup({ claim = null, researchFails = false } = {}) {
  let researchCalls = 0;
  const rpcCalls = [];
  const client = {
    rpc(name, params) {
      rpcCalls.push([name, params]);
      if (name === "claim_football_schedule") return { maybeSingle: async () => ({ data: claim, error: null }) };
      return Promise.resolve({ data: true, error: null });
    },
    from: () => ({ select: () => ({ eq: async () => ({ data: [{ team_id: "paok" }], error: null }) }) }),
  };
  const mocks = {
    "next/server": { NextResponse: { json: (data, init) => Response.json(data, init) } },
    "@/lib/supabase-admin": { createSupabaseAdminClient: () => client },
    "@/lib/teams": { TEAM_CATALOG: [{ id: "paok", name: "PAOK" }] },
    "@/lib/football-research": { researchTeamSnapshot: async () => { researchCalls++; if (researchFails) throw new Error(); return { generatedAt: "2026-09-23T12:00:00Z", teams: [] }; } },
  };
  const source = readFileSync(new URL("../src/app/api/cron/research/route.ts", import.meta.url), "utf8");
  const exports = {};
  new Function("require", "exports", ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText)((key) => mocks[key], exports);
  return { get: exports.GET, rpcCalls, researchCalls: () => researchCalls };
}
const uid = "12345678-1234-1234-1234-123456789abc";
const request = (secret = "test-secret", id = uid) => new Request("https://app.example/api/cron/research?user_id=" + id, { headers: { authorization: "Bearer " + secret } });
test("scheduled endpoint requires secret and a target account", async () => {
  const previous = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "test-secret";
  try {
    const ctx = setup();
    assert.equal((await ctx.get(request("wrong"))).status, 401);
    assert.equal((await ctx.get(request("test-secret", ""))).status, 400);
    assert.equal(ctx.rpcCalls.length, 0);
  } finally { if (previous === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = previous; }
});
test("disabled, not due or leased schedules never call Claude", async () => {
  const previous = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "test-secret";
  try {
    const ctx = setup();
    assert.equal((await (await ctx.get(request())).json()).updatedUsers, 0);
    assert.equal(ctx.researchCalls(), 0);
  } finally { if (previous === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = previous; }
});
test("successful claims save snapshot and completion through one transaction", async () => {
  const previous = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "test-secret";
  try {
    const ctx = setup({ claim: { last_attempt_at: "attempt" } });
    assert.equal((await ctx.get(request())).status, 200);
    assert.equal(ctx.rpcCalls[1][0], "finish_football_schedule");
    assert.equal(ctx.rpcCalls[1][1].target_user, uid);
    assert.equal(ctx.rpcCalls[1][1].attempt_at, "attempt");
  } finally { if (previous === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = previous; }
});
test("failed research is never marked complete", async () => {
  const previous = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "test-secret";
  try {
    const ctx = setup({ claim: { last_attempt_at: "attempt" }, researchFails: true });
    assert.equal((await ctx.get(request())).status, 500);
    assert.equal(ctx.rpcCalls.length, 1);
  } finally { if (previous === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = previous; }
});
