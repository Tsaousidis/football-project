import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { telegramConfigured, telegramRequest } from "@/lib/telegram";
import { formatTelegramBriefing } from "@/lib/telegram-briefing";
import { validateResearchPayload } from "@/lib/research-payload";
import { TEAM_CATALOG } from "@/lib/teams";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  let sent = 0;
  try {
    const client = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    if (!telegramConfigured()) return NextResponse.json({ error: "Telegram is not configured yet." }, { status: 503 });
    const [{ data: snapshot, error: snapshotError }, { data: selections, error: selectionError }] = await Promise.all([
      client.from("dashboard_snapshots").select("data, generated_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      client.from("user_teams").select("team_id").eq("user_id", user.id),
    ]);
    if (snapshotError || selectionError) throw new Error();
    if (!snapshot) return NextResponse.json({ error: "Refresh research before sending a briefing." }, { status: 409 });
    let messages: string[];
    try {
      const names = (selections ?? []).map((row) => TEAM_CATALOG.find((team) => team.id === row.team_id)?.name);
      if (!names.length || names.length > 3 || names.some((name) => !name)) throw new Error();
      const payload = validateResearchPayload(snapshot.data, names as string[]);
      payload.generatedAt = snapshot.generated_at;
      messages = formatTelegramBriefing(payload);
    } catch {
      return NextResponse.json({ error: "Saved research does not match your current teams or cannot be sent. Refresh research first." }, { status: 409 });
    }
    const admin = createSupabaseAdminClient();
    const { data: connection, error: connectionError } = await admin.from("telegram_connections").select("chat_id").eq("user_id", user.id).maybeSingle();
    if (connectionError) throw connectionError;
    if (!connection?.chat_id) return NextResponse.json({ error: "Connect Telegram from your Profile first." }, { status: 409 });
    const cutoff = new Date(Date.now() - 60_000).toISOString();
    const { data: reserved, error: reserveError } = await admin.from("telegram_connections").update({ last_test_at: new Date().toISOString() }).eq("user_id", user.id).eq("chat_id", connection.chat_id).or("last_test_at.is.null,last_test_at.lt." + cutoff).select("chat_id").maybeSingle();
    if (reserveError) throw reserveError;
    if (!reserved) return NextResponse.json({ error: "Please wait a minute after your last Telegram send, then try again." }, { status: 429 });
    for (const text of messages) {
      await telegramRequest("sendMessage", { chat_id: reserved.chat_id, text, link_preview_options: { is_disabled: true } });
      sent++;
    }
    return NextResponse.json({ success: true, message: "Briefing sent to Telegram (" + sent + " messages).", sent });
  } catch {
    return NextResponse.json({ error: "Delivery could not be completed. " + sent + " messages confirmed sent. Check Telegram before retrying; the last message may also have arrived.", sent }, { status: 502 });
  }
}
