import Anthropic from "@anthropic-ai/sdk";
import { PlaceInput, AnalyzedPlace } from "./types";

const client = new Anthropic();
const BATCH_SIZE = 15;

interface AnalysisResult {
  placeId: string;
  uniqueness: number;
  appeal: number;
  tags: string[];
  redFlag: boolean;
  layoverScore: number;
  stayMinutes: number; // 0 = use type default
}

async function analyzeBatchOnce(places: PlaceInput[]): Promise<AnalysisResult[]> {
  const placesJson = places.map((p) => ({
    id: p.id,
    name: p.name,
    rating: p.rating,
    reviewCount: p.reviewCount,
    type: p.primaryType,
    address: p.address,
    recentNewReviews: p.reviewCountDelta,
  }));

  const response = await client.messages.create({
    model: "MiniMax-M2.7-highspeed",
    max_tokens: 4096,
    tools: [
      {
        name: "submit_analysis",
        description: "Submit analysis results for a batch of places",
        input_schema: {
          type: "object" as const,
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  placeId: { type: "string" },
                  uniqueness: { type: "number", description: "1-10: how distinctive vs generic chain" },
                  appeal: { type: "number", description: "1-10: would you recommend to a friend" },
                  tags: { type: "array", items: { type: "string" }, description: "2-4 descriptive tags" },
                  redFlag: { type: "boolean", description: "true if obvious tourist trap or low-quality chain" },
                  layoverScore: { type: "number", description: "1-10: how suitable for a short airport layover visit. High score = iconic/central, fast to see, no reservation needed. Low score = requires planning, long dwell time, or far from transit." },
                  stayMinutes: { type: "number", description: "Recommended visit duration in minutes. Use 0 to apply type-based default (restaurant=60, cafe=45, bar=60, museum=90, park=30)." },
                },
                required: ["placeId", "uniqueness", "appeal", "tags", "redFlag", "layoverScore", "stayMinutes"],
              },
            },
          },
          required: ["results"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "submit_analysis" },
    messages: [
      {
        role: "user",
        content: `Analyze these places in Finland. The goal is to find spots that locals genuinely go to on a regular basis — their everyday favorites for food, coffee, and drinks — not tourist traps or one-time novelties.

Places:
${JSON.stringify(placesJson, null, 2)}

For each place evaluate:
- uniqueness (1-10): Is this a place worth going out of your way for, or just another generic option?
- appeal (1-10): Would a local resident choose this place for a regular outing with friends or family? Consider ratings and review volume as evidence of genuine repeat patronage.
- tags: 2-4 short descriptive labels (e.g. "local staple", "popular", "great food", "cozy", "lively", "chain")
- redFlag: true only if it's a well-known global chain (McDonald's, Starbucks, Burger King, etc.) or clearly low quality
- layoverScore (1-10): how good is this for a traveler with 2-4 hours to kill near Helsinki airport? High = easy to reach by transit, iconic or memorable, can be enjoyed quickly. Low = requires car, long queues, or deep local knowledge.
- stayMinutes: realistic visit duration. Use 0 if the type default is appropriate.

Use the submit_analysis tool with your assessment for all ${places.length} places.`,
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    const textBlock = response.content.find((b) => b.type === "text");
    throw new Error(`Analyzer: no tool_use response. Model said: ${(textBlock as { text?: string })?.text?.slice(0, 200) ?? "(no text)"}`);
  }

  const input = toolUse.input as { results: AnalysisResult[] };
  return input.results;
}

async function analyzeBatch(places: PlaceInput[], retries = 3): Promise<AnalysisResult[]> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await analyzeBatchOnce(places);
    } catch (err) {
      if (attempt === retries - 1) throw err;
    }
  }
  return [];
}

export async function analyzePlaces(places: PlaceInput[]): Promise<AnalyzedPlace[]> {
  // Split into batches and run in parallel
  const batches: PlaceInput[][] = [];
  for (let i = 0; i < places.length; i += BATCH_SIZE) {
    batches.push(places.slice(i, i + BATCH_SIZE));
  }

  const batchResults = await Promise.all(batches.map((b) => analyzeBatch(b)));
  const analysisMap = new Map<string, AnalysisResult>();
  for (const results of batchResults) {
    for (const r of results) {
      analysisMap.set(r.placeId, r);
    }
  }

  return places.map((p) => {
    const analysis = analysisMap.get(p.id);
    return {
      ...p,
      uniqueness: analysis?.uniqueness ?? 5,
      appeal: analysis?.appeal ?? 5,
      tags: analysis?.tags ?? [],
      redFlag: analysis?.redFlag ?? false,
      layoverScore: analysis?.layoverScore ?? 5,
      stayMinutesOverride: analysis?.stayMinutes && analysis.stayMinutes > 0 ? analysis.stayMinutes : null,
    };
  });
}
