export type MatchSummary = {
  opponent: string;
  competition: string;
  venue: "Home" | "Away" | "Neutral";
  date: string;
  time: string;
  status: "scheduled" | "finished" | "postponed";
  result?: string | number | Record<string, unknown>;
};

export type StandingSummary = {
  position: number;
  points: number;
  played: number;
  goalDifference: number;
};

export type StorySummary = {
  title: string;
  summary: string;
  category: string;
  importance: "High" | "Medium" | "Normal";
  sourceCount: number;
  sourceUrls: string[];
};

export type TeamResearch = {
  teamName: string;
  competition: string;
  nextMatch: MatchSummary | null;
  lastResult: MatchSummary | null;
  currentStanding: StandingSummary | null;
  latestStories: StorySummary[];
};

export type FootballResearchPayload = {
  generatedAt: string;
  teams: TeamResearch[];
};


function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid research object.");
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid research text.");
  return value.trim();
}
function integer(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) throw new Error("Invalid research number.");
  return value;
}
export function safeSourceUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
function match(value: unknown): MatchSummary | null {
  if (value == null) return null;
  const data = object(value);
  const venue = text(data.venue);
  const status = text(data.status);
  if (!["Home", "Away", "Neutral"].includes(venue) || !["scheduled", "finished", "postponed"].includes(status)) throw new Error("Invalid match details.");
  const date = text(data.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error("Invalid match date.");
  const result = data.result;
  if (result != null && typeof result !== "string" && typeof result !== "number") throw new Error("Invalid match result.");
  return { opponent: text(data.opponent), competition: text(data.competition), venue: venue as MatchSummary["venue"], date, time: text(data.time ?? ""), status: status as MatchSummary["status"], ...(result == null ? {} : { result }) };
}
export function validateResearchPayload(value: unknown, expectedNames: string[]): FootballResearchPayload {
  const data = object(value);
  if (!Array.isArray(data.teams) || !data.teams.length) throw new Error("Research did not include any teams.");
  const expected = new Map(expectedNames.map((name) => [name.trim().toLowerCase(), name]));
  const seen = new Set<string>();
  const teams = data.teams.map((value): TeamResearch => {
    const team = object(value);
    const key = text(team.teamName).toLowerCase();
    const name = expected.get(key);
    if (!name || seen.has(key)) throw new Error("Research returned unexpected or duplicate teams.");
    seen.add(key);
    let standing: StandingSummary | null = null;
    if (team.currentStanding != null) {
      const row = object(team.currentStanding);
      standing = { position: integer(row.position), points: integer(row.points), played: integer(row.played), goalDifference: integer(row.goalDifference) };
      if (standing.position < 1 || standing.played < 0) throw new Error("Invalid standing.");
    }
    if (!Array.isArray(team.latestStories)) throw new Error("Invalid stories.");
    const stories = team.latestStories.slice(0, 3).map((value): StorySummary => {
      const story = object(value);
      if (!Array.isArray(story.sourceUrls)) throw new Error("Invalid story sources.");
      const urls = [...new Set(story.sourceUrls.map(safeSourceUrl).filter((url): url is string => url !== null))];
      return { title: text(story.title), summary: text(story.summary), category: text(story.category), importance: story.importance === "High" || story.importance === "Medium" ? story.importance : "Normal", sourceCount: urls.length, sourceUrls: urls };
    });
    return { teamName: name, competition: text(team.competition), nextMatch: match(team.nextMatch), lastResult: match(team.lastResult), currentStanding: standing, latestStories: stories };
  });
  if (seen.size !== expected.size) throw new Error("Research is missing one or more selected teams.");
  return { generatedAt: text(data.generatedAt), teams };
}
export function parseResearchResponse(content: string, expectedNames: string[]): FootballResearchPayload {
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let value: unknown;
  try { value = JSON.parse(cleaned); } catch { throw new Error("Research returned invalid JSON. Please try again."); }
  return validateResearchPayload({ ...object(value), generatedAt: new Date().toISOString() }, expectedNames);
}
