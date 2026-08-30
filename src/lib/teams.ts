export type Team = {
  id: string;
  name: string;
  league: string;
  competition: string;
  country: string;
  shortName: string;
  accent: string;
};

export const TEAM_CATALOG: Team[] = [
  { id: "paok", name: "PAOK", league: "Super League", competition: "Super League", country: "Greece", shortName: "PAOK", accent: "#1e3a8a" },
  { id: "aek", name: "AEK Athens", league: "Super League", competition: "Super League", country: "Greece", shortName: "AEK", accent: "#0ea5e9" },
  { id: "olympiacos", name: "Olympiacos", league: "Super League", competition: "Super League", country: "Greece", shortName: "OLY", accent: "#f59e0b" },
  { id: "panathinaikos", name: "Panathinaikos", league: "Super League", competition: "Super League", country: "Greece", shortName: "PAN", accent: "#22c55e" },

  { id: "liverpool", name: "Liverpool", league: "Premier League", competition: "Premier League", country: "England", shortName: "LIV", accent: "#c8102e" },
  { id: "arsenal", name: "Arsenal", league: "Premier League", competition: "Premier League", country: "England", shortName: "ARS", accent: "#ef4444" },
  { id: "chelsea", name: "Chelsea", league: "Premier League", competition: "Premier League", country: "England", shortName: "CHE", accent: "#1d4ed8" },
  { id: "man-city", name: "Manchester City", league: "Premier League", competition: "Premier League", country: "England", shortName: "MCI", accent: "#6ee7b7" },

  { id: "borussia-dortmund", name: "Borussia Dortmund", league: "Bundesliga", competition: "Bundesliga", country: "Germany", shortName: "BVB", accent: "#f3b30d" },
  { id: "bayern-munich", name: "Bayern Munich", league: "Bundesliga", competition: "Bundesliga", country: "Germany", shortName: "BAY", accent: "#e11d48" },
  { id: "rb-leipzig", name: "RB Leipzig", league: "Bundesliga", competition: "Bundesliga", country: "Germany", shortName: "RBL", accent: "#f97316" },
  { id: "bayer-leverkusen", name: "Bayer Leverkusen", league: "Bundesliga", competition: "Bundesliga", country: "Germany", shortName: "LEV", accent: "#84cc16" },

  { id: "real-madrid", name: "Real Madrid", league: "LaLiga", competition: "LaLiga", country: "Spain", shortName: "RMA", accent: "#f1f5f9" },
  { id: "barcelona", name: "Barcelona", league: "LaLiga", competition: "LaLiga", country: "Spain", shortName: "BAR", accent: "#0f766e" },
  { id: "atletico-madrid", name: "Atletico Madrid", league: "LaLiga", competition: "LaLiga", country: "Spain", shortName: "ATM", accent: "#f43f5e" },
  { id: "real-sociedad", name: "Real Sociedad", league: "LaLiga", competition: "LaLiga", country: "Spain", shortName: "RSO", accent: "#facc15" },

  { id: "inter", name: "Inter Milan", league: "Serie A", competition: "Serie A", country: "Italy", shortName: "INT", accent: "#0f172a" },
  { id: "juventus", name: "Juventus", league: "Serie A", competition: "Serie A", country: "Italy", shortName: "JUV", accent: "#f8fafc" },
  { id: "ac-milan", name: "AC Milan", league: "Serie A", competition: "Serie A", country: "Italy", shortName: "MIL", accent: "#dc2626" },
  { id: "napoli", name: "Napoli", league: "Serie A", competition: "Serie A", country: "Italy", shortName: "NAP", accent: "#3b82f6" },

  { id: "benfica", name: "Benfica", league: "Primeira Liga", competition: "Primeira Liga", country: "Portugal", shortName: "BEN", accent: "#e11d48" },
  { id: "porto", name: "Porto", league: "Primeira Liga", competition: "Primeira Liga", country: "Portugal", shortName: "POR", accent: "#fbbf24" },
  { id: "sporting-cp", name: "Sporting CP", league: "Primeira Liga", competition: "Primeira Liga", country: "Portugal", shortName: "SPO", accent: "#22c55e" },
  { id: "braga", name: "Braga", league: "Primeira Liga", competition: "Primeira Liga", country: "Portugal", shortName: "BRA", accent: "#f97316" },
];

export function validateTeamSelection(teamIds: string[]) {
  const unique = [...new Set(teamIds)];
  const validIds = new Set(TEAM_CATALOG.map((team) => team.id));
  const normalized = unique.filter((id) => validIds.has(id)).slice(0, 3);

  return normalized;
}
