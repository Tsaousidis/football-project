import { GoogleGenAI } from "@google/genai";

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
  return `
You are a football research assistant.

Goal: research the latest verified football information for the following teams:
${teamNames.map((team) => `- ${team}`).join("\n")}

Requirements:
- Use reliable public sources and official club/league updates when available.
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

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: buildPrompt(teamNames),
    config: {
      responseMimeType: "application/json",
      responseSchema: researchSchema,
    },
  });

  const rawText = response.text;

  if (!rawText) {
    throw new Error("Gemini returned empty output.");
  }

  const data = JSON.parse(rawText) as FootballResearchPayload;

  return data;
}
