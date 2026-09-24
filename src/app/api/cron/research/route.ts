import { NextResponse } from "next/server";
import { researchTeamSnapshot } from "@/lib/football-research";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { TEAM_CATALOG } from "@/lib/teams";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const targetUser = new URL(request.url).searchParams.get("user_id");
  if (!targetUser || !/^[0-9a-f-]{36}$/i.test(targetUser)) return NextResponse.json({ error: "A valid user_id is required." }, { status: 400 });
  try {
    const client = createSupabaseAdminClient();
    const { data: claim, error: claimError } = await client.rpc("claim_football_schedule", { target_user: targetUser }).maybeSingle<{ last_attempt_at: string }>();
    if (claimError) throw claimError;
    if (!claim) return NextResponse.json({ success: true, updatedUsers: 0, message: "Schedule disabled, not due, or already running." });
    const { data: selections, error: selectionError } = await client.from("user_teams").select("team_id").eq("user_id", targetUser);
    if (selectionError) throw selectionError;
    const names = (selections ?? []).map((row) => TEAM_CATALOG.find((team) => team.id === row.team_id)?.name);
    if (!names.length || names.length > 3 || names.some((name) => !name)) throw new Error("Invalid team selection");
    const payload = await researchTeamSnapshot(names as string[]);
    const { data: saved, error: saveError } = await client.rpc("finish_football_schedule", {
      target_user: targetUser, attempt_at: claim.last_attempt_at, snapshot_data: payload,
    });
    if (saveError || !saved) throw new Error("Could not save research");
    return NextResponse.json({ success: true, updatedUsers: 1 });
  } catch {
    return NextResponse.json({ error: "Scheduled research failed. Check server configuration and selected teams." }, { status: 500 });
  }
}
