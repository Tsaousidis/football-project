"use client";

import { useEffect, useRef, useState } from "react";

type Connection = { configured: boolean; connected: boolean; connectedAt?: string | null };
export function TelegramSettings() {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/telegram", { cache: "no-store", signal: controller.signal })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; })
      .then((data) => { if (!controller.signal.aborted) setConnection(data); })
      .catch(() => { if (!controller.signal.aborted) setError("Could not load Telegram. Try checking the connection again."); });
    return () => controller.abort();
  }, []);

  async function action(kind: "connect" | "disconnect" | "test" | "check") {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/telegram", kind === "check" ? { cache: "no-store" } : {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: kind }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Telegram request failed.");
      if (kind === "check") {
        setConnection(data);
        if (data.connected) { setLink(null); setMessage("Telegram is connected."); }
        else setMessage("Not connected yet. Open your connection link, press Start in Telegram, then check again. If the link expired, create a new one.");
      } else if (kind === "connect") {
        setLink(data.url); setMessage("This private link expires in 10 minutes. Do not share it. Open Telegram and press Start, then check the connection here.");
      } else {
        setMessage(data.message);
        if (kind === "disconnect") { setLink(null); setConnection((current) => current ? { ...current, connected: false, connectedAt: null } : current); }
      }
    } catch (error) { setError(error instanceof Error ? error.message : "Could not complete the request."); }
    finally { lock.current = false; setBusy(false); }
  }
  const button = "rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-slate-100 disabled:opacity-50";
  return <section className="mt-8 rounded-2xl border border-sky-400/20 bg-slate-900/70 p-5">
    <p className="text-xs uppercase tracking-widest text-sky-300">Telegram</p>
    <h2 className="mt-2 text-xl font-bold text-white">Connect your Telegram</h2>
    <p className="mt-3 text-sm text-slate-300">{!connection ? "Connection status unavailable." : !connection.configured ? "Telegram setup is not complete yet." : connection.connected ? "Connected to your private Telegram chat." : "Connect the bot to your private Telegram chat."}</p>
    <p className="mt-2 text-sm text-slate-400">Connecting does not enable automatic research or briefings. Test messages are sent only when you request them.</p>
    <div className="mt-5 flex flex-wrap gap-3">
      {connection?.configured && !connection.connected && <button disabled={busy} onClick={() => action("connect")} className={button}>{link ? "Create new link" : "Connect Telegram"}</button>}
      {link && <a href={link} target="_blank" rel="noopener noreferrer" className={button}>Open Telegram</a>}
      <button disabled={busy} onClick={() => action("check")} className={button}>{busy ? "Please wait..." : "Check connection"}</button>
      {connection?.connected && <button disabled={busy || !connection.configured} onClick={() => action("test")} className={button}>Send test message</button>}
      {(connection?.connected || link) && <button disabled={busy} onClick={() => action("disconnect")} className={button}>{connection?.connected ? "Disconnect" : "Cancel connection"}</button>}
    </div>
    {message && <p role="status" className="mt-4 text-sm text-sky-200">{message}</p>}
    {error && <p role="alert" className="mt-4 text-sm text-red-200">{error}</p>}
  </section>;
}
