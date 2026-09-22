"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createBrowserSupabaseClient } from "@/lib/auth";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || done) return;
    setError("");
    if (password.length < 8) { setError("Use at least 8 characters."); return; }
    if (password !== confirmation) { setError("Your passwords do not match."); return; }
    setBusy(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data: { user }, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !user) { setError("Your session has expired. Please request a new reset link."); return; }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true); setPassword(""); setConfirmation("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not update your password. Please try again.");
    } finally { setBusy(false); }
  }
  return <main className="mx-auto flex min-h-screen max-w-lg items-center px-6 py-12">
    <section className="w-full rounded-3xl border border-emerald-500/20 bg-slate-950/80 p-8">
      <h1 className="text-3xl font-black text-white">{done ? "Password updated" : "Choose a new password"}</h1>
      {done ? <>
        <p role="status" className="mt-4 text-emerald-200">Your new password has been saved. You can use it the next time you sign in.</p>
        <Link href="/dashboard" className="mt-6 inline-block text-emerald-300 underline">Continue to dashboard</Link>
      </> : <>
        <p className="mt-3 text-slate-400">Use at least 8 characters for your new password.</p>
        <form onSubmit={submit} className="mt-6">
          <fieldset disabled={busy} className="space-y-4">
            <label className="block text-sm text-slate-200">New password
              <input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-white" />
            </label>
            <label className="block text-sm text-slate-200">Confirm new password
              <input type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-white" />
            </label>
            <button className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-bold text-slate-950 disabled:opacity-50">{busy ? "Saving..." : "Update password"}</button>
          </fieldset>
        </form>
        {error && <p role="alert" className="mt-4 text-sm text-red-200">{error}</p>}
        <Link href="/auth/forgot-password" className="mt-6 inline-block text-sm text-emerald-300 underline">Request a new reset link</Link>
      </>}
    </section>
  </main>;
}
