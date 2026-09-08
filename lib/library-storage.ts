import type { Media, Ratings } from './recommendations';
import {
  validStoredItem,
  findDuplicate,
  type CatalogMedia,
} from './media-api.ts';
import { restoreTagEdits, type TagEdits } from './tags.ts';
export const STORAGE_KEY = 'mosaic-library-v1';
export function restoreLibrary(
  text: string | null,
  samples: Media[],
): { added: CatalogMedia[]; ratings: Ratings; tagEdits: TagEdits } {
  if (!text) return { added: [], ratings: {}, tagEdits: {} };
  const data = JSON.parse(text);
  if (!data || data.version !== 1 || !Array.isArray(data.added))
    throw new Error('Unrecognized saved library.');
  const added: CatalogMedia[] = [];
  for (const item of data.added.slice(0, 200)) {
    if (validStoredItem(item) && !findDuplicate(added, item)) added.push(item);
  }
  const ids = new Set([...samples, ...added].map((i) => i.id));
  const ratings: Ratings = {};
  if (
    data.ratings &&
    typeof data.ratings === 'object' &&
    !Array.isArray(data.ratings)
  )
    for (const [id, r] of Object.entries(data.ratings)) {
      if (
        ids.has(id) &&
        typeof r === 'number' &&
        Number.isInteger(r) &&
        r >= 1 &&
        r <= 5
      )
        ratings[id] = r;
    }
  return {
    added,
    ratings,
    tagEdits: restoreTagEdits(data.tagEdits, [...samples, ...added]),
  };
}
