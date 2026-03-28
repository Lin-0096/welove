import Anthropic from "@anthropic-ai/sdk";
import { ScoredPlace, CuratedEntry } from "./types";

const HIDDEN_GEM_COUNT = 10;

export async function selectHiddenGems(scored: ScoredPlace[], cityName: string): Promise<CuratedEntry[]> {
  const candidates = scored.slice(0, HIDDEN_GEM_COUNT * 3).map((p, i) => ({
    rank: i + 1,
    id: p.id,
    name: p.name,
    type: p.primaryType,
    rating: p.rating,
    reviews: p.reviewCount,
    score: p.score,
    tags: p.tags,
  }));

  const response = await client.messages.create({
    model: "MiniMax-M2.7",
    max_tokens: 4096,
    tools: [
      {
        name: "submit_hidden_gems",
        description: "Submit the final hidden gems list",
        input_schema: {
          type: "object" as const,
          properties: {
            selected: {
              type: "array",
              description: `Exactly ${HIDDEN_GEM_COUNT} places, ranked best first`,
              items: {
                type: "object",
                properties: {
                  placeId: { type: "string" },
                  reason: {
                    type: "string",
                    description: "One sentence in English — what makes this place a hidden gem worth seeking out",
                  },
                  reasonFi: { type: "string", description: "Same sentence in Finnish" },
                  reasonZh: { type: "string", description: "Same sentence in Simplified Chinese" },
                },
                required: ["placeId", "reason", "reasonFi", "reasonZh"],
              },
            },
          },
          required: ["selected"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "submit_hidden_gems" },
    messages: [
      {
        role: "user",
        content: `You are curating a "Hidden Gems" list for ${cityName}, Finland — places that locals love but most tourists and visitors haven't discovered yet. These should feel like insider tips, not guidebook staples.

From these ${candidates.length} scored candidates, select the best ${HIDDEN_GEM_COUNT} hidden gems.

Candidates (pre-scored for uniqueness and low profile):
${JSON.stringify(candidates, null, 2)}

Rules:
1. Prioritise places with genuine character — a neighbourhood café that regulars swear by, a small gallery with a cult following, a park only locals know.
2. Avoid anything that already appears in mainstream tourist guides or has become widely known.
3. No global chains or tourist traps.
4. For each place, write one sentence explaining what makes it a hidden gem worth seeking out, in three languages: English (reason), Finnish (reasonFi), and Simplified Chinese (reasonZh).

Submit exactly ${HIDDEN_GEM_COUNT} places using submit_hidden_gems, ranked best first.`,
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Selector: no tool_use response for hidden gems");
  }

  const input = toolUse.input as { selected: { placeId: string; reason: string; reasonFi: string; reasonZh: string }[] };
  const scoreMap = new Map(scored.map((p) => [p.id, p]));

  const seen = new Set<string>();
  return input.selected
    .filter((s) => {
      if (seen.has(s.placeId)) return false;
      seen.add(s.placeId);
      return true;
    })
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
        reasonFi: s.reasonFi ?? "",
        reasonZh: s.reasonZh ?? "",
        rank: i + 1,
      } satisfies CuratedEntry;
    })
    .filter((e): e is CuratedEntry => e !== null);
}

const client = new Anthropic();
const CANDIDATE_MULTIPLIER = 2;

export async function selectPlaces(scored: ScoredPlace[], cityName: string, finalCount = 10): Promise<CuratedEntry[]> {
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
    max_tokens: 8192,
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
                    description: "One sentence in English explaining why locals love this place",
                  },
                  reasonFi: {
                    type: "string",
                    description: "Same sentence in Finnish",
                  },
                  reasonZh: {
                    type: "string",
                    description: "Same sentence in Simplified Chinese",
                  },
                },
                required: ["placeId", "reason", "reasonFi", "reasonZh"],
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
        content: `You are curating a "Best Places" list for ${cityName}, Finland — the spots locals actually go to on a regular basis, not tourist traps or one-time novelties. Think: where does a ${cityName} resident go when they want a great meal or drink with friends?

From these ${candidates.length} scored candidates, select the best ${finalCount} places.

Candidates (pre-scored, higher score = better):
${JSON.stringify(candidates, null, 2)}

Rules:
1. Follow the scores — they reflect genuine popularity (ratings × review volume). Higher score = more locals love it.
2. Avoid well-known global chains (McDonald's, Starbucks, etc.) — locals skip these.
3. Ensure no duplicates — if two entries are clearly the same place, keep the higher-scored one.
4. For each place, write one sentence explaining why locals keep coming back, in three languages: English (reason), Finnish (reasonFi), and Simplified Chinese (reasonZh). The meaning should be the same in all three.

Submit exactly ${finalCount} places using submit_curated_list, ranked best first.`,
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    const textBlock = response.content.find((b) => b.type === "text");
    throw new Error(`Selector: no tool_use response. Model said: ${(textBlock as { text?: string })?.text?.slice(0, 200) ?? "(no text)"}`);
  }

  const input = toolUse.input as { selected: { placeId: string; reason: string; reasonFi: string; reasonZh: string }[] };
  const scoreMap = new Map(scored.map((p) => [p.id, p]));

  const seen = new Set<string>();
  return input.selected
    .filter((s) => {
      if (seen.has(s.placeId)) return false;
      seen.add(s.placeId);
      return true;
    })
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
        reasonFi: s.reasonFi ?? "",
        reasonZh: s.reasonZh ?? "",
        rank: i + 1,
      } satisfies CuratedEntry;
    })
    .filter((e): e is CuratedEntry => e !== null);
}
