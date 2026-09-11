import { specificity, featureKind } from './features.ts';
import { sameWork } from './media-identity.ts';
export const categories = ['Book', 'Music', 'Game', 'Movie', 'TV'] as const;
export const discoveryCategories = ['Book', 'Game', 'Movie', 'TV'] as const;
export type Category = (typeof categories)[number];
export type Media = {
  id: string;
  title: string;
  creator: string;
  type: Category;
  tags: string[];
  genres?: string[];
  seriesKey?: string;
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
      score:
        cosine(
          Object.fromEntries(
            Object.entries(query).map(([t, w]) => [t, w * specificity(t)]),
          ),
          Object.fromEntries(
            [...new Set(i.tags)].map((t) => [t, specificity(t)]),
          ),
        ) *
        (i.tags.some((t) => query[t] > 0 && specificity(t) > 0.55) ? 1 : 0.35) *
        ([
          'fantasy',
          'science-fiction',
          'mystery',
          'horror',
          'romance',
          'sports',
        ].some((t) => query[t] > 0) &&
        ![
          'fantasy',
          'science-fiction',
          'mystery',
          'horror',
          'romance',
          'sports',
        ].some((t) => query[t] > 0 && i.tags.includes(t))
          ? 0.6
          : 1),
      reasons: i.tags
        .filter((t) => query[t] > 0)
        .sort((a, b) => query[b] * specificity(b) - query[a] * specificity(a))
        .slice(0, 3),
    }))
    .map(i=>({...i,score:i.score * (
      Object.keys(query).some(t=>query[t]>0 && !['audience','format','tone'].includes(featureKind(t))) &&
      !i.tags.some(t=>query[t]>0 && !['audience','format','tone'].includes(featureKind(t))) ? 0.2 : 1
    )}))
    .filter((i) => i.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

// Greedy diversity reranking only among relevant, already-filtered candidates.
export function diversify<T extends Media & { score: number }>(
  items: T[],
  limit = 30,
): T[] {
  const rest = items.filter((item,index)=>!items.slice(0,index).some(x=>sameWork(x,item))),
    out: T[] = [];
  while (rest.length && out.length < limit) {
    let best = 0,
      bestValue = -Infinity;
    rest.forEach((item, index) => {
      const creatorRepeat = out.filter(
        (x) => x.creator === item.creator && x.type === item.type,
      ).length;
      const typeRepeat = out.filter((x) => x.type === item.type).length;
      const seriesRepeat = item.seriesKey ? out.filter(x=>x.seriesKey===item.seriesKey).length : 0;
      const overlap = out.length
        ? Math.max(...out.map((x) => cosine(vector(x.tags), vector(item.tags))))
        : 0;
      const value =
        item.score /
        (1 + 0.9 * seriesRepeat + 0.3 * creatorRepeat + 0.06 * typeRepeat + 0.15 * overlap);
      if (value > bestValue) {
        best = index;
        bestValue = value;
      }
    });
    out.push(rest.splice(best, 1)[0]);
  }
  return out;
}
