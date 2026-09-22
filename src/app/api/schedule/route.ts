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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)
    || typeof body.enabled !== "boolean"
    || !["daily", "weekly"].includes(body.frequency)
    || !Number.isInteger(body.dayOfWeek) || body.dayOfWeek < 0 || body.dayOfWeek > 6
    || typeof body.runTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.runTime)
    || typeof body.timezone !== "string" || !body.timezone.trim()) {
    return NextResponse.json({ error: "Please provide valid schedule settings." }, { status: 400 });
  }

  const settings = {
    enabled: body.enabled,
    frequency: body.frequency,
    day_of_week: body.dayOfWeek,
    run_time: body.runTime,
    timezone: body.timezone.trim(),
    updated_at: new Date().toISOString(),
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
