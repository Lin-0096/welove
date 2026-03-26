export function rankClass(rank: number): string {
  if (rank === 1) return "text-rank-gold";
  if (rank === 2) return "text-rank-silver";
  if (rank === 3) return "text-rank-bronze/70";
  return "text-muted-foreground/25";
}
