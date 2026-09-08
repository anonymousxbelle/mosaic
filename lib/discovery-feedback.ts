import type { Media, Ratings } from './recommendations';
export function recommendationEligible(item: Media, ratings: Ratings): boolean {
  return !item.libraryState && !ratings[item.id];
}
export function connectionEvidence(
  item: Media,
  sources: Media[],
): { title: string; tags: string[] }[] {
  return sources
    .filter((source) => source.id !== item.id)
    .map((source) => ({
      title: source.title,
      tags: [...new Set(source.tags.filter((tag) => item.tags.includes(tag)))],
    }))
    .filter((source) => source.tags.length)
    .sort((a, b) => b.tags.length - a.tags.length)
    .slice(0, 2);
}
