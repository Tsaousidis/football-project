"use client";
import { useRef, useState } from "react";

export function SendTelegramBriefing({ disabled }: { disabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  async function send() {
    if (lock.current || disabled) return;
    lock.current = true; setBusy(true); setMessage(""); setFailed(false);
    try {
      const response = await fetch("/api/telegram/briefing", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not send the briefing.");
      setMessage(data.message);
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Delivery could not be confirmed. Check Telegram before retrying.");
    } finally { lock.current = false; setBusy(false); }
  }
  return <div className="mt-5 rounded-2xl border border-sky-400/20 p-4">
    <button type="button" disabled={disabled || busy} onClick={send} className="rounded-xl border border-sky-400/40 px-4 py-2 text-sm font-semibold text-sky-200 disabled:opacity-50">{busy ? "Sending..." : "Send briefing to Telegram"}</button>
    <p className="mt-2 text-sm text-slate-400">Sends the latest saved research. Connect Telegram in Profile first. No new research is started.</p>
    {message && <p role={failed ? "alert" : "status"} className={"mt-3 text-sm " + (failed ? "text-red-200" : "text-sky-200")}>{message}</p>}
  </div>;
}
