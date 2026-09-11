import { detailedPatterns, detailedFeatures, primaryGenre, seedTopic, matchesGenre } from './features.ts';
import { retrievePages, emptyStats, cachedCatalog, rememberCatalog, type RetrievalStats, type RetrievalEvidence } from './retrieval.ts';
import { matureRating } from './content-rating.ts';
import { normalizeGenres, genreChoices } from './genres.ts';
import { bookSynopsis, rankSearch } from './catalog-text.ts';
import type { Category, Media } from './recommendations';
import { sameWork } from './media-identity.ts';
export type Provider =
  | 'Hardcover'
  | 'Open Library'
  | 'Apple catalog'
  | 'TVmaze'
  | 'Wikidata'
  | 'TMDB'
  | 'IGDB';
export type CatalogMedia = Media & {
  provider: Provider;
  externalId: string;
  sourceUrl: string;
  year?: string;
  ratingCount?: number;
  imdbUrl?: string;
  format?: 'Song' | 'Album';
  verifiedAt: string;
};
type Data = Record<string, any>;
export const catalogApi = (process.env.NEXT_PUBLIC_CATALOG_API || '').replace(
  /\/$/,
  '',
);
// IGDB requires its own credentials; a TMDB connection alone must not route games there.
export const igdbEnabled = process.env.NEXT_PUBLIC_IGDB_ENABLED === 'true';
const usesGateway = (type: Category) =>
  Boolean(catalogApi) &&
  (type === 'Movie' || type === 'TV' || (type === 'Game' && igdbEnabled));
export const providerFor = (type: Category): Provider =>
  type === 'Book'
    ? catalogApi ? 'Hardcover' : 'Open Library'
    : usesGateway(type)
      ? type === 'Game'
        ? 'IGDB'
        : 'TMDB'
      : type === 'TV'
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
    .replace(/&#x([a-f0-9]+);/gi, (_, n) =>
      parseInt(n, 16) <= 0x10ffff ? String.fromCodePoint(parseInt(n, 16)) : ' ',
    )
    .replace(/&#(\d+);/g, (_, n) =>
      Number(n) <= 0x10ffff ? String.fromCodePoint(Number(n)) : ' ',
    )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3000);
}
const vocabulary: Record<string, RegExp> = {
  ...detailedPatterns,
  'non-fiction': /\bnon[ -]?fiction\b/i,
  fiction: /\bfiction\b/i,
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
  const detailed = new Set(detailedFeatures(description, genres));
  const text = [
    description,
    ...genres.filter(
      (g) => !/^science fiction (?:&|and) fantasy$/i.test(g.trim()),
    ),
  ].join(' ');
  return Object.entries(vocabulary)
    .filter(([, pattern]) => pattern.test(text))
    .filter(([tag]) => !Object.hasOwn(detailedPatterns,tag) || detailed.has(tag))
    .map(([tag]) => tag)
    .filter(
      (tag) =>
        tag !== 'fiction' || !normalizeGenres(genres).includes('non-fiction'),
    );
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
    type === 'Book'
      ? bookSynopsis(data.description || '')
      : data.longDescription || data.description || data.shortDescription,
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
    tags: [
      ...new Set([
        ...extractTags(description, genres),
        ...normalizeGenres(genres),
      ]),
    ],
    genres: normalizeGenres(genres),
    adult:
      data.trackExplicitness === 'explicit' ||
      matureRating(data.contentAdvisoryRating) ||
      genres.some((g) => /\berotica\b/i.test(g)),
    contentRating:
      plainText(data.contentAdvisoryRating) ||
      (data.trackExplicitness === 'explicit' ? 'Explicit' : undefined),
    artworkUrl: validArtwork(data.artworkUrl100)
      ? data.artworkUrl100
      : undefined,
    ratingCount:
      Number.isSafeInteger(data.userRatingCount) && data.userRatingCount >= 0
        ? data.userRatingCount
        : undefined,
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
    genres: normalizeGenres(strings(data.genres)),
    artworkUrl: validArtwork(data.image?.medium)
      ? data.image.medium
      : undefined,
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
    tags: [
      ...new Set([
        ...extractTags(description, genres),
        ...normalizeGenres(genres),
      ]),
    ],
    genres: normalizeGenres(genres),
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
  adult = false,
): Promise<CatalogMedia[]> {
  signal?.throwIfAborted();
  const invalid = queryError(query);
  if (invalid) throw new Error(invalid);
  const key = type + ':' + query.trim().toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < 300000) return hit.items;
  let items: CatalogMedia[];
  if (type === 'Book') {
    if (catalogApi) {
      try {
        const found = await gateway('search', {type, q: query.trim(), adult: String(adult)}, signal);
        if (found.length) return found;
      } catch (error) { if (signal?.aborted) throw error; }
    }
    try {
      return await (await import('./book-api.ts')).searchBooks(query.trim(), signal);
    } catch (error) {
      if (signal?.aborted) throw error;
      return rankSearch(normalizeResults('Book', await json(
        'https://itunes.apple.com/search?' + new URLSearchParams({term: query.trim(),entity:'ebook',media:'ebook',limit:'25',country:'US'}), signal,
      )), query).slice(0,20);
    }
  }
  if (usesGateway(type))
    return gateway(
      'search',
      { type, q: query.trim(), adult: String(adult) },
      signal,
    );
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
    const entity = 'album,song';
    const media = 'music';
    items = normalizeResults(
      type,
      await json(
        'https://itunes.apple.com/search?' +
          new URLSearchParams({
            term: query.trim(),
            entity,
            media,
            limit: '25',
            country: 'US',
          }),
        signal,
      ),
    );
  }
  signal?.throwIfAborted();
  if (cache.size >= 50) cache.delete(cache.keys().next().value!);
  items = rankSearch(items, query).slice(0, 20);
  cache.set(key, { time: Date.now(), items });
  return items;
}
export async function verifyMedia(
  item: CatalogMedia,
  signal?: AbortSignal,
): Promise<CatalogMedia> {
  if (item.provider === 'Open Library' && item.type === 'Book')
    return (await import('./book-api.ts')).verifyBook(item.externalId, signal);
  let result: CatalogMedia | undefined;
  if (item.provider === 'TMDB' || item.provider === 'IGDB' || item.provider === 'Hardcover') {
    if (!catalogApi) throw new Error('The catalog service is not connected.');
    const found = await gateway(
      'verify',
      { type: item.type, id: item.externalId },
      signal,
    );
    const record = found.find((x) => x.id === item.id);
    if (!record) throw new Error('This title could not be verified.');
    return record;
  }
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
      sameWork(x,item) ||
      (x.type !== 'Book' && x.type === item.type &&
        (!('format' in x) ||
          !('format' in item) ||
          !x.format ||
          !item.format ||
          x.format === item.format) &&
        comparable(x.title) === comparable(item.title) &&
        comparable(x.creator) === comparable(item.creator)),
  );
}
export function validArtwork(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 1000) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      (/^is[0-9]+-ssl\.mzstatic\.com$/.test(url.hostname) ||
        [
          'image.tmdb.org',
          'static.tvmaze.com',
          'covers.openlibrary.org',
        ].includes(url.hostname))
    );
  } catch {
    return false;
  }
}
export function validStoredItem(value: unknown): value is CatalogMedia {
  if (!value || typeof value !== 'object') return false;
  const x = value as CatalogMedia;
  if(x.seriesKey !== undefined && (typeof x.seriesKey !== 'string' || !/^(hardcover|tmdb):[\p{L}\p{N} -]{1,160}$/u.test(x.seriesKey))) return false;
  if (x.artworkUrl !== undefined && !validArtwork(x.artworkUrl)) return false;
  if (
    x.libraryState !== undefined &&
    !['later', 'experienced', 'dismissed'].includes(x.libraryState)
  )
    return false;
  if (
    (x.adult !== undefined && typeof x.adult !== 'boolean') ||
    (x.adultMarked !== undefined && typeof x.adultMarked !== 'boolean') ||
    (x.contentRating !== undefined &&
      (typeof x.contentRating !== 'string' || x.contentRating.length > 80))
  )
    return false;
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
  if (
    x.genres !== undefined &&
    (!Array.isArray(x.genres) ||
      x.genres.some((g) => !genreChoices.includes(g)))
  )
    return false;
  if (
    x.ratingCount !== undefined &&
    (!Number.isSafeInteger(x.ratingCount) || x.ratingCount < 0)
  )
    return false;
  if (x.format !== undefined && x.format !== 'Song' && x.format !== 'Album')
    return false;
  if (
    x.imdbUrl !== undefined &&
    (typeof x.imdbUrl !== 'string' ||
      !/^https:\/\/www\.imdb\.com\/title\/tt\d+\/$/.test(x.imdbUrl))
  )
    return false;
  if (x.provider === 'Hardcover')
    return x.type === 'Book' && /^[1-9]\d{0,9}$/.test(x.externalId) &&
      x.id === 'hardcover:' + x.externalId && typeof x.sourceUrl === 'string' &&
      /^https:\/\/hardcover\.app\/books\/[a-z0-9][a-z0-9-]*$/.test(x.sourceUrl);
  if (x.provider === 'Open Library')
    return (
      x.type === 'Book' &&
      /^OL\d+W$/.test(x.externalId) &&
      x.id === 'openlibrary:' + x.externalId &&
      x.sourceUrl === 'https://openlibrary.org/works/' + x.externalId
    );
  if (x.provider === 'TMDB')
    return (
      ['Movie', 'TV'].includes(x.type) &&
      /^\d+$/.test(x.externalId) &&
      x.id === `tmdb:${x.type}:${x.externalId}` &&
      x.sourceUrl ===
        `https://www.themoviedb.org/${x.type === 'Movie' ? 'movie' : 'tv'}/${x.externalId}`
    );
  if (x.provider === 'IGDB')
    return (
      x.type === 'Game' &&
      /^\d+$/.test(x.externalId) &&
      x.id === `igdb:${x.externalId}` &&
      typeof x.sourceUrl === 'string' &&
      /^https:\/\/www\.igdb\.com\/games\/[a-z0-9-]+$/.test(x.sourceUrl)
    );
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

async function gateway(
  action: string,
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<CatalogMedia[]> {
  const data = await json(
    catalogApi + '/' + action + '?' + new URLSearchParams(params),
    signal,
  );
  if (!Array.isArray(data.items))
    throw new Error('Invalid catalog service response.');
  return data.items.filter(validStoredItem);
}
export async function discoverMedia(
  types: Category[], tags:string[], signal?:AbortSignal, adult=false,
  options:{seed?:Media;accept?:(item:CatalogMedia)=>boolean}={},
):Promise<{items:CatalogMedia[];failures:string[];stats:RetrievalStats;evidence:Record<string,RetrievalEvidence[]>}>{
 const items:CatalogMedia[]=[],failures:string[]=[],stats=emptyStats();
 const evidence:Record<string,RetrievalEvidence[]>={};
 const anchor=primaryGenre(options.seed),topic=seedTopic(options.seed);
 const accept=(item:CatalogMedia)=>
  (!anchor || matchesGenre(item,anchor)) && (!topic || item.tags.includes(topic)) &&
  item.tags.some(t=>tags.includes(t)) && (!options.seed || !sameWork(item,options.seed)) &&
  (options.accept?.(item) ?? true);
 for(const item of cachedCatalog())if(types.includes(item.type) && accept(item) && !findDuplicate(items,item)){items.push(item);stats.cached++;}
 for(const type of types){
  signal?.throwIfAborted();
  try{
   if(type==='Music')continue;
   let result:{items:CatalogMedia[];stats:RetrievalStats;evidence:Record<string,RetrievalEvidence[]>};
   if(type==='Book')result=await(await import('./book-api.ts')).retrieveBooks(tags,signal,accept,anchor,topic);
   else {
    if(!usesGateway(type)){failures.push(type);continue;}
    const core=[topic,anchor].filter((x):x is string=>!!x);
    const controlled=tags.filter(t=>Object.hasOwn(vocabulary,t));
    const plans=[JSON.stringify({tags:[...new Set([...core,...controlled])].slice(0,3).join(',')})];
    const broad=core.length?core:controlled.slice(0,1);
    if(broad.length)plans.push(JSON.stringify({tags:broad.join(',')}));
    const seed=options.seed as CatalogMedia|undefined;
    if(seed?.provider==='TMDB' && seed.type===type)plans.unshift(JSON.stringify({related:seed.externalId}));
    result=await retrievePages([...new Set(plans)].slice(0,3),async(plan,page)=>{
      const data=await json(catalogApi+'/discover?'+new URLSearchParams({type,adult:String(adult),page:String(page),...JSON.parse(plan)}),signal);
      if(!Array.isArray(data.items))throw Error('Invalid discovery response.');
      return {items:data.items.filter(validStoredItem),hasMore:data.hasMore===true};
    },accept,signal,30,item=> !options.seed || type!==options.seed.type || !options.seed.tags.includes('anime') || item.tags.includes('anime'));
   }
   for(const key of ['examined','rejected','pages','failedQueries'] as const)stats[key]+=result.stats[key];
   if(result.stats.failedQueries)failures.push(type+' (partial)');
   for(const item of result.items){
    const duplicate=findDuplicate(items,item);
    const key=duplicate?.id || item.id;
    evidence[key]=[...(evidence[key]||[]),...(result.evidence[item.id]||[])];
    if(!duplicate)items.push(item);
   }
  }catch(error){if(signal?.aborted)throw error;failures.push(type);}
 }
 rememberCatalog(items);stats.accepted=items.length;
 return {items,failures,stats,evidence};
}
