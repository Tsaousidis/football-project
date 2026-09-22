import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const next = requestedNext === "/dashboard" || requestedNext === "/auth/reset-password" ? requestedNext : "/onboarding";
  if (code && !searchParams.has("error")) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, origin));
    } catch {
      // Keep credentials and auth query parameters out of logs and redirects.
    }
  }
  return NextResponse.redirect(new URL("/auth/auth-code-error", origin));
}
