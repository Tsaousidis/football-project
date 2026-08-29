import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
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

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You need to sign in before saving your team shortlist." },
        { status: 401 },
      );
    }

    const { error } = await supabase.from("user_teams").upsert(
      selected.map((teamId) => ({
        user_id: user.id,
        team_id: teamId,
      })),
      { onConflict: "user_id,team_id" },
    );

    if (error) {
      console.error("Supabase user_teams write failed:", error);
      return NextResponse.json(
        { error: "Could not save your selected teams." },
        { status: 500 },
      );
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
