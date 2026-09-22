import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { TEAM_CATALOG, validateTeamSelection } from "@/lib/teams";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    const { data, error } = await supabase.from("user_teams").select("team_id").eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ teams: TEAM_CATALOG, selectedTeams: (data ?? []).map((row) => row.team_id) });
  } catch {
    return NextResponse.json({ error: "Could not load your selected teams. Please try again." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Please sign in before saving your teams." }, { status: 401 });
    let selected: string[];
    try {
      const body = await request.json();
      selected = validateTeamSelection(body?.teamIds);
    } catch (error) {
      return NextResponse.json({ error: error instanceof SyntaxError ? "Invalid JSON body." : error instanceof Error ? error.message : "Invalid team selection." }, { status: 400 });
    }
    const { error } = await supabase.rpc("replace_user_teams", { selected_team_ids: selected });
    if (error) throw error;
    return NextResponse.json({ success: true, selectedTeams: selected });
  } catch {
    return NextResponse.json({ error: "Could not confirm your save. Please reload your teams and try again." }, { status: 500 });
  }
}
