import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { hashTelegramToken, parseTelegramLinkUpdate, verifyTelegramSecret } from "@/lib/telegram";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!verifyTelegramSecret(request.headers.get("x-telegram-bot-api-secret-token"))) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const link = parseTelegramLinkUpdate(body);
  if (!link) return NextResponse.json({ ok: true });
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.rpc("claim_telegram_link", { token_hash: hashTelegramToken(link.token), private_chat_id: link.chatId });
    if (error) throw error;
    // Invalid, expired and replayed links are acknowledged without exposing account details.
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not process update." }, { status: 500 });
  }
}
