import Anthropic from "@anthropic-ai/sdk";
import { parseResearchResponse, type FootballResearchPayload } from "./research-payload";
export type { FootballResearchPayload, TeamResearch, MatchSummary, StorySummary, StandingSummary } from "./research-payload";

function buildPrompt(teamNames: string[]) {
  const currentDate = new Date().toISOString().slice(0, 10);

  return `
You are a football research assistant.

Current date: ${currentDate}

Goal: research the latest verified football information for the following teams:
${teamNames.map((team) => `- ${team}`).join("\n")}

Requirements:
- Search separately for each team and its current competition before producing the final JSON.
- Return data for these selected teams only; do not add, substitute, or infer any other team.
- Return exactly one team object for each selected team listed above.
- Use reliable public sources and official club/league updates when available.
- Prefer information published or updated closest to the current date.
- Do not invent exact scores if not clearly verified.
- If uncertain, use "null" for fields that cannot be verified.
- Return only valid JSON matching the requested schema.
- Write all text in English. Copy the requested team names exactly.
- Dates must be YYYY-MM-DD. Match result must be a string or null.
- Return an entire match or standing as null if its required details cannot be verified.
- Keep data fresh and concise.
- For each team provide:
  1. teamName
  2. competition
  3. nextMatch: opponent, competition, venue, date, time, status, result if applicable
  4. lastResult: opponent, competition, venue, date, time, status, result
  5. currentStanding: position, points, played, goalDifference
  6. latestStories: up to 3 recent relevant stories with title, summary, category, importance, sourceCount, sourceUrls

Return JSON with this structure:
{
  "generatedAt": "ISO timestamp",
  "teams": [
    {
      "teamName": "string",
      "competition": "string",
      "nextMatch": { ... } or null,
      "lastResult": { ... } or null,
      "currentStanding": { ... } or null,
      "latestStories": [ ... ]
    }
  ]
}
`;
}

export async function researchTeamSnapshot(teamNames: string[]): Promise<FootballResearchPayload> {
  if (!teamNames.length) {
    throw new Error("At least one team is required for research.");
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is missing.");
  }

  const anthropic = new Anthropic({ apiKey, timeout: 120_000, maxRetries: 0 });

  const response = await anthropic.messages.create({
    model,
    max_tokens: 4000,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5,
      },
    ],
    messages: [
      {
        role: "user",
        content: buildPrompt(teamNames),
      },
    ],
  });

  if (response.stop_reason !== "end_turn") throw new Error("Research did not finish. Please try again.");
  const searches = response.content.filter((part) => part.type === "web_search_tool_result");
  if (!searches.length || searches.some((part) => !Array.isArray(part.content))) throw new Error("Web research was unavailable. Please try again.");

  const content = response.content
    .map((part) => {
      if (part.type === "text") {
        return part.text;
      }

      return "";
    })
    .join("")
    .trim();

  if (!content) {
    throw new Error("Claude returned empty output.");
  }

  return parseResearchResponse(content, teamNames);
}
