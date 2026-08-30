import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/onboarding";

  if (!next.startsWith("/")) {
    next = "/onboarding";
  }

  console.log("AUTH CALLBACK");
  console.log("code exists:", !!code);
  console.log("next:", next);

  if (code) {
    const supabase = await createSupabaseServerClient();

    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log("AUTH SUCCESS");
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("SUPABASE AUTH CALLBACK ERROR:", error);
  } else {
    console.error("NO AUTH CODE IN CALLBACK");
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}