import type { Category, Media } from './recommendations';
export type Provider = 'Apple catalog' | 'TVmaze' | 'Wikidata';
export type CatalogMedia = Media & {
  provider: Provider;
  externalId: string;
  sourceUrl: string;
  year?: string;
  format?: 'Song' | 'Album';
  verifiedAt: string;
};
type Data = Record<string, any>;
export const providerFor = (type: Category): Provider =>
  type === 'TV'
    ? 'TVmaze'
    : type === 'Game' || type === 'Movie'
      ? 'Wikidata'
      : 'Apple catalog';
export function plainText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(
      /&(?:nbsp|amp|quot|apos|lt|gt);/g,
      (x) =>
        ({
          '&nbsp;': ' ',
          '&amp;': '&',
          '&quot;': '"',
          '&apos;': "'",
          '&lt;': '<',
          '&gt;': '>',
        })[x] || ' ',
    )
    .replace(/&#(\d+);/g, (_, n) =>
      Number(n) <= 0x10ffff ? String.fromCodePoint(Number(n)) : ' ',
    )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3000);
}
const vocabulary: Record<string, RegExp> = {
  fantasy: /\b(fantasy|magic|wizard|mytholog\w*)\b/i,
  adventure: /\b(adventure|journey|quest|exploration)\b/i,
  survival: /\b(survival|survive\w*|apocalyp\w*)\b/i,
  rebellion: /\b(rebel\w*|resistance|revolution\w*)\b/i,
  dystopian: /\b(dystopi\w*|totalitarian)\b/i,
  emotional: /\b(emotion\w*|grief|heartbreak|loss)\b/i,
  identity: /\b(identity|coming.of.age|self.discovery)\b/i,
  reflective: /\b(reflect\w*|introspect\w*|memory|memories)\b/i,
  romance: /\b(romance|romantic|love story)\b/i,
  humor: /\b(comedy|comic|humor|humour|funny)\b/i,
  friendship: /\b(friendship|friends)\b/i,
  connection: /\b(family|families|relationship\w*|community|connection)\b/i,
  hope: /\b(hope|hopeful|optimis\w*)\b/i,
  mystery: /\b(mystery|detective|investigat\w*)\b/i,
  'science-fiction': /\b(sci.fi|science.fiction|space exploration)\b/i,
  thriller: /\b(thriller|suspense)\b/i,
  horror: /\b(horror)\b/i,
  history: /\b(histor\w*)\b/i,
  pop: /\b(pop)\b/i,
  rock: /\b(rock)\b/i,
  alternative: /\balternative\b/i,
  action: /\baction\b/i,
  drama: /\bdrama\b/i,
  strategy: /\bstrategy\b/i,
  roguelike: /\broguelike\b/i,
  country: /\bcountry\b/i,
  classical: /\bclassical\b/i,
  folk: /\b(folk)\b/i,
  electronic: /\b(electronic|dance)\b/i,
  jazz: /\b(jazz)\b/i,
  'hip-hop': /\b(hip.hop|rap)\b/i,
};
// Deterministic keyword baseline: do not invent themes from the media category or title.
export function extractTags(description: string, genres: string[]): string[] {
  const text = [description, ...genres].join(' ');
  return Object.entries(vocabulary)
    .filter(([, pattern]) => pattern.test(text))
    .map(([tag]) => tag);
}
function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x) => typeof x === 'string') : [];
}
function appleRecord(data: Data, type: Category): CatalogMedia | null {
  const valid =
    type === 'Book'
      ? data.kind === 'ebook'
      : type === 'Movie'
        ? data.kind === 'feature-movie'
        : type === 'Music' &&
          (data.collectionType === 'Album' || data.kind === 'song');
  const externalId = String(data.trackId || data.collectionId || '');
  const title = plainText(data.trackName || data.collectionName);
  if (!valid || !/^\d+$/.test(externalId) || !title) return null;
  const description = plainText(
    data.longDescription || data.description || data.shortDescription,
  );
  const genres = [
    ...strings(data.genres),
    plainText(data.primaryGenreName),
  ].filter(Boolean);
  const sourceUrl = `https://${type === 'Book' ? 'books' : type === 'Movie' ? 'tv' : 'music'}.apple.com/us/${type === 'Book' ? 'book' : type === 'Movie' ? 'movie' : data.kind === 'song' ? 'song' : 'album'}/id${externalId}`;
  return {
    id: `apple:${type}:${externalId}`,
    externalId,
    title,
    creator: plainText(data.artistName) || 'Creator unavailable',
    type,
    description: description || 'No description supplied by this catalog.',
    tags: extractTags(description, genres),
    format:
      type === 'Music' ? (data.kind === 'song' ? 'Song' : 'Album') : undefined,
    provider: 'Apple catalog',
    sourceUrl,
    year: plainText(data.releaseDate).slice(0, 4),
    verifiedAt: new Date().toISOString(),
  };
}
function tvRecord(data: Data): CatalogMedia | null {
  if (!Number.isSafeInteger(data.id) || data.id < 1 || !plainText(data.name))
    return null;
  const description = plainText(data.summary);
  return {
    id: `tvmaze:${data.id}`,
    externalId: String(data.id),
    title: plainText(data.name),
    creator:
      plainText(data.network?.name || data.webChannel?.name) ||
      'Network unavailable',
    type: 'TV',
    description: description || 'No description supplied by this catalog.',
    tags: extractTags(description, strings(data.genres)),
    provider: 'TVmaze',
    sourceUrl: `https://www.tvmaze.com/shows/${data.id}`,
    year: plainText(data.premiered).slice(0, 4),
    verifiedAt: new Date().toISOString(),
  };
}
function claims(entity: Data, key: string): string[] {
  return (Array.isArray(entity.claims?.[key]) ? entity.claims[key] : [])
    .filter((c: Data) => c.rank !== 'deprecated')
    .map((c: Data) => c.mainsnak?.datavalue?.value?.id)
    .filter((id: unknown) => typeof id === 'string' && /^Q\d+$/.test(id));
}
export function gameRecord(
  entity: Data,
  labels: Record<string, Data> = {},
  type: Category = 'Game',
): CatalogMedia | null {
  // Require an actual video-game instance. Names alone could match a person, film, or deity.
  if (
    !/^Q\d+$/.test(entity.id) ||
    !claims(entity, 'P31').includes(type === 'Movie' ? 'Q11424' : 'Q7889') ||
    !entity.labels?.en?.value
  )
    return null;
  const description = plainText(entity.descriptions?.en?.value);
  const label = (id: string) => plainText(labels[id]?.labels?.en?.value);
  const genres = claims(entity, 'P136').map(label).filter(Boolean);
  const developer = claims(entity, type === 'Movie' ? 'P57' : 'P178')
    .map(label)
    .filter(Boolean)
    .join(', ');
  const date = entity.claims?.P577?.find(
    (c: Data) => c.mainsnak?.datavalue?.value?.time,
  )?.mainsnak.datavalue.value.time;
  return {
    id: `wikidata:${entity.id}`,
    externalId: entity.id,
    title: plainText(entity.labels.en.value),
    creator:
      developer ||
      (type === 'Movie' ? 'Director unavailable' : 'Developer unavailable'),
    type,
    description: description || 'No description supplied by this catalog.',
    tags: extractTags(description, genres),
    provider: 'Wikidata',
    sourceUrl: `https://www.wikidata.org/wiki/${entity.id}`,
    year: typeof date === 'string' ? date.slice(1, 5) : undefined,
    verifiedAt: new Date().toISOString(),
  };
}
export function normalizeResults(
  type: Category,
  payload: unknown,
): CatalogMedia[] {
  if (!payload || typeof payload !== 'object')
    throw new Error(
      'The catalog returned an unreadable response. Please retry.',
    );
  let rows: unknown[];
  if (type === 'TV') {
    if (!Array.isArray(payload))
      throw new Error('Unexpected TV catalog response.');
    rows = payload;
  } else {
    rows = (payload as Data).results;
    if (!Array.isArray(rows))
      throw new Error('Unexpected media catalog response.');
  }
  return rows
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      return type === 'TV'
        ? tvRecord((row as Data).show || row)
        : appleRecord(row as Data, type);
    })
    .filter((row): row is CatalogMedia => row !== null)
    .filter((row, i, all) => all.findIndex((x) => x.id === row.id) === i);
}
export function queryError(query: string): string | null {
  const n = query.trim().length;
  return n < 2
    ? 'Type at least 2 characters.'
    : n > 100
      ? 'Keep the search under 101 characters.'
      : null;
}
async function json(url: string, signal?: AbortSignal): Promise<Data> {
  try {
    const response = await fetch(url, {
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(12000)])
        : AbortSignal.timeout(12000),
      credentials: 'omit',
    });
    if (response.status === 429)
      throw new Error('The catalog is busy. Wait a moment and try again.');
    if (!response.ok)
      throw new Error(
        response.status === 404
          ? 'That catalog record no longer exists.'
          : 'The catalog could not be reached. Please retry.',
      );
    const data = await response.json();
    if (!data || typeof data !== 'object')
      throw new Error('Invalid catalog response.');
    if ('error' in data && data.error)
      throw new Error('The catalog could not complete this request.');
    return data as Data;
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Canceled', 'AbortError');
    if (error instanceof Error && error.name === 'TimeoutError')
      throw new Error('The catalog took too long. Please retry.');
    if (error instanceof TypeError)
      throw new Error(
        'Unable to reach the catalog. Check your connection and retry.',
      );
    throw error;
  }
}
function wikiUrl(params: Record<string, string>): string {
  return (
    'https://www.wikidata.org/w/api.php?' +
    new URLSearchParams({ format: 'json', origin: '*', ...params })
  );
}
async function entities(
  ids: string[],
  signal?: AbortSignal,
): Promise<Record<string, Data>> {
  if (!ids.length) return {};
  const result = await json(
    wikiUrl({
      action: 'wbgetentities',
      ids: [...new Set(ids)].slice(0, 50).join('|'),
      props: 'claims|labels|descriptions',
      languages: 'en',
    }),
    signal,
  );
  return result.entities || {};
}
async function gameResults(
  ids: string[],
  type: Category,
  signal?: AbortSignal,
): Promise<CatalogMedia[]> {
  const found = await entities(ids, signal);
  const games = ids
    .map((id) => found[id])
    .filter(
      (e) =>
        e && claims(e, 'P31').includes(type === 'Movie' ? 'Q11424' : 'Q7889'),
    );
  const labelIds = games.flatMap((e) => [
    ...claims(e, type === 'Movie' ? 'P57' : 'P178'),
    ...claims(e, 'P136'),
  ]);
  const labels = await entities(labelIds, signal);
  return games
    .map((e) => gameRecord(e, labels, type))
    .filter((e): e is CatalogMedia => e !== null);
}
const cache = new Map<string, { time: number; items: CatalogMedia[] }>();
export async function searchMedia(
  type: Category,
  query: string,
  signal?: AbortSignal,
): Promise<CatalogMedia[]> {
  signal?.throwIfAborted();
  const invalid = queryError(query);
  if (invalid) throw new Error(invalid);
  const key = type + ':' + query.trim().toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < 300000) return hit.items;
  let items: CatalogMedia[];
  if (type === 'Game' || type === 'Movie') {
    const result = await json(
      wikiUrl({
        action: 'wbsearchentities',
        search: query.trim(),
        language: 'en',
        limit: '20',
      }),
      signal,
    );
    if (!Array.isArray(result.search))
      throw new Error('Unexpected catalog response.');
    items = await gameResults(
      result.search
        .map((e: Data) => e.id)
        .filter((id: unknown) => typeof id === 'string' && /^Q\d+$/.test(id)),
      type,
      signal,
    );
  } else if (type === 'TV')
    items = normalizeResults(
      type,
      await json(
        'https://api.tvmaze.com/search/shows?' +
          new URLSearchParams({ q: query.trim() }),
        signal,
      ),
    );
  else {
    const entity = type === 'Book' ? 'ebook' : 'album,song';
    const media = type === 'Book' ? 'ebook' : 'music';
    items = normalizeResults(
      type,
      await json(
        'https://itunes.apple.com/search?' +
          new URLSearchParams({
            term: query.trim(),
            entity,
            media,
            limit: '10',
            country: 'US',
          }),
        signal,
      ),
    );
  }
  signal?.throwIfAborted();
  if (cache.size >= 50) cache.delete(cache.keys().next().value!);
  items = items.slice(0, 10);
  cache.set(key, { time: Date.now(), items });
  return items;
}
export async function verifyMedia(
  item: CatalogMedia,
  signal?: AbortSignal,
): Promise<CatalogMedia> {
  let result: CatalogMedia | undefined;
  if (
    item.provider === 'Wikidata' &&
    (item.type === 'Game' || item.type === 'Movie') &&
    /^Q\d+$/.test(item.externalId)
  )
    result = (await gameResults([item.externalId], item.type, signal))[0];
  else if (
    item.provider === 'TVmaze' &&
    item.type === 'TV' &&
    /^\d+$/.test(item.externalId)
  ) {
    const payload = await json(
      `https://api.tvmaze.com/shows/${item.externalId}`,
      signal,
    );
    result = tvRecord(payload) || undefined;
  } else if (
    item.provider === 'Apple catalog' &&
    ['Book', 'Music', 'Movie'].includes(item.type) &&
    /^\d+$/.test(item.externalId)
  )
    result = normalizeResults(
      item.type,
      await json(
        'https://itunes.apple.com/lookup?' +
          new URLSearchParams({ id: item.externalId, country: 'US' }),
        signal,
      ),
    ).find((x) => x.externalId === item.externalId);
  if (!result || result.id !== item.id)
    throw new Error(
      'This title could not be verified in the selected category. Search again and choose another result.',
    );
  return result;
}
const comparable = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/\([^)]*\)/g, '')
    .split('·')[0]
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
export function findDuplicate(items: Media[], item: Media): Media | undefined {
  return items.find(
    (x) =>
      x.id === item.id ||
      (x.type === item.type &&
        (!('format' in x) ||
          !('format' in item) ||
          !x.format ||
          !item.format ||
          x.format === item.format) &&
        comparable(x.title) === comparable(item.title) &&
        comparable(x.creator) === comparable(item.creator)),
  );
}
export function validStoredItem(value: unknown): value is CatalogMedia {
  if (!value || typeof value !== 'object') return false;
  const x = value as CatalogMedia;
  if (
    typeof x.title !== 'string' ||
    !x.title ||
    x.title.length > 500 ||
    typeof x.creator !== 'string' ||
    typeof x.description !== 'string' ||
    !Array.isArray(x.tags) ||
    x.tags.some(
      (t) => typeof t !== 'string' || !Object.hasOwn(vocabulary, t),
    ) ||
    typeof x.verifiedAt !== 'string' ||
    (x.year !== undefined && typeof x.year !== 'string') ||
    x.creator.length > 500 ||
    x.description.length > 3000
  )
    return false;
  if (x.format !== undefined && x.format !== 'Song' && x.format !== 'Album')
    return false;
  if (x.provider === 'Wikidata')
    return (
      (x.type === 'Game' || x.type === 'Movie') &&
      /^Q\d+$/.test(x.externalId) &&
      x.id === `wikidata:${x.externalId}` &&
      x.sourceUrl === `https://www.wikidata.org/wiki/${x.externalId}`
    );
  if (x.provider === 'TVmaze')
    return (
      x.type === 'TV' &&
      /^\d+$/.test(x.externalId) &&
      x.id === `tvmaze:${x.externalId}` &&
      x.sourceUrl === `https://www.tvmaze.com/shows/${x.externalId}`
    );
  if (x.provider === 'Apple catalog')
    return (
      ['Book', 'Music', 'Movie'].includes(x.type) &&
      /^\d+$/.test(x.externalId) &&
      x.id === `apple:${x.type}:${x.externalId}` &&
      /^https:\/\/(books|music|tv)\.apple\.com\/us\/(book|album|song|movie)\/id\d+$/.test(
        x.sourceUrl,
      )
    );
  return false;
}
