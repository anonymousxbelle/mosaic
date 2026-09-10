import type { CatalogMedia } from './media-api';
import { extractTags, plainText } from './media-api.ts';
import { normalizeGenres } from './genres.ts';
import { bookSubjects, specificity } from './features.ts';
const cache = new Map<string, { at: number; data: any }>();
let queue: Promise<unknown> = Promise.resolve();
let next = 0;
async function request(path: string, signal?: AbortSignal): Promise<any> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < 600000) return hit.data;
  const task = queue
    .catch(() => {})
    .then(async () => {
      signal?.throwIfAborted();
      const wait = Math.max(0, next - Date.now());
      if (wait) await new Promise((r) => setTimeout(r, wait));
      signal?.throwIfAborted();
      next = Date.now() + 1100;
      const r = await fetch('https://openlibrary.org' + path, {
        credentials: 'omit',
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(12000)])
          : AbortSignal.timeout(12000),
      });
      if (!r.ok)
        throw Error(
          r.status === 429
            ? 'Book catalog is busy. Please retry shortly.'
            : 'Book catalog unavailable. Please retry.',
        );
      const data = await r.json();
      if (cache.size >= 60) cache.delete(cache.keys().next().value!);
      cache.set(path, { at: Date.now(), data });
      return data;
    });
  queue = task;
  return task;
}
export function openLibraryRecord(row: any): CatalogMedia | null {
  if (!row || typeof row !== 'object') return null;
  const id = String(row.key || '').replace('/works/', '');
  if (!/^OL\d+W$/.test(id) || !plainText(row.title)) return null;
  const subjects = Array.isArray(row.subject)
    ? row.subject.filter((x: unknown) => typeof x === 'string').slice(0, 150)
    : [];
  const description = plainText(
    typeof row.description === 'string'
      ? row.description
      : row.description?.value,
  );
  const tags = extractTags(description, subjects);
  return {
    id: 'openlibrary:' + id,
    externalId: id,
    type: 'Book',
    title: plainText(row.title),
    creator:
      plainText(
        (Array.isArray(row.author_name)
          ? row.author_name.filter((x: unknown) => typeof x === 'string')
          : []
        ).join(', '),
      ) || 'Author unavailable',
    description:
      description ||
      'No synopsis supplied. Subject information is available from the source.',
    tags,
    genres: normalizeGenres(subjects),
    provider: 'Open Library',
    sourceUrl: 'https://openlibrary.org/works/' + id,
    verifiedAt: new Date().toISOString(),
    artworkUrl:
      Number.isSafeInteger(row.cover_i) && row.cover_i > 0
        ? 'https://covers.openlibrary.org/b/id/' + row.cover_i + '-M.jpg'
        : undefined,
    year: Number.isInteger(row.first_publish_year)
      ? String(row.first_publish_year)
      : undefined,
    ratingCount:
      Number.isSafeInteger(row.ratings_count) && row.ratings_count >= 0
        ? row.ratings_count
        : undefined,
    adult:
      subjects.some((x: string) => /\berotica|erotic fiction\b/i.test(x)) ||
      undefined,
  };
}
const fields =
  'key,title,author_name,subject,cover_i,first_publish_year,ratings_count';
export async function searchBooks(query: string, signal?: AbortSignal) {
  const data = await request(
    '/search.json?' +
      new URLSearchParams({ q: query, fields, limit: '20', lang: 'en' }),
    signal,
  );
  if (!Array.isArray(data.docs))
    throw Error('Unexpected book catalog response.');
  return data.docs
    .map(openLibraryRecord)
    .filter(
      (x: CatalogMedia | null): x is CatalogMedia => !!x,
    ) as CatalogMedia[];
}
export async function verifyBook(id: string, signal?: AbortSignal) {
  if (!/^OL\d+W$/.test(id)) throw Error('Invalid book identifier.');
  const data = await request(
    '/search.json?' +
      new URLSearchParams({ q: 'key:/works/' + id, fields, limit: '1' }),
    signal,
  );
  const row = data.docs?.find(
    (x: any) => x.key === '/works/' + id || x.key === id,
  );
  if (!row) throw Error('Book could not be verified.');
  const work = await request('/works/' + id + '.json', signal);
  const item = openLibraryRecord({ ...row, description: work.description });
  if (!item) throw Error('Invalid book record.');
  return item;
}
export async function discoverBooks(tags: string[], signal?: AbortSignal) {
  const fiction =
    tags.includes('fiction') ||
    tags.includes('fantasy') ||
    tags.includes('magic');
  const selected = [
    ...new Set(
      tags
        .filter((t) => bookSubjects[t])
        .sort((a, b) => specificity(b) - specificity(a))
        .map((t) => bookSubjects[t]),
    ),
  ].slice(0, 3);
  if (!selected.length) return [];
  if (tags.includes('fantasy') && !selected.includes('fantasy')) {
    if (selected.length === 3) selected[2] = 'fantasy';
    else selected.push('fantasy');
  }
  const items: CatalogMedia[] = [];
  // Separate subject queries preserve several interests instead of requiring every favorite to match.
  for (const subject of selected) {
    const found = await searchBooks(
      'subject:"' + subject + '"' + (fiction ? ' AND subject:fiction' : ''),
      signal,
    );
    for (const item of found)
      if (!items.some((x) => x.id === item.id)) items.push(item);
  }
  return items;
}
