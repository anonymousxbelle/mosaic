import { subgenres, detailedFeatures, featureGroups } from './features.ts';
import type { Media, Ratings } from './recommendations';
export const genreChoices = [
  ...subgenres,
  'sports',
  'animation',
  'fantasy',
  'science-fiction',
  'mystery',
  'thriller',
  'horror',
  'romance',
  'adventure',
  'history',
  'non-fiction',
  'fiction',
  'humor',
  'drama',
  'action',
  'strategy',
  'roguelike',
  'pop',
  'rock',
  'alternative',
  'folk',
  'electronic',
  'jazz',
  'hip-hop',
  'country',
  'classical',
];
export function normalizeGenres(values: string[]): string[] {
  values = values.filter(
    (g) => !/^science fiction (?:&|and) fantasy$/i.test(g.trim()),
  );
  const text = values.join(' ').toLowerCase();
  const out = genreChoices.filter((g) =>
    new RegExp('\\b' + g.replace(/-/g, '[ -]?') + '\\b', 'i').test(text),
  );
  out.push(
    ...detailedFeatures('', values).filter((t) => subgenres.includes(t)),
  );
  for (const [parent, children] of Object.entries(featureGroups))
    if (children.some((t) => out.includes(t)) && parent !== 'non-fiction')
      out.push(parent);
  if (
    /non[ -]?fiction|documentary|biograph|memoir|self.help|business|science & nature|reference|religion|travel|cookbook/.test(
      text,
    )
  )
    out.push('non-fiction');
  if (/sci.fi/.test(text)) out.push('science-fiction');
  if (/comedy|comedies/.test(text)) out.push('humor');
  if (out.includes('non-fiction'))
    return [...new Set(out)].filter((g) => g !== 'fiction');
  return [...new Set(out)];
}
export function genrePreferences(
  items: Media[],
  ratings: Ratings,
): { blocked: string[]; penalties: Record<string, number> } {
  const counts: Record<string, { low: number; high: number }> = {};
  for (const item of items) {
    const rating = ratings[item.id];
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) continue;
    for (const genre of item.genres || []) {
      const key = item.type + ':' + genre;
      const count = counts[key] || (counts[key] = { low: 0, high: 0 });
      if (rating <= 2) count.low++;
      if (rating >= 3) count.high++;
    }
  }
  const blocked: string[] = [];
  const penalties: Record<string, number> = {};
  for (const [key, c] of Object.entries(counts)) {
    if (c.low > c.high)
      penalties[key] = Math.min(0.45, 0.15 * (c.low - c.high));
  }
  return { blocked, penalties };
}
export function genreAllowed(
  item: Media,
  blocked: string[],
  avoid: string[],
): boolean {
  return !(item.genres || []).some(
    (g) => blocked.includes(item.type + ':' + g) || avoid.includes(g),
  );
}
