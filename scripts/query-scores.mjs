import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  SELECT rank, name, rating, "reviewCount", score, "primaryType"
  FROM "CuratedPlace"
  WHERE "citySlug" = 'helsinki' AND category IS NULL
  ORDER BY rank ASC
`;

for (const r of rows) {
  console.log(
    String(r.rank).padStart(2),
    String(r.score).padStart(3),
    Number(r.rating).toFixed(1),
    String(r.reviewCount).padStart(6),
    r.primaryType.padEnd(22),
    r.name
  );
}

// Also check if Allas Pool/Sea Pool is in the snapshot data
const allas = await sql`
  SELECT name, rating, "reviewCount", "primaryType"
  FROM "PlaceSnapshot"
  WHERE "citySlug" = 'helsinki' AND name ILIKE '%allas%'
  ORDER BY "snappedAt" DESC
  LIMIT 5
`;
if (allas.length > 0) {
  console.log("\nAllas in snapshots:");
  allas.forEach(r => console.log(" ", r.name, r.rating, r.reviewCount, r.primaryType));
}
