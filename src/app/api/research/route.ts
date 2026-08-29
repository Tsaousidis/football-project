import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { researchTeamSnapshot } from "@/lib/football-research";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be signed in to trigger a research update." },
        { status: 401 },
      );
    }

    const { data: selections } = await supabase
      .from("user_teams")
      .select("team_id")
      .eq("user_id", user.id);

    const teamIds = (selections ?? []).map((selection) => selection.team_id);

    if (!teamIds.length) {
      return NextResponse.json(
        { error: "No selected teams found for this user." },
        { status: 400 },
      );
    }

    const teamNames = [
      "PAOK",
      "Borussia Dortmund",
      "Liverpool",
    ].slice(0, teamIds.length);

    const payload = await researchTeamSnapshot(teamNames);

    return NextResponse.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    console.error("Research request failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Research failed." },
      { status: 500 },
    );
  }
}
