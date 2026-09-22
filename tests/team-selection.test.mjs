import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function load(path, mocks = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const exports = {};
  new Function("require", "exports", ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText)((name) => {
    if (!(name in mocks)) throw new Error("Unexpected import: " + name);
    return mocks[name];
  }, exports);
  return exports;
}
const teams = load("../src/lib/teams.ts");
const ids = teams.TEAM_CATALOG.slice(0, 4).map((team) => team.id);
function route(client) {
  return load("../src/app/api/onboarding/route.ts", {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/supabase-server": { createSupabaseServerClient: async () => client },
    "@/lib/teams": teams,
  });
}
const auth = { getUser: async () => ({ data: { user: { id: "user-a" } }, error: null }) };
const request = (teamIds) => new Request("https://app.example/api/onboarding", { method: "POST", body: JSON.stringify({ teamIds }) });

test("validation rejects malformed, empty, unknown and oversized selections", () => {
  for (const value of [undefined, null, "paok", {}, [], [null], [1], ["unknown"], ids]) {
    assert.throws(() => teams.validateTeamSelection(value));
  }
  assert.deepEqual(teams.validateTeamSelection([ids[0], ids[0], ids[1]]), ids.slice(0, 2));
});

test("unauthenticated reads and saves are rejected before database access", async () => {
  const handlers = route({ auth: { getUser: async () => ({ data: { user: null }, error: null }) } });
  assert.equal((await handlers.GET()).status, 401);
  assert.equal((await handlers.POST(request([ids[0]]))).status, 401);
});

test("invalid JSON and selections never reach the write transaction", async () => {
  let writes = 0;
  const handlers = route({ auth, rpc: async () => { writes++; return { error: null }; } });
  for (const req of [request(ids), request([]), request(["unknown"]), new Request("https://app.example", { method: "POST", body: "{" })]) {
    assert.equal((await handlers.POST(req)).status, 400);
  }
  assert.equal(writes, 0);
});

test("valid save invokes one replacement transaction without a caller-supplied user ID", async () => {
  const calls = [];
  const handlers = route({ auth, rpc: async (...args) => { calls.push(args); return { error: null }; } });
  const result = await handlers.POST(request([ids[0], ids[1], ids[0]]));
  assert.equal(result.status, 200);
  assert.deepEqual(calls, [["replace_user_teams", { selected_team_ids: ids.slice(0, 2) }]]);
  assert.deepEqual((await result.json()).selectedTeams, ids.slice(0, 2));
});

test("database failures do not report a successful save", async () => {
  const handlers = route({ auth, rpc: async () => ({ error: { message: "Database failure" } }) });
  assert.equal((await handlers.POST(request([ids[0]]))).status, 500);
});

test("GET loads only the signed-in user's persisted selections", async () => {
  const calls = [];
  const handlers = route({ auth, from: (table) => {
    calls.push(table);
    return { select: (columns) => { calls.push(columns); return { eq: async (...filter) => {
      calls.push(filter); return { data: [{ team_id: ids[1] }], error: null };
    } }; } };
  } });
  const response = await handlers.GET();
  assert.deepEqual((await response.json()).selectedTeams, [ids[1]]);
  assert.deepEqual(calls, ["user_teams", "team_id", ["user_id", "user-a"]]);
});
