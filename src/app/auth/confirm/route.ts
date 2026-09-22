import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  if (tokenHash && (type === "email" || type === "recovery") && !searchParams.has("error")) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (!error) return NextResponse.redirect(new URL(type === "recovery" ? "/auth/reset-password" : "/onboarding", origin));
    } catch {
      // Show a recoverable error without exposing the verification token.
    }
  }
  return NextResponse.redirect(new URL("/auth/auth-code-error", origin));
}
