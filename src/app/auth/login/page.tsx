"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/auth";

const supabase = createBrowserSupabaseClient();

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const handlePasswordSignIn = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setMessageType("success");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error) {
        router.push("/onboarding");
        return;
      }

      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes("invalid login credentials") || errorMessage.includes("user not found")) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
          },
        });

        if (signUpError) {
          const signUpMessage = signUpError.message.toLowerCase();

          if (signUpMessage.includes("already")) {
            setMessage(
              "This account already exists. Check your email for confirmation, then try signing in again.",
            );
            setMessageType("error");
            return;
          }

          throw signUpError;
        }

        if (signUpData.user && !signUpData.session) {
          setMessage(
            "Account created successfully. Please confirm your email, then sign in again.",
          );
          setMessageType("success");
          return;
        }

        setMessage("Account created successfully. Please sign in again.");
        setMessageType("success");
        return;
      }

      if (errorMessage.includes("email not confirmed") || errorMessage.includes("confirm your email")) {
        setMessage("Your email is not confirmed yet. Please check your inbox and confirm it before signing in.");
        setMessageType("error");
        return;
      }

      throw error;
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not sign in with email and password.",
      );
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLink = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setMessageType("success");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });

      if (error) {
        throw error;
      }

      setMessage("Check your email for the sign-in link.");
      setMessageType("success");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not send the magic link.",
      );
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-6 py-12">
      <div className="w-full rounded-3xl border border-emerald-500/20 bg-slate-950/80 p-8 shadow-2xl shadow-emerald-950/20">
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-300/80">Authentication</p>
        <h1 className="mt-3 text-4xl font-black text-white">Sign in</h1>
        <p className="mt-3 text-slate-300">
          Use email + password for reliable local testing, or the magic link if your Supabase setup is already working.
        </p>

        <div className="mt-6 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-emerald-400"
          />

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-emerald-400"
          />

          <button
            type="button"
            onClick={handlePasswordSignIn}
            disabled={isSubmitting || !email.trim() || !password.trim()}
            className="w-full rounded-full bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {isSubmitting ? "Signing in..." : "Sign in with email + password"}
          </button>

          <button
            type="button"
            onClick={handleMagicLink}
            disabled={isSubmitting || !email.trim()}
            className="w-full rounded-full border border-emerald-400/40 bg-slate-900 px-6 py-3 font-bold text-emerald-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-400"
          >
            {isSubmitting ? "Sending link..." : "Send magic link"}
          </button>
        </div>

        {message ? (
          <div
            className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
              messageType === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                : "border-red-500/40 bg-red-500/10 text-red-200"
            }`}
          >
            {message}
          </div>
        ) : null}
      </div>
    </main>
  );
}
