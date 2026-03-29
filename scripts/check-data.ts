import { db } from '../lib/db';

async function main() {
  const cafes = await db.curatedPlace.findMany({
    where: { citySlug: 'helsinki', category: 'cafe' },
    select: { name: true, primaryType: true, rank: true },
    orderBy: { rank: 'asc' },
  });
  console.log('=== CAFE CATEGORY ===');
  cafes.forEach(p => console.log(p.rank, String(p.primaryType).padEnd(32), p.name));

  const curated = await db.curatedPlace.findMany({
    where: { citySlug: 'helsinki', category: null },
    select: { name: true, primaryType: true, rank: true },
    orderBy: { rank: 'asc' },
  });
  console.log('\n=== PEOPLE LOVE count:', curated.length, '===');
  curated.forEach(p => console.log(p.rank, String(p.primaryType).padEnd(32), p.name));
}

main().then(() => process.exit(0));
