"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

import { AppNav } from "@/app/components/AppNav";
import type { Team } from "@/lib/teams";
import { SendTelegramBriefing } from "./SendTelegramBriefing";

type SnapshotMatch = {
  opponent?: string;
  competition?: string;
  venue?: string;
  date?: string;
  time?: string;
  status?: string;
  result?: string | number | Record<string, unknown> | null;
};

type SnapshotStanding = {
  position?: number;
  points?: number;
  played?: number;
  goalDifference?: number;
};

type SnapshotStory = {
  title?: string;
  summary?: string;
  category?: string;
  importance?: string;
  sourceCount?: number;
  sourceUrls?: string[];
};

type SnapshotTeam = {
  teamName?: string;
  competition?: string;
  nextMatch?: SnapshotMatch | null;
  lastResult?: SnapshotMatch | null;
  currentStanding?: SnapshotStanding | null;
  latestStories?: SnapshotStory[];
};

type DashboardClientProps = {
  selectedTeams: Team[];
  snapshotWarning: string | null;
  snapshot: { generatedAt?: string; teams?: SnapshotTeam[] } | null;
};

function formatMatchResult(result: SnapshotMatch["result"]) {
  if (result === null || result === undefined) return "No verified score";
  if (typeof result !== "object") return String(result);
  return Object.entries(result)
    .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
    .join(" · ");
}

function formatSnapshotDate(value?: string) {
  if (!value) return "No snapshot yet";
  if (!Number.isFinite(Date.parse(value))) return "Date unavailable";
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export function DashboardClient({ selectedTeams, snapshot, snapshotWarning }: DashboardClientProps) {
  const router = useRouter();
  const refreshLock = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const snapshotMap = new Map((snapshot?.teams ?? []).map((team) => [team.teamName?.toLowerCase() ?? "", team]));

  const handleRefresh = async () => {
    if (refreshLock.current || !selectedTeams.length) return;
    refreshLock.current = true;
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const response = await fetch("/api/research", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Research failed.");
      router.refresh();
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "Could not refresh the research snapshot.");
    } finally {
      refreshLock.current = false;
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <AppNav />
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 md:px-10">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">Football intelligence</p>
            <p className="mt-2 text-sm text-slate-400">Your selected teams, fixtures, standings, and AI-researched news.</p>
          </div>
          <button type="button" onClick={handleRefresh} disabled={isRefreshing || !selectedTeams.length} className="shrink-0 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60">
            {isRefreshing ? "Refreshing..." : "Refresh research"}
          </button>
        </div>

        {refreshError ? <div className="mt-5 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{refreshError}</div> : null}

        <SendTelegramBriefing disabled={isRefreshing || !snapshot || Boolean(snapshotWarning) || !selectedTeams.length} />
        {snapshotWarning && <p role="alert" className="mt-5 text-amber-200">{snapshotWarning}</p>}
        {!snapshot && !snapshotWarning && selectedTeams.length > 0 && <p className="mt-5 text-slate-300">No research yet. Select Refresh research to create your first briefing.</p>}
        {snapshot && selectedTeams.some((team) => !snapshotMap.has(team.name.toLowerCase())) && <p className="mt-5 text-amber-200">Your team selection has changed. Refresh research to include all selected teams.</p>}
        {isRefreshing && <p role="status" className="mt-4 text-slate-300">Researching your teams. Your previous update remains visible.</p>}
        {selectedTeams.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-white/20 bg-slate-900/60 p-8 text-center text-slate-200">No teams selected yet. Head to the Teams page to choose your clubs.</div>
        ) : (
          <>
            <section className="mt-8">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div><p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">Overview</p><h1 className="mt-2 text-3xl font-black text-white">Your teams</h1></div>
                <p className="text-right text-xs text-slate-500">Snapshot: {formatSnapshotDate(snapshot?.generatedAt)}</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {selectedTeams.map((team) => {
                  const teamSnapshot = snapshotMap.get(team.name.toLowerCase());
                  const nextMatch = teamSnapshot?.nextMatch;
                  const lastResult = teamSnapshot?.lastResult;
                  const standing = teamSnapshot?.currentStanding;
                  return (
                    <article key={team.id} className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/75 shadow-xl shadow-slate-950/30">
                      <header className="flex items-center justify-between border-b border-white/10 p-5">
                        <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">{team.country}</p><h2 className="mt-2 text-2xl font-bold text-white">{team.name}</h2><p className="mt-1 text-xs text-slate-500">{team.competition}</p></div>
                        <span className="flex h-12 w-12 items-center justify-center rounded-full text-xs font-black text-slate-950" style={{ backgroundColor: team.accent }}>{team.shortName}</span>
                      </header>
                      <div className="space-y-3 p-5">
                        <div className="rounded-2xl bg-slate-800/80 p-3"><div className="flex justify-between gap-3 text-xs uppercase tracking-[0.12em] text-slate-400"><span>Next match</span><strong className="text-emerald-300">{nextMatch?.status ?? "TBD"}</strong></div><p className="mt-2 text-sm font-semibold text-white">{nextMatch?.opponent ? `vs ${nextMatch.opponent}` : "No verified fixture"}</p><p className="mt-1 text-xs text-slate-400">{[nextMatch?.date, nextMatch?.time, nextMatch?.venue].filter(Boolean).join(" · ") || "Awaiting verified details"}</p></div>
                        <div className="rounded-2xl bg-slate-800/80 p-3"><div className="flex justify-between gap-3 text-xs uppercase tracking-[0.12em] text-slate-400"><span>Last result</span><strong className="max-w-[60%] text-right text-slate-100">{formatMatchResult(lastResult?.result)}</strong></div><p className="mt-2 text-sm font-semibold text-white">{lastResult?.opponent ? `vs ${lastResult.opponent}` : "No verified result"}</p><p className="mt-1 text-xs text-slate-400">{[lastResult?.date, lastResult?.competition].filter(Boolean).join(" · ") || "Awaiting verified details"}</p></div>
                        <div className="rounded-2xl bg-slate-800/80 p-3"><div className="flex justify-between gap-3 text-xs uppercase tracking-[0.12em] text-slate-400"><span>Standing</span><strong className="text-slate-100">{standing?.position ? `#${standing.position}` : "—"}</strong></div><p className="mt-2 text-xs text-slate-300">{standing ? `${standing.points ?? "—"} pts · ${standing.played ?? "—"} played · GD ${standing.goalDifference ?? "—"}` : "No verified standing"}</p></div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="mt-12 border-t border-white/10 pt-8">
              <div className="mb-5"><p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">Latest coverage</p><h2 className="mt-2 text-3xl font-black text-white">Team news</h2><p className="mt-2 text-sm text-slate-400">Recent stories found during the latest web research.</p></div>
              <div className="grid gap-5 lg:grid-cols-2">
                {selectedTeams.map((team) => {
                  const teamSnapshot = snapshotMap.get(team.name.toLowerCase()) ?? snapshotMap.get(team.shortName.toLowerCase());
                  const stories = teamSnapshot?.latestStories ?? [];
                  return <article key={team.id} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5"><div className="flex items-center justify-between gap-3"><h3 className="text-xl font-bold text-white">{team.name}</h3><span className="text-xs text-slate-500">{stories.length} stories</span></div><div className="mt-4 space-y-4">{stories.slice(0, 3).map((story, index) => <article key={story.title ?? `story-${index}`} className="border-l-2 border-emerald-400/50 pl-4"><div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-300/80">{story.category ? <span>{story.category}</span> : null}{story.importance ? <span className="text-slate-500">{story.importance}</span> : null}{story.sourceCount ? <span className="text-slate-500">{story.sourceCount} sources</span> : null}</div><h4 className="mt-1 text-sm font-semibold leading-5 text-white">{story.title ?? "Untitled story"}</h4>{story.summary ? <p className="mt-1 text-sm leading-6 text-slate-400">{story.summary}</p> : null}{story.sourceUrls?.length ? <div className="mt-2 flex flex-wrap gap-3">{story.sourceUrls.slice(0, 3).map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-emerald-300 underline decoration-emerald-500/40 underline-offset-2 hover:text-emerald-200">Open source</a>)}</div> : null}</article>)}{!stories.length ? <p className="rounded-2xl bg-slate-900/70 p-4 text-sm text-slate-500">No verified recent stories found.</p> : null}</div></article>;
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
