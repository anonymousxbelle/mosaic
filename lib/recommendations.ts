export const categories = ['Book', 'Music', 'Game', 'Movie', 'TV'] as const;
export type Category = (typeof categories)[number];
export type Media = {
  id: string;
  title: string;
  creator: string;
  type: Category;
  tags: string[];
  genres?: string[];
  artworkUrl?: string;
  libraryState?: 'later' | 'experienced' | 'dismissed';
  adult?: boolean;
  adultMarked?: boolean;
  contentRating?: string;
  description: string;
};
export type Ratings = Record<string, number>;
export type Vector = Record<string, number>;
export function vector(tags: string[]): Vector {
  return Object.fromEntries([...new Set(tags)].map((t) => [t, 1]));
}
// 1–2 stars contribute no positive preference; 3–5 stars have weights 1–3.
export function profile(catalog: Media[], ratings: Ratings): Vector {
  const out: Vector = {};
  let total = 0;
  for (const item of catalog) {
    const r = ratings[item.id];
    if (!Number.isInteger(r) || r < 1 || r > 5) continue;
    const w = Math.max(0, r - 2);
    total += w;
    for (const t of new Set(item.tags)) out[t] = (out[t] || 0) + w;
  }
  if (total) for (const t of Object.keys(out)) out[t] /= total;
  return out;
}
export function cosine(a: Vector, b: Vector): number {
  const norm = (v: Vector) =>
    Math.sqrt(Object.values(v).reduce((s, x) => s + x * x, 0));
  const d = norm(a) * norm(b);
  return d
    ? Object.entries(a).reduce((s, [k, v]) => s + v * (b[k] || 0), 0) / d
    : 0;
}
export function recommend(
  catalog: Media[],
  query: Vector,
  category: Category | 'All',
  exclude: string[] = [],
) {
  return catalog
    .filter(
      (i) =>
        !exclude.includes(i.id) && (category === 'All' || i.type === category),
    )
    .map((i) => ({
      ...i,
      score: cosine(query, vector(i.tags)),
      reasons: i.tags
        .filter((t) => query[t] > 0)
        .sort((a, b) => query[b] - query[a])
        .slice(0, 3),
    }))
    .filter((i) => i.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}
