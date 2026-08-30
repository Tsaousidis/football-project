"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/auth";
import type { Team } from "@/lib/teams";

const STORAGE_KEY = "football-dashboard-selected-teams";

export default function OnboardingPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>("");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function loadData() {
      const { data: authData } = await supabase.auth.getSession();

      if (!authData.session) {
        router.replace("/auth/login");
        return;
      }

      setAuthReady(true);

      const response = await fetch("/api/teams");
      const payload = await response.json();
      const availableTeams = payload.teams ?? [];
      setTeams(availableTeams);

      if (availableTeams.length > 0) {
        setSelectedLeague(availableTeams[0].league);
      }
    }

    loadData();
  }, [router]);

  const leagueOptions = Array.from(new Set(teams.map((team) => team.league))).sort();
  const visibleTeams = selectedLeague
    ? teams.filter((team) => team.league === selectedLeague)
    : [];

  const toggleTeam = (teamId: string) => {
    setStatus(null);
    setSelectedTeamIds((current) => {
      if (current.includes(teamId)) {
        return current.filter((id) => id !== teamId);
      }

      if (current.length >= 3) {
        setStatus("You can select up to 3 teams only.");
        return current;
      }

      return [...current, teamId];
    });
  };

  const saveSelection = async () => {
    if (selectedTeamIds.length === 0) {
      setStatus("Choose at least one team to continue.");
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamIds: selectedTeamIds }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save selection.");
      }

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedTeamIds));
      router.push("/dashboard");
    } catch (submitError) {
      setStatus(
        submitError instanceof Error ? submitError.message : "Could not save selection.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!authReady) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-12">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-slate-200">
          Checking your Supabase session...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 md:px-10">
      <section className="rounded-3xl border border-emerald-500/20 bg-slate-950/80 p-8 shadow-2xl shadow-emerald-950/20">
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-300/80">Onboarding</p>
        <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">Choose your clubs</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Start by choosing the league you follow, then pick the teams you want the AI to track.
          You can save up to 3 clubs in total.
        </p>
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-slate-900/70 p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white">Select a league</h2>
          <span className="text-sm text-slate-400">{leagueOptions.length} leagues available</span>
        </div>

        <div className="flex flex-wrap gap-3">
          {leagueOptions.map((league) => {
            const isActive = selectedLeague === league;

            return (
              <button
                key={league}
                type="button"
                onClick={() => setSelectedLeague(league)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-emerald-400 bg-emerald-500/15 text-emerald-100"
                    : "border-white/10 bg-slate-950 text-slate-300 hover:border-emerald-400/50"
                }`}
              >
                {league}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white">{selectedLeague}</h2>
          <span className="text-sm text-slate-400">
            {visibleTeams.length} teams in this league
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleTeams.map((team) => {
            const isSelected = selectedTeamIds.includes(team.id);

            return (
              <button
                key={team.id}
                type="button"
                onClick={() => toggleTeam(team.id)}
                className={`rounded-3xl border p-5 text-left transition-all ${
                  isSelected
                    ? "border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-950/30"
                    : "border-white/10 bg-slate-900/70 hover:border-emerald-400/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{team.country}</p>
                    <h3 className="mt-2 text-2xl font-bold text-white">{team.name}</h3>
                  </div>
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-black text-slate-950"
                    style={{ backgroundColor: team.accent }}
                  >
                    {team.shortName}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-slate-300">{team.competition}</span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-bold ${
                      isSelected ? "bg-emerald-400 text-slate-950" : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {isSelected ? "Selected" : "Tap to select"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {status ? (
        <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {status}
        </div>
      ) : null}

      <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-4">
        <div className="text-sm text-slate-300">
          {selectedTeamIds.length}/3 teams selected
        </div>

        <button
          type="button"
          onClick={saveSelection}
          disabled={isSaving || selectedTeamIds.length === 0}
          className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {isSaving ? "Saving..." : "Continue"}
        </button>
      </div>
    </main>
  );
}
