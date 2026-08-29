"use client";

import { useEffect, useState } from "react";

import type { Team } from "@/lib/teams";
import { TEAM_CATALOG } from "@/lib/teams";

const STORAGE_KEY = "football-dashboard-selected-teams";

export default function DashboardPage() {
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as string[];
        setSelectedTeamIds(parsed);
      } catch {
        setSelectedTeamIds([]);
      }
    }

    setIsLoaded(true);
  }, []);

  const selectedTeams = TEAM_CATALOG.filter((team) =>
    selectedTeamIds.includes(team.id),
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 md:px-10">
      <section className="rounded-3xl border border-emerald-500/20 bg-slate-950/80 p-8 shadow-2xl shadow-emerald-950/20">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-300/80">Dashboard</p>
            <h1 className="mt-2 text-3xl font-black text-white md:text-5xl">
              Your selected teams
            </h1>
          </div>

          <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
            Last updated: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </section>

      {!isLoaded ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-slate-200">
          Loading your team selections...
        </div>
      ) : selectedTeams.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-white/20 bg-slate-900/60 p-8 text-center text-slate-200">
          No teams selected yet. Head to the onboarding flow to choose your top 3 clubs.
        </div>
      ) : (
        <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {selectedTeams.map((team: Team) => (
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
                <div className="flex items-center justify-between rounded-xl bg-slate-800/80 px-3 py-2">
                  <span>Next match</span>
                  <strong className="text-emerald-300">TBD</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-800/80 px-3 py-2">
                  <span>Last result</span>
                  <strong>—</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-800/80 px-3 py-2">
                  <span>Standing</span>
                  <strong>—</strong>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
