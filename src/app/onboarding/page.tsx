"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AppNav } from "@/app/components/AppNav";
import { createBrowserSupabaseClient } from "@/lib/auth";
import type { Team } from "@/lib/teams";

const STORAGE_KEY = "football-dashboard-selected-teams";

export default function OnboardingPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedLeague, setSelectedLeague] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [flyingTeam, setFlyingTeam] = useState<{ team: Team; startX: number; startY: number; targetX: number; targetY: number } | null>(null);
  const shortlistRef = useRef<HTMLElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    async function loadData() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/auth/login");
        return;
      }
      const response = await fetch("/api/teams");
      const payload = await response.json();
      const availableTeams = payload.teams ?? [];
      setTeams(availableTeams);
      setSelectedLeague(availableTeams[0]?.league ?? "");
      setAuthReady(true);
    }
    loadData();
  }, [router]);

  const leagueOptions = useMemo(() => Array.from(new Set(teams.map((team) => team.league))).sort(), [teams]);
  const visibleTeams = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return teams.filter((team) => team.league === selectedLeague && (!query || team.name.toLowerCase().includes(query)));
  }, [searchQuery, selectedLeague, teams]);
  const selectedTeams = selectedTeamIds.map((id) => teams.find((team) => team.id === id)).filter((team): team is Team => Boolean(team));

  const toggleTeam = (teamId: string) => {
    setStatus(null);
    setSelectedTeamIds((current) => {
      if (current.includes(teamId)) return current.filter((id) => id !== teamId);
      if (current.length >= 3) {
        setStatus("You can select up to 3 teams only.");
        return current;
      }
      return [...current, teamId];
    });
  };

  const handleTeamClick = (event: React.MouseEvent<HTMLButtonElement>, team: Team) => {
    if (selectedTeamIds.includes(team.id)) {
      toggleTeam(team.id);
      return;
    }

    if (selectedTeamIds.length >= 3 || flyingTeam) {
      setStatus("You can select up to 3 teams only.");
      return;
    }

    const source = event.currentTarget.getBoundingClientRect();
    const target = shortlistRef.current?.getBoundingClientRect();

    if (!target) {
      toggleTeam(team.id);
      return;
    }

    setStatus(null);
    setFlyingTeam({
      team,
      startX: source.left + source.width / 2 - 32,
      startY: source.top + source.height / 2 - 32,
      targetX: target.left + 32,
      targetY: target.top + 105 + selectedTeamIds.length * 78,
    });

  };

  const finishTeamFlight = () => {
    if (!flyingTeam) {
      return;
    }

    setSelectedTeamIds((current) => current.includes(flyingTeam.team.id) ? current : [...current, flyingTeam.team.id]);
    setFlyingTeam(null);
  };

  const saveSelection = async () => {
    if (!selectedTeamIds.length) {
      setStatus("Choose at least one team to continue.");
      return;
    }
    setIsSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamIds: selectedTeamIds }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not save selection.");
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedTeamIds));
      router.push("/dashboard");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save selection.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!authReady) {
    return <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-12"><div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-slate-200">Checking your Supabase session...</div></main>;
  }

  return (
    <>
      <AppNav />
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 md:px-10">
        <header className="mb-8">
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300/80">Team setup</p>
          <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">Build your shortlist</h1>
          <p className="mt-3 max-w-2xl text-slate-300">Explore a league, search its clubs, and add up to three teams to your dashboard.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <section className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-950/80 shadow-2xl shadow-emerald-950/20 lg:flex lg:h-[42rem] lg:flex-col">
            <div className="border-b border-white/10 p-5">
              <div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Available clubs</p><h2 className="mt-2 text-2xl font-bold text-white">Choose a league</h2></div><span className="text-sm text-emerald-300">{teams.length} teams</span></div>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {leagueOptions.map((league) => <button key={league} type="button" onClick={() => { setSelectedLeague(league); setSearchQuery(""); }} className={`min-w-0 rounded-xl border px-2 py-2 text-xs font-semibold transition ${selectedLeague === league ? "border-emerald-400 bg-emerald-500/15 text-emerald-100" : "border-white/10 bg-slate-900 text-slate-400 hover:border-emerald-400/50 hover:text-white"}`}>{league}</button>)}
              </div>
              <label className="mt-4 block"><span className="sr-only">Search teams in {selectedLeague}</span><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={`Search ${selectedLeague} teams...`} className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/70" /></label>
            </div>
            <div className="max-h-[31rem] overflow-y-auto p-4 lg:min-h-0 lg:flex-1"><div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-500"><span>{selectedLeague}</span><span>{visibleTeams.length} matches</span></div><div className="space-y-2">
              {visibleTeams.map((team) => { const isSelected = selectedTeamIds.includes(team.id); return <button key={team.id} type="button" aria-pressed={isSelected} onClick={(event) => handleTeamClick(event, team)} className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${isSelected ? "border-emerald-400/60 bg-emerald-500/10" : "border-white/10 bg-slate-900/70 hover:border-emerald-400/50 hover:bg-slate-800"}`}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-slate-950" style={{ backgroundColor: team.accent }}>{team.shortName}</span><span className="min-w-0 flex-1"><span className="block truncate font-semibold text-white">{team.name}</span><span className="mt-1 block text-xs text-slate-400">{team.country}</span></span><span className={`text-xs font-bold ${isSelected ? "text-emerald-300" : "text-slate-500 group-hover:text-slate-300"}`}>{isSelected ? "Added" : "Add"}</span></button>; })}
              {!visibleTeams.length ? <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">No teams match your search.</p> : null}
            </div></div>
          </section>

          <section ref={shortlistRef} className="rounded-3xl border border-emerald-500/20 bg-slate-900/70 p-5 shadow-2xl shadow-emerald-950/20 lg:flex lg:h-[42rem] lg:flex-col lg:sticky lg:top-6">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">Your shortlist</p><h2 className="mt-2 text-2xl font-bold text-white">Selected teams</h2></div><span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-bold text-emerald-200">{selectedTeams.length}/3</span></div>
            <div className="mt-5 min-h-[25rem] space-y-3 rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-4 lg:min-h-0 lg:flex-1">
              {!selectedTeams.length ? <div className="flex min-h-[22rem] items-center justify-center text-center text-sm leading-6 text-slate-500">Your selected team badges will appear here.</div> : selectedTeams.map((team) => <button key={team.id} type="button" onClick={() => toggleTeam(team.id)} className="group flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/90 p-4 text-left shadow-lg shadow-black/20"><span className="team-badge-float flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-sm font-black text-slate-950" style={{ backgroundColor: team.accent }}>{team.shortName}</span><span className="min-w-0 flex-1"><span className="block truncate text-lg font-bold text-white">{team.name}</span><span className="mt-1 block text-xs uppercase tracking-[0.15em] text-slate-400">{team.league}</span></span><span className="text-xs text-slate-500 transition group-hover:text-red-300">Remove</span></button>)}
            </div>
            {status ? <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{status}</div> : null}
            <button type="button" onClick={saveSelection} disabled={isSaving || !selectedTeamIds.length} className="mt-5 w-full rounded-2xl bg-emerald-500 px-5 py-3.5 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">{isSaving ? "Saving teams..." : "Save teams"}</button>
          </section>
        </div>
        {flyingTeam ? <span onAnimationEnd={finishTeamFlight} className="team-badge-flight flex h-16 w-16 items-center justify-center rounded-full text-sm font-black text-slate-950" style={{ backgroundColor: flyingTeam.team.accent, left: flyingTeam.startX, top: flyingTeam.startY, "--flight-x": `${flyingTeam.targetX - flyingTeam.startX}px`, "--flight-y": `${flyingTeam.targetY - flyingTeam.startY}px` } as React.CSSProperties}>{flyingTeam.team.shortName}</span> : null}
      </main>
    </>
  );
}
