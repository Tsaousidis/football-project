import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { TEAM_CATALOG, type Team } from "@/lib/teams";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const [{ data: selections, error }, { data: snapshotData }] = await Promise.all([
    supabase.from("user_teams").select("team_id").eq("user_id", user.id),
    supabase
      .from("dashboard_snapshots")
      .select("data, generated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const selectedTeamIds = (selections ?? []).map((row) => row.team_id);
  const selectedTeams = TEAM_CATALOG.filter((team) =>
    selectedTeamIds.includes(team.id),
  );

  const snapshot = snapshotData?.data as {
    generatedAt?: string;
    teams?: Array<{ teamName?: string; latestStories?: Array<{ title?: string }> }>;
  } | null;

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
            Last updated: {snapshot?.generatedAt ? new Date(snapshot.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
          </div>
        </div>
      </section>

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-red-200">
          Could not load your team selections from Supabase.
        </div>
      ) : selectedTeams.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-white/20 bg-slate-900/60 p-8 text-center text-slate-200">
          No teams selected yet. Head to the onboarding flow to choose your top 3 clubs.
        </div>
      ) : (
        <>
          {snapshot?.teams && snapshot.teams.length > 0 ? (
            <section className="mt-8 rounded-3xl border border-emerald-500/20 bg-slate-900/70 p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-300/80">Latest snapshot</p>
              <div className="mt-4 space-y-4">
                {snapshot.teams.map((team) => (
                  <div key={team.teamName} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <h2 className="text-xl font-bold text-white">{team.teamName}</h2>
                    <ul className="mt-3 space-y-2 text-sm text-slate-200">
                      {(team.latestStories ?? []).slice(0, 2).map((story) => (
                        <li key={story.title} className="rounded-xl bg-slate-800/80 px-3 py-2">
                          {story.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

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
        </>
      )}
    </main>
  );
}
