"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { createBrowserSupabaseClient } from "@/lib/auth";

export function EmailRequestForm({ kind }: { kind: "verification" | "recovery" }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const recovery = kind === "recovery";
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || cooldown > 0) return;
    setBusy(true); setMessage(""); setFailed(false);
    try {
      const supabase = createBrowserSupabaseClient();
      const callback = window.location.origin + "/auth/callback?next=" + (recovery ? "/auth/reset-password" : "/onboarding");
      const { error } = recovery
        ? await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: callback })
        : await supabase.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: callback } });
      if (error) throw error;
      setCooldown(60);
      setMessage(recovery
        ? "If an account exists for this email, you will receive a password reset link. Check your inbox and spam folder."
        : "If this email has an account awaiting verification, you will receive a new verification link. Check your inbox and spam folder.");
    } catch (error) {
      setFailed(true);
      const status = (error as { status?: number })?.status;
      if (status === 429) setCooldown(60);
      setMessage(status === 429 ? "Too many requests. Please wait before trying again." : "We could not send the email. Please try again later.");
    } finally { setBusy(false); }
  }

  return <main className="mx-auto flex min-h-screen max-w-lg items-center px-6 py-12">
    <section className="w-full rounded-3xl border border-emerald-500/20 bg-slate-950/80 p-8">
      <h1 className="text-3xl font-black text-white">{recovery ? "Forgot your password?" : "Verify your email"}</h1>
      <p className="mt-3 text-slate-400">{recovery ? "Enter your account email to request a password reset link." : "Enter the email you used to create your account to request a new verification link."}</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm text-slate-200">Email address
          <input type="email" name="email" autoComplete="email" required disabled={busy} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-white" />
        </label>
        <button disabled={busy || cooldown > 0} className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-bold text-slate-950 disabled:opacity-50">
          {busy ? "Sending..." : cooldown > 0 ? "Try again in " + cooldown + "s" : recovery ? "Send reset link" : "Resend verification email"}
        </button>
      </form>
      {message && <p role={failed ? "alert" : "status"} className={"mt-5 text-sm " + (failed ? "text-red-200" : "text-emerald-200")}>{message}</p>}
      <Link href="/auth/login" className="mt-6 inline-block text-sm text-emerald-300 underline">Back to sign in</Link>
    </section>
  </main>;
}
