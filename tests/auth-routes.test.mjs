import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function loadRoute(path, auth) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const routeModule = { exports: {} };
  const mocks = {
    "next/server": { NextResponse: { redirect: (url) => Response.redirect(url, 307) } },
    "@/lib/supabase-server": { createSupabaseServerClient: async () => ({ auth }) },
  };
  new Function("require", "exports", "module", outputText)((name) => {
    if (!(name in mocks)) throw new Error("Unexpected import: " + name);
    return mocks[name];
  }, routeModule.exports, routeModule);
  return routeModule.exports.GET;
}

const confirmPath = "../src/app/auth/confirm/route.ts";
const callbackPath = "../src/app/auth/callback/route.ts";

test("confirmation exchanges email token and strips credentials from redirect", async () => {
  const get = loadRoute(confirmPath, { verifyOtp: async (input) => {
    assert.deepEqual(input, { token_hash: "test-token", type: "email" });
    return { error: null };
  } });
  const result = await get(new Request("https://app.example/auth/confirm?token_hash=test-token&type=email&next=https://evil.example"));
  assert.equal(result.headers.get("location"), "https://app.example/onboarding");
});

test("missing tokens and non-email OTP types do not reach Supabase", async () => {
  let calls = 0;
  const get = loadRoute(confirmPath, { verifyOtp: async () => { calls++; return { error: null }; } });
  for (const query of ["", "?type=email", "?token_hash=test&type=recovery"]) {
    const result = await get(new Request("https://app.example/auth/confirm" + query));
    assert.equal(result.headers.get("location"), "https://app.example/auth/auth-code-error");
  }
  assert.equal(calls, 0);
});

test("expired token and network failure return an error page", async () => {
  for (const verifyOtp of [async () => ({ error: { message: "Expired" } }), async () => { throw new Error("Offline"); }]) {
    const get = loadRoute(confirmPath, { verifyOtp });
    const result = await get(new Request("https://app.example/auth/confirm?token_hash=test&type=email"));
    assert.equal(result.headers.get("location"), "https://app.example/auth/auth-code-error");
  }
});

test("PKCE callback allows only known internal destinations", async () => {
  const get = loadRoute(callbackPath, { exchangeCodeForSession: async (code) => {
    assert.equal(code, "test-code");
    return { error: null };
  } });
  for (const next of ["https://evil.example", "//evil.example", "/\\evil.example", "/dashboard", "/onboarding"]) {
    const result = await get(new Request("https://app.example/auth/callback?code=test-code&next=" + encodeURIComponent(next)));
    assert.equal(result.headers.get("location"), "https://app.example" + (next === "/dashboard" ? next : "/onboarding"));
  }
});

test("callback auth errors and missing codes never create a session", async () => {
  let calls = 0;
  const get = loadRoute(callbackPath, { exchangeCodeForSession: async () => { calls++; return { error: null }; } });
  for (const query of ["", "?code=test&error=access_denied"]) {
    const result = await get(new Request("https://app.example/auth/callback" + query));
    assert.equal(result.headers.get("location"), "https://app.example/auth/auth-code-error");
  }
  assert.equal(calls, 0);
});
