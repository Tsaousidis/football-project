import { validateResearchPayload, type FootballResearchPayload } from "@/lib/research-payload";
import { redirect } from "next/navigation";

import { DashboardClient } from "./DashboardClient";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { TEAM_CATALOG } from "@/lib/teams";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const [{ data: selections, error }, { data: snapshotData, error: snapshotError }] = await Promise.all([
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

  let snapshot: FootballResearchPayload | null = null;
  let snapshotWarning = snapshotError ? "Could not load your saved research. Please reload the page." : null;
  if (snapshotData && !snapshotError) {
    try {
      snapshot = validateResearchPayload(snapshotData.data, snapshotData.data.teams.map((team: { teamName: string }) => team.teamName));
      snapshot.generatedAt = snapshotData.generated_at;
    } catch {
      snapshotWarning = "Your saved research could not be displayed. Refresh research to create a new update.";
    }
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 md:px-10">
        <div className="mt-8 rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-red-200">
          Could not load your team selections from Supabase.
        </div>
      </main>
    );
  }

  return <DashboardClient selectedTeams={selectedTeams} snapshot={snapshot} snapshotWarning={snapshotWarning} />;
}
