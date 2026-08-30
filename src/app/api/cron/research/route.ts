import { NextResponse } from "next/server";

import { researchTeamSnapshot } from "@/lib/football-research";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { TEAM_CATALOG } from "@/lib/teams";

export const runtime = "nodejs";

function getLocalScheduleState(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
    dayOfWeek: weekdays.indexOf(values.weekday),
  };
}

function isScheduleDue(schedule: {
  frequency: string;
  day_of_week: number;
  run_time: string;
  timezone: string;
  last_run_at: string | null;
}) {
  const current = getLocalScheduleState(schedule.timezone);
  const scheduledTime = schedule.run_time.slice(0, 5);
  const isAfterScheduledTime = current.time >= scheduledTime;
  const isCorrectDay = schedule.frequency === "daily" || current.dayOfWeek === schedule.day_of_week;

  if (!isAfterScheduledTime || !isCorrectDay) {
    return false;
  }

  if (!schedule.last_run_at) {
    return true;
  }

  const lastRunDate = new Intl.DateTimeFormat("en-CA", { timeZone: schedule.timezone }).format(new Date(schedule.last_run_at));

  return lastRunDate !== current.date;
}

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
      .select("user_id, frequency, day_of_week, run_time, timezone, last_run_at")
      .eq("enabled", true);

    if (scheduleError) {
      throw new Error(`Could not load schedule settings: ${scheduleError.message}`);
    }

    const scheduledUsers = (schedules ?? []).filter(isScheduleDue).map((schedule) => schedule.user_id);

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