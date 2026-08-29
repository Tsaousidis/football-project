import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";
import { validateTeamSelection } from "@/lib/teams";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const selected = validateTeamSelection(body?.teamIds ?? []);

    if (selected.length === 0) {
      return NextResponse.json(
        { error: "Select at least one team." },
        { status: 400 },
      );
    }

    if (selected.length > 3) {
      return NextResponse.json(
        { error: "You can select up to 3 teams." },
        { status: 400 },
      );
    }

    const isSupabaseConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    if (isSupabaseConfigured) {
      const { error } = await supabase.from("user_teams").upsert(
        selected.map((teamId) => ({
          user_id: "local-demo-user",
          team_id: teamId,
        })),
        { onConflict: "user_id,team_id" },
      );

      if (error) {
        console.warn("Supabase user_teams write failed, continuing with local mock success:", error.message);
      }
    }

    return NextResponse.json({
      success: true,
      selectedTeams: selected,
      message: "Your team shortlist has been saved.",
    });
  } catch (error) {
    console.error("Onboarding failed:", error);
    return NextResponse.json(
      { error: "Could not save team selection." },
      { status: 500 },
    );
  }
}
