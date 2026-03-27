import Anthropic from "@anthropic-ai/sdk";
import { ScoredPlace, CuratedEntry } from "./types";

const client = new Anthropic();
const CANDIDATE_MULTIPLIER = 2;

export async function selectPlaces(scored: ScoredPlace[], cityName: string, finalCount = 20): Promise<CuratedEntry[]> {
  const candidateCount = finalCount * CANDIDATE_MULTIPLIER;
  const candidates = scored.slice(0, candidateCount).map((p, i) => ({
    rank: i + 1,
    id: p.id,
    name: p.name,
    type: p.primaryType,
    rating: p.rating,
    reviews: p.reviewCount,
    score: p.score,
    tags: p.tags,
    recentGrowth: p.reviewCountDelta,
  }));

  const response = await client.messages.create({
    model: "MiniMax-M2.7",
    max_tokens: 4096,
    tools: [
      {
        name: "submit_curated_list",
        description: "Submit the final curated list of places",
        input_schema: {
          type: "object" as const,
          properties: {
            selected: {
              type: "array",
              description: `Exactly ${finalCount} places, ranked best first`,
              items: {
                type: "object",
                properties: {
                  placeId: { type: "string" },
                  reason: {
                    type: "string",
                    description: "One sentence explaining why this place made the list",
                  },
                },
                required: ["placeId", "reason"],
              },
            },
          },
          required: ["selected"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "submit_curated_list" },
    messages: [
      {
        role: "user",
        content: `You are curating the definitive "Best Places" list for ${cityName}, Finland.

From these ${candidates.length} scored candidates, select the best ${finalCount} places.

Candidates (pre-scored, higher score = better):
${JSON.stringify(candidates, null, 2)}

Rules:
1. Follow the scores — higher score means more people love it, rank accordingly
2. Ensure no duplicates — if two entries are clearly the same place, keep the higher-scored one
3. Write a compelling one-sentence reason for each selection based on its ratings and what makes it worth visiting

Submit exactly ${finalCount} places using submit_curated_list, ranked best first.`,
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Selector: no tool_use response");
  }

  const input = toolUse.input as { selected: { placeId: string; reason: string }[] };
  const scoreMap = new Map(scored.map((p) => [p.id, p]));

  return input.selected
    .map((s, i) => {
      const place = scoreMap.get(s.placeId);
      if (!place) return null;
      return {
        placeId: place.id,
        name: place.name,
        rating: place.rating,
        reviewCount: place.reviewCount,
        primaryType: place.primaryType,
        score: place.score,
        reason: s.reason,
        rank: i + 1,
      } satisfies CuratedEntry;
    })
    .filter((e): e is CuratedEntry => e !== null);
}
