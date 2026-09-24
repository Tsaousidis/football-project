"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createBrowserSupabaseClient } from "@/lib/auth";

export default function AuthForm({ initialMode = "signin" }: { initialMode?: "signin" | "signup" }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setMessage(null);
    setIsError(false);
    if (mode === "signup" && password !== confirmation) {
      setIsError(true);
      setMessage("Your passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      const supabase = createBrowserSupabaseClient();
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        router.replace("/dashboard");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: window.location.origin + "/auth/callback?next=/onboarding" },
        });
        if (error) throw error;
        if (data.session) {
          await supabase.auth.signOut();
          throw new Error("Email verification is not configured. Please contact support before signing in.");
        }
        setPassword("");
        setConfirmation("");
        setMessage("Check your inbox for a verification link. If this address is already registered, sign in instead. Check your spam folder too.");
      }
    } catch (error) {
      setIsError(true);
      const code = (error as { code?: string })?.code;
      setMessage(code === "invalid_credentials"
        ? "Incorrect email or password. Please try again."
        : code === "email_not_confirmed"
          ? "Please verify your email using the link in your inbox before signing in."
          : error instanceof Error ? error.message : "Could not complete your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldClass = "mt-2 w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400";
  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-6 py-12">
      <section className="w-full rounded-3xl border border-emerald-500/20 bg-slate-950/80 p-8 shadow-2xl">
        <Link href="/" className="text-sm font-bold uppercase tracking-widest text-emerald-300">Football Intelligence</Link>
        <h1 className="mt-6 text-3xl font-black text-white">{mode === "signin" ? "Welcome back" : "Follow your favourite teams"}</h1>
        <p className="mt-3 text-slate-400">{mode === "signin" ? "Sign in to see your latest football briefing." : "Create your account and verify your email to get started."}</p>
        <div className="mt-6 grid grid-cols-2 gap-2" aria-label="Account access">
          {(["signin", "signup"] as const).map((value) => (
            <button key={value} type="button" disabled={isSubmitting} aria-pressed={mode === value}
              onClick={() => { setMode(value); setMessage(null); setPassword(""); setConfirmation(""); }}
              className={"rounded-xl px-3 py-2 text-sm font-semibold " + (mode === value ? "bg-emerald-500 text-slate-950" : "bg-slate-900 text-slate-300")}>
              {value === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="mt-6">
          <fieldset disabled={isSubmitting} className="space-y-4 disabled:opacity-60">
            <label className="block text-sm text-slate-200">Email address
              <input type="email" name="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} />
            </label>
            <label className="block text-sm text-slate-200">Password
              <input type="password" name="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={mode === "signup" ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} className={fieldClass} />
            </label>
            {mode === "signup" && <>
              <p className="text-xs text-slate-400">Use at least 8 characters.</p>
              <label className="block text-sm text-slate-200">Confirm password
                <input type="password" name="confirmation" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={fieldClass} />
              </label>
            </>}
            <button type="submit" className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-bold text-slate-950 hover:bg-emerald-400">
              {isSubmitting ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </fieldset>
        </form>
        <div className="mt-5 flex flex-wrap gap-4 text-sm text-emerald-300">
          <Link href="/auth/forgot-password" className="underline">Forgot password?</Link>
          <Link href="/auth/resend-verification" className="underline">Resend verification email</Link>
        </div>
        {message && <p role={isError ? "alert" : "status"} className={"mt-5 rounded-xl border p-4 text-sm " + (isError ? "border-red-400/30 text-red-200" : "border-emerald-400/30 text-emerald-200")}>{message}</p>}
      </section>
    </main>
  );
}
