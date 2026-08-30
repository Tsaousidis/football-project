"use client";

import { useState } from "react";

import { AppNav } from "@/app/components/AppNav";

export default function ResearchPage() {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerResearch = async () => {
    setLoading(true);
    setError(null);
    setOutput(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Research failed.");
      }

      setOutput(JSON.stringify(payload.data, null, 2));
    } catch (researchError) {
      setError(
        researchError instanceof Error ? researchError.message : "Research failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppNav />
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 md:px-10">
      <section className="rounded-3xl border border-emerald-500/20 bg-slate-950/80 p-8 shadow-2xl shadow-emerald-950/20">
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-300/80">AI Research</p>
        <h1 className="mt-3 text-4xl font-black text-white">Football snapshot research</h1>
        <p className="mt-3 text-slate-300">
          This endpoint tests the Claude-powered web research layer that collects team matches, standings,
          and story summaries without using a football API.
        </p>

        <button
          type="button"
          onClick={triggerResearch}
          disabled={loading}
          className="mt-6 rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {loading ? "Researching..." : "Run research"}
        </button>
      </section>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {output ? (
        <pre className="mt-8 overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/80 p-5 text-xs text-emerald-100 whitespace-pre-wrap">
          {output}
        </pre>
      ) : null}
      </main>
    </>
  );
}
