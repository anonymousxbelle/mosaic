import type { Ratings } from './recommendations';
export type SharedRatings = { userId: string; ratings: Ratings };
// Only opted-in rows may be passed by a trusted service. Return aggregate scores, never neighbors' identities.
export function communityScores(
  mine: Ratings,
  neighbors: SharedRatings[],
  selfId: string,
) {
  const votes = new Map<
    string,
    { total: number; weight: number; support: number }
  >();
  const seen = new Set<string>();
  for (const peer of neighbors) {
    if (seen.has(peer.userId)) continue;
    seen.add(peer.userId);
    if (peer.userId === selfId) continue;
    const common = Object.keys(mine).filter(
      (id) =>
        Number.isInteger(mine[id]) &&
        mine[id] >= 1 &&
        mine[id] <= 5 &&
        Number.isInteger(peer.ratings[id]) &&
        peer.ratings[id] >= 1 &&
        peer.ratings[id] <= 5,
    );
    if (common.length < 3) continue;
    const agreement =
      common.reduce(
        (s, id) => s + 1 - Math.abs(mine[id] - peer.ratings[id]) / 4,
        0,
      ) / common.length;
    if (agreement < 0.7) continue;
    const weight = agreement * Math.min(1, common.length / 10);
    for (const [id, rating] of Object.entries(peer.ratings)) {
      if (mine[id] || !Number.isInteger(rating) || rating < 1 || rating > 5)
        continue;
      const v = votes.get(id) || { total: 0, weight: 0, support: 0 };
      v.total += (weight * (rating - 1)) / 4;
      v.weight += weight;
      v.support++;
      votes.set(id, v);
    }
  }
  return [...votes]
    .filter(([, v]) => v.support >= 3)
    .map(([id, v]) => ({
      id,
      score: v.total / v.weight,
      support: v.support,
      confidence: Math.min(1, v.support / 10),
    }));
}
