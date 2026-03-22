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
}

async function analyzeBatch(places: PlaceInput[]): Promise<AnalysisResult[]> {
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
    max_tokens: 2048,
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
                },
                required: ["placeId", "uniqueness", "appeal", "tags", "redFlag"],
              },
            },
          },
          required: ["results"],
        },
      },
    ],
    tool_choice: { type: "auto" },
    messages: [
      {
        role: "user",
        content: `Analyze these places in Finland and assess each one's appeal and uniqueness.

Places:
${JSON.stringify(placesJson, null, 2)}

For each place evaluate:
- uniqueness (1-10): Is this a distinctive local spot or a generic chain/tourist trap?
- appeal (1-10): Would a discerning local recommend this to a friend?
- tags: 2-4 short descriptive labels (e.g. "hidden gem", "local favorite", "tourist trap", "chain store", "historic", "trendy", "cozy")
- redFlag: true if it's a well-known chain, obvious tourist trap, or low quality

Use the submit_analysis tool with your assessment for all ${places.length} places.`,
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Analyzer: no tool_use response");
  }

  const input = toolUse.input as { results: AnalysisResult[] };
  return input.results;
}

export async function analyzePlaces(places: PlaceInput[]): Promise<AnalyzedPlace[]> {
  // Split into batches and run in parallel
  const batches: PlaceInput[][] = [];
  for (let i = 0; i < places.length; i += BATCH_SIZE) {
    batches.push(places.slice(i, i + BATCH_SIZE));
  }

  const batchResults = await Promise.all(batches.map(analyzeBatch));
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
    };
  });
}
