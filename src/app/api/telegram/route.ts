import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createTelegramLinkToken, telegramConfigured, telegramRequest } from "@/lib/telegram";

export const runtime = "nodejs";
async function authenticatedUser() {
  const client = await createSupabaseServerClient();
  const { data: { user }, error } = await client.auth.getUser();
  return { client, user: error ? null : user };
}
export async function GET() {
  try {
    const { client, user } = await authenticatedUser();
    if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    if (!telegramConfigured()) return NextResponse.json({ configured: false, connected: false });
    const { data, error } = await client.from("telegram_connections").select("chat_id, connected_at").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ configured: true, connected: Boolean(data?.chat_id), connectedAt: data?.connected_at ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load your Telegram connection." }, { status: 500 });
  }
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const { user } = await authenticatedUser();
    if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    let action;
    try { action = (await request.json())?.action; } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
    if (!["connect", "disconnect", "test"].includes(action)) return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    const admin = createSupabaseAdminClient();
    if (action === "disconnect") {
      const { error } = await admin.from("telegram_connections").update({ chat_id: null, connected_at: null, link_token_hash: null, link_expires_at: null, last_test_at: null }).eq("user_id", user.id);
      if (error) throw error;
      return NextResponse.json({ success: true, message: "Telegram disconnected. Pending links have been cancelled." });
    }
    if (!telegramConfigured()) return NextResponse.json({ error: "Telegram is not configured yet." }, { status: 503 });
    if (action === "connect") {
      const bot = await telegramRequest("getMe") as { username?: string };
      if (!bot.username || !/^[a-zA-Z0-9_]+$/.test(bot.username)) throw new Error("Invalid bot configuration.");
      const link = createTelegramLinkToken();
      // Upsert a placeholder without replacing an existing connection.
      const { error: insertError } = await admin.from("telegram_connections").upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });
      if (insertError) throw insertError;
      const { data, error } = await admin.from("telegram_connections").update({ link_token_hash: link.hash, link_expires_at: link.expiresAt }).eq("user_id", user.id).is("chat_id", null).select("user_id").maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: "Telegram is already connected. Disconnect it before linking another account." }, { status: 409 });
      return NextResponse.json({ url: "https://t.me/" + bot.username + "?start=" + link.token, expiresAt: link.expiresAt }, { headers: { "Cache-Control": "no-store" } });
    }
    // Atomically reserve one test per minute, across tabs and server instances.
    const cutoff = new Date(Date.now() - 60_000).toISOString();
    const { data, error } = await admin.from("telegram_connections").update({ last_test_at: new Date().toISOString() }).eq("user_id", user.id).not("chat_id", "is", null).or("last_test_at.is.null,last_test_at.lt." + cutoff).select("chat_id").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Connect Telegram first, or wait a minute before sending another test." }, { status: 429 });
    await telegramRequest("sendMessage", { chat_id: data.chat_id, text: "Football Intelligence: your Telegram connection is working. This is a test message requested from your Profile." });
    return NextResponse.json({ success: true, message: "Test message sent. Check Telegram." });
  } catch {
    return NextResponse.json({ error: "Could not complete the Telegram action. Check the connection and try again." }, { status: 502 });
  }
}
