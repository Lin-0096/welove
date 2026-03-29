import { db } from '../lib/db';

async function main() {
  for (const cat of ['cafe', 'bar', 'restaurant'] as const) {
    const rows = await db.curatedPlace.findMany({
      where: { citySlug: 'helsinki', category: cat },
      select: { rank: true, primaryType: true, name: true },
      orderBy: { rank: 'asc' },
    });
    console.log(`\n=== ${cat.toUpperCase()} (${rows.length} items) ===`);
    rows.forEach(p => console.log(p.rank, String(p.primaryType).padEnd(32), p.name));
  }

  const curated = await db.curatedPlace.findMany({
    where: { citySlug: 'helsinki', category: null },
    select: { rank: true, primaryType: true, name: true },
    orderBy: { rank: 'asc' },
  });
  console.log(`\n=== PEOPLE LOVE (${curated.length} items) ===`);
  curated.forEach(p => console.log(p.rank, String(p.primaryType).padEnd(32), p.name));
}

main().then(() => process.exit(0));
