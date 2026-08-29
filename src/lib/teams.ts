export type Team = {
  id: string;
  name: string;
  competition: string;
  country: string;
  shortName: string;
  accent: string;
};

export const TEAM_CATALOG: Team[] = [
  { id: "paok", name: "PAOK", competition: "Super League", country: "Greece", shortName: "PAOK", accent: "#1e3a8a" },
  { id: "liverpool", name: "Liverpool", competition: "Premier League", country: "England", shortName: "LIV", accent: "#c8102e" },
  { id: "borussia-dortmund", name: "Borussia Dortmund", competition: "Bundesliga", country: "Germany", shortName: "BVB", accent: "#f3b30d" },
  { id: "arsenal", name: "Arsenal", competition: "Premier League", country: "England", shortName: "ARS", accent: "#ef4444" },
  { id: "real-madrid", name: "Real Madrid", competition: "LaLiga", country: "Spain", shortName: "RMA", accent: "#f1f5f9" },
  { id: "barcelona", name: "Barcelona", competition: "LaLiga", country: "Spain", shortName: "BAR", accent: "#0f766e" },
  { id: "inter", name: "Inter Milan", competition: "Serie A", country: "Italy", shortName: "INT", accent: "#0f172a" },
  { id: "benfica", name: "Benfica", competition: "Primeira Liga", country: "Portugal", shortName: "BEN", accent: "#e11d48" },
];

export function validateTeamSelection(teamIds: string[]) {
  const unique = [...new Set(teamIds)];
  const validIds = new Set(TEAM_CATALOG.map((team) => team.id));
  const normalized = unique.filter((id) => validIds.has(id)).slice(0, 3);

  return normalized;
}
