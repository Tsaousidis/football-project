import Anthropic from "@anthropic-ai/sdk";

export type MatchSummary = {
  opponent: string;
  competition: string;
  venue: "Home" | "Away" | "Neutral";
  date: string;
  time: string;
  status: "scheduled" | "finished" | "postponed";
  result?: string;
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

const researchSchema = {
  type: "OBJECT",
  properties: {
    generatedAt: { type: "STRING" },
    teams: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          teamName: { type: "STRING" },
          competition: { type: "STRING" },
          nextMatch: {
            type: "OBJECT",
            properties: {
              opponent: { type: "STRING" },
              competition: { type: "STRING" },
              venue: { type: "STRING" },
              date: { type: "STRING" },
              time: { type: "STRING" },
              status: { type: "STRING" },
              result: { type: "STRING" },
            },
            required: ["opponent", "competition", "venue", "date", "time", "status"],
          },
          lastResult: {
            type: "OBJECT",
            properties: {
              opponent: { type: "STRING" },
              competition: { type: "STRING" },
              venue: { type: "STRING" },
              date: { type: "STRING" },
              time: { type: "STRING" },
              status: { type: "STRING" },
              result: { type: "STRING" },
            },
            required: ["opponent", "competition", "venue", "date", "time", "status"],
          },
          currentStanding: {
            type: "OBJECT",
            properties: {
              position: { type: "INTEGER" },
              points: { type: "INTEGER" },
              played: { type: "INTEGER" },
              goalDifference: { type: "INTEGER" },
            },
            required: ["position", "points", "played", "goalDifference"],
          },
          latestStories: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" },
                summary: { type: "STRING" },
                category: { type: "STRING" },
                importance: { type: "STRING" },
                sourceCount: { type: "INTEGER" },
                sourceUrls: { type: "ARRAY", items: { type: "STRING" } },
              },
              required: ["title", "summary", "category", "importance", "sourceCount", "sourceUrls"],
            },
          },
        },
        required: ["teamName", "competition", "nextMatch", "lastResult", "currentStanding", "latestStories"],
      },
    },
  },
  required: ["generatedAt", "teams"],
};

function buildPrompt(teamNames: string[]) {
  const currentDate = new Date().toISOString().slice(0, 10);

  return `
You are a football research assistant.

Current date: ${currentDate}

Goal: research the latest verified football information for the following teams:
${teamNames.map((team) => `- ${team}`).join("\n")}

Requirements:
- Search separately for each team and its current competition before producing the final JSON.
- Use reliable public sources and official club/league updates when available.
- Prefer information published or updated closest to the current date.
- Do not invent exact scores if not clearly verified.
- If uncertain, use "null" for fields that cannot be verified.
- Return only valid JSON matching the requested schema.
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
  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-7-sonnet-latest";

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is missing.");
  }

  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model,
    max_tokens: 4000,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5,
        allowed_domains: [
          "paokfc.gr",
          "bvb.de",
          "bundesliga.com",
          "uefa.com",
          "slgr.gr",
          "espn.com",
          "kicker.de",
          "sky.com",
          "goal.com",
        ],
      },
    ],
    messages: [
      {
        role: "user",
        content: buildPrompt(teamNames),
      },
    ],
  });

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

  let data: FootballResearchPayload;

  try {
    data = JSON.parse(content) as FootballResearchPayload;
  } catch (error) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Claude response was not valid JSON.");
    }

    data = JSON.parse(jsonMatch[0]) as FootballResearchPayload;
  }

  return {
    ...data,
    generatedAt: new Date().toISOString(),
  };
}
