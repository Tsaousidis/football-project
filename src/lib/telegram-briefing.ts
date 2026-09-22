import type { FootballResearchPayload, MatchSummary } from "./research-payload";

function short(value: string, limit: number) {
  const chars = Array.from(value.replace(/\s+/g, " ").trim());
  return chars.length > limit ? chars.slice(0, limit - 1).join("") + "?" : chars.join("");
}
function matchLine(match: MatchSummary | null) {
  if (!match) return "Details unavailable";
  const score = typeof match.result === "string" || typeof match.result === "number" ? " | " + short(String(match.result), 40) : "";
  return short(match.opponent, 80) + " | " + match.date + " " + short(match.time, 30) + " | " + match.venue + " | " + match.status + score;
}
export function formatTelegramBriefing(payload: FootballResearchPayload): string[] {
  const date = new Date(payload.generatedAt);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid snapshot date.");
  if (!payload.teams.length || payload.teams.length > 3) throw new Error("Invalid team count.");
  return payload.teams.map((team, index) => {
    const standing = team.currentStanding;
    const lines = ["Football Intelligence (" + (index + 1) + "/" + payload.teams.length + ")",
      "Research: " + date.toISOString().replace("T", " ").replace(".000Z", " UTC"),
      short(team.teamName, 100) + " ? " + short(team.competition, 100), "",
      "Next match: " + matchLine(team.nextMatch), "Last result: " + matchLine(team.lastResult),
      "Standing: " + (standing ? "#" + standing.position + " | " + standing.points + " pts | " + standing.played + " played | GD " + standing.goalDifference : "Unavailable"), "", "Team news"];
    for (const story of team.latestStories.slice(0, 3)) {
      lines.push(short(story.title, 120), short(story.summary, 220));
      const source = story.sourceUrls.find((url) => {
        try { const parsed = new URL(url); return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password && url.length <= 300; } catch { return false; }
      });
      lines.push(source ? "Source: " + source : "Source link unavailable; see Dashboard.", "");
    }
    if (!team.latestStories.length) lines.push("No recent stories available.");
    lines.push("AI-researched briefing. See Dashboard for full details and all sources.");
    const message = lines.join("\n");
    if (message.length > 4096) throw new Error("Briefing exceeds Telegram's message limit.");
    return message;
  });
}
