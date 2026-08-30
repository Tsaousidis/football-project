import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";

const defaultSettings = {
  enabled: false,
  frequency: "daily",
  dayOfWeek: 1,
  runTime: "06:00",
  timezone: "UTC",
};

async function getAuthenticatedClient() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : user };
}

function mapSettings(data: { enabled: boolean; frequency: string; day_of_week: number; run_time: string; timezone: string }) {
  return {
    enabled: data.enabled,
    frequency: data.frequency === "weekly" ? "weekly" : "daily",
    dayOfWeek: data.day_of_week,
    runTime: data.run_time.slice(0, 5),
    timezone: data.timezone,
  } as const;
}

export async function GET() {
  const { supabase, user } = await getAuthenticatedClient();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { data, error } = await supabase.from("schedule_settings").select("enabled, frequency, day_of_week, run_time, timezone").eq("user_id", user.id).maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not load schedule settings." }, { status: 500 });
  }

  return NextResponse.json({ settings: data ? mapSettings(data) : defaultSettings });
}

export async function PUT(request: Request) {
  const { supabase, user } = await getAuthenticatedClient();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const body = await request.json();
  const settings = {
    enabled: Boolean(body.enabled),
    frequency: body.frequency === "weekly" ? "weekly" : "daily",
    day_of_week: Math.min(6, Math.max(0, Number(body.dayOfWeek) || 0)),
    run_time: typeof body.runTime === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(body.runTime) ? body.runTime : "06:00",
    timezone: typeof body.timezone === "string" && body.timezone.trim() ? body.timezone.trim() : "UTC",
  };

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: settings.timezone }).format();
  } catch {
    return NextResponse.json({ error: "Please enter a valid IANA timezone." }, { status: 400 });
  }

  const { data, error } = await supabase.from("schedule_settings").upsert({ user_id: user.id, ...settings }, { onConflict: "user_id" }).select("enabled, frequency, day_of_week, run_time, timezone").single();

  if (error) {
    return NextResponse.json({ error: "Could not save schedule settings." }, { status: 500 });
  }

  return NextResponse.json({ settings: mapSettings(data) });
}