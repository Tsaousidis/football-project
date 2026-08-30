"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Team } from "@/lib/teams";
import { AppNav } from "@/app/components/AppNav";

type SnapshotMatch = {
  opponent?: string;
  competition?: string;
  venue?: string;
  date?: string;
  time?: string;
  status?: string;
  result?: string | null;
};

type SnapshotStanding = {
  position?: number;
  points?: number;
  played?: number;
  goalDifference?: number;
};

type SnapshotTeam = {
  teamName?: string;
  competition?: string;
  nextMatch?: SnapshotMatch | null;
  lastResult?: SnapshotMatch | null;
  currentStanding?: SnapshotStanding | null;
  latestStories?: Array<{
    title?: string;
    summary?: string;
    category?: string;
    importance?: string;
    sourceCount?: number;
    sourceUrls?: string[];
  }>;
};

type DashboardClientProps = {
  selectedTeams: Team[];
  snapshot: {
    generatedAt?: string;
    teams?: SnapshotTeam[];
  } | null;
};

export function DashboardClient({ selectedTeams, snapshot }: DashboardClientProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const snapshotMap = new Map(
    (snapshot?.teams ?? []).map((team) => [team.teamName?.toLowerCase() ?? "", team]),
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Research failed.");
      }

      router.refresh();
    } catch (error) {
      setRefreshError(
        error instanceof Error ? error.message : "Could not refresh the research snapshot.",
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <AppNav />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 md:px-10">
      <section className="rounded-3xl border border-emerald-500/20 bg-slate-950/80 p-8 shadow-2xl shadow-emerald-950/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-300/80">Dashboard</p>
            <h1 className="mt-2 text-3xl font-black text-white md:text-5xl">Your selected teams</h1>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? "Refreshing..." : "Refresh research"}
          </button>
        </div>
      </section>

      {refreshError ? (
        <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {refreshError}
        </div>
      ) : null}

      {snapshot?.teams && snapshot.teams.length > 0 ? (
        <section className="mt-8 rounded-3xl border border-emerald-500/20 bg-slate-900/70 p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-300/80">Latest snapshot</p>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
              Last updated: {snapshot.generatedAt ? new Date(snapshot.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
            </span>
          </div>

          <div className="space-y-4">
            {snapshot.teams.map((team) => (
              <div key={team.teamName} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <h2 className="text-xl font-bold text-white">{team.teamName}</h2>
                <div className="mt-3 space-y-3">
                  {(team.latestStories ?? []).slice(0, 2).map((story) => (
                    <article key={story.title} className="rounded-xl bg-slate-800/80 px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
                        {story.category ? <span>{story.category}</span> : null}
                        {story.importance ? <span className="text-slate-400">{story.importance}</span> : null}
                        {story.sourceCount ? <span className="text-slate-400">{story.sourceCount} sources</span> : null}
                      </div>
                      <h3 className="mt-1 text-sm font-semibold text-white">{story.title}</h3>
                      {story.summary ? <p className="mt-1 text-xs leading-5 text-slate-300">{story.summary}</p> : null}
                      {story.sourceUrls?.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {story.sourceUrls.slice(0, 3).map((sourceUrl) => (
                            <a
                              key={sourceUrl}
                              href={sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-medium text-emerald-300 underline decoration-emerald-500/40 underline-offset-2 hover:text-emerald-200"
                            >
                              Open source
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {selectedTeams.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-white/20 bg-slate-900/60 p-8 text-center text-slate-200">
          No teams selected yet. Head to the onboarding flow to choose your top 3 clubs.
        </div>
      ) : (
        <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {selectedTeams.map((team: Team) => {
            const teamSnapshot = snapshotMap.get(team.name.toLowerCase()) ?? snapshotMap.get(team.shortName.toLowerCase());
            const nextMatch = teamSnapshot?.nextMatch;
            const lastResult = teamSnapshot?.lastResult;
            const standing = teamSnapshot?.currentStanding;

            return (
              <article
                key={team.id}
                className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 shadow-xl shadow-slate-950/30"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{team.country}</p>
                    <h2 className="mt-2 text-2xl font-bold text-white">{team.name}</h2>
                  </div>
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-black text-slate-950"
                    style={{ backgroundColor: team.accent }}
                  >
                    {team.shortName}
                  </span>
                </div>

                <div className="space-y-3 text-sm text-slate-200">
                  <div className="rounded-xl bg-slate-800/80 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span>Next match</span>
                      <strong className="text-emerald-300 text-right">
                        {nextMatch?.status ? nextMatch.status : "TBD"}
                      </strong>
                    </div>
                    {nextMatch?.opponent ? (
                      <div className="mt-2 text-xs text-slate-300">
                        vs {nextMatch.opponent}
                        {nextMatch.date ? ` · ${nextMatch.date}` : ""}
                        {nextMatch.time ? ` · ${nextMatch.time}` : ""}
                      </div>
                    ) : null}
                    {nextMatch?.competition || nextMatch?.venue ? (
                      <div className="mt-1 text-xs text-slate-400">
                        {[nextMatch.competition, nextMatch.venue].filter(Boolean).join(" · ")}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-xl bg-slate-800/80 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span>Last result</span>
                      <strong className="text-right text-slate-100">
                        {lastResult?.result ? lastResult.result : "—"}
                      </strong>
                    </div>
                    {lastResult?.opponent ? (
                      <div className="mt-2 text-xs text-slate-300">
                        vs {lastResult.opponent}
                        {lastResult.date ? ` · ${lastResult.date}` : ""}
                      </div>
                    ) : null}
                    {lastResult?.competition || lastResult?.venue ? (
                      <div className="mt-1 text-xs text-slate-400">
                        {[lastResult.competition, lastResult.venue].filter(Boolean).join(" · ")}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-xl bg-slate-800/80 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span>Standing</span>
                      <strong className="text-right text-slate-100">
                        {standing?.position ? `#${standing.position}` : "—"}
                      </strong>
                    </div>
                    {standing ? (
                      <div className="mt-2 text-xs text-slate-300">
                        {standing.points ?? "—"} pts · {standing.played ?? "—"} played · GD {standing.goalDifference ?? "—"}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
      </main>
    </>
  );
}
