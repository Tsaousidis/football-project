import { NextResponse } from "next/server";

import { isScheduleDue } from "@/lib/schedule";

import { researchTeamSnapshot } from "@/lib/football-research";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { TEAM_CATALOG } from "@/lib/teams";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authorization !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: schedules, error: scheduleError } = await supabase
      .from("schedule_settings")
      .select("user_id, enabled, frequency, day_of_week, run_time, timezone, last_run_at")
      .eq("enabled", true);

    if (scheduleError) {
      throw new Error(`Could not load schedule settings: ${scheduleError.message}`);
    }

    const scheduledUsers = (schedules ?? []).filter((schedule) => isScheduleDue(schedule)).map((schedule) => schedule.user_id);

    if (!scheduledUsers.length) {
      return NextResponse.json({ success: true, updatedUsers: 0, message: "No schedules are due." });
    }

    const { data: selections, error: selectionError } = await supabase
      .from("user_teams")
      .select("user_id, team_id")
      .in("user_id", scheduledUsers)
      .order("user_id");

    if (selectionError) {
      throw new Error(`Could not load user team selections: ${selectionError.message}`);
    }

    const teamsByUser = new Map<string, string[]>();

    for (const selection of selections ?? []) {
      const team = TEAM_CATALOG.find((catalogTeam) => catalogTeam.id === selection.team_id);

      if (!team) {
        continue;
      }

      const userTeams = teamsByUser.get(selection.user_id) ?? [];
      userTeams.push(team.name);
      teamsByUser.set(selection.user_id, userTeams);
    }

    let updatedUsers = 0;

    for (const [userId, teamNames] of teamsByUser) {
      const payload = await researchTeamSnapshot(teamNames);
      const { error: saveError } = await supabase.from("dashboard_snapshots").insert({
        user_id: userId,
        generated_at: payload.generatedAt,
        data: payload,
      });

      if (saveError) {
        throw new Error(`Could not save snapshot for user ${userId}: ${saveError.message}`);
      }

      const { error: scheduleUpdateError } = await supabase
        .from("schedule_settings")
        .update({ last_run_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (scheduleUpdateError) {
        throw new Error(`Could not update schedule for user ${userId}: ${scheduleUpdateError.message}`);
      }

      updatedUsers += 1;
    }

    return NextResponse.json({
      success: true,
      updatedUsers,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Scheduled research failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scheduled research failed." },
      { status: 500 },
    );
  }
}