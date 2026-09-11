import { hardcoverBooks, HardcoverError } from './hardcover.ts';
import { semanticComparison, SemanticError, type SemanticEnv } from './semantic.ts';
import { featureGroups, detailedTags } from '../lib/features.ts';
import { matureRating } from '../lib/content-rating.ts';
import { normalizeGenres } from '../lib/genres.ts';
import { extractTags, plainText } from '../lib/media-api.ts';
type Env = SemanticEnv & {
  TMDB_TOKEN?: string;
  HARDCOVER_TOKEN?: string;
  IGDB_CLIENT_ID?: string;
  IGDB_CLIENT_SECRET?: string;
  ALLOWED_ORIGIN: string;
  CATALOG_LIMITER?: {
    limit: (input: { key: string }) => Promise<{ success: boolean }>;
  };
};
type Data = Record<string, any>;
class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
const responseCache = new Map<string, { expires: number; items: any[];hasMore:boolean }>();
let twitch: { token: string; expires: number; client: string } | undefined;
async function upstream(url: string, init: RequestInit = {}): Promise<any> {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(10000) });
  if (!r.ok)
    throw new ApiError(
      r.status === 429 ? 429 : 502,
      r.status === 429
        ? 'Catalog rate limit reached. Please retry later.'
        : 'Catalog request failed. Please retry.',
    );
  return r.json();
}
const tmdbCache=new Map<string,{expires:number;data:any}>();
async function tmdb(path: string, env: Env, fresh=false) {
  if (!env.TMDB_TOKEN) throw new ApiError(503, 'TMDB is not configured yet.');
  const hit=tmdbCache.get(path);if(!fresh && hit && hit.expires>Date.now())return hit.data;
  const data=await upstream('https://api.themoviedb.org/3/' + path, {
    headers: { Authorization: 'Bearer ' + env.TMDB_TOKEN },
  });
  if(tmdbCache.size>=250)tmdbCache.delete(tmdbCache.keys().next().value!);
  tmdbCache.set(path,{expires:Date.now()+300000,data});return data;
}
async function igdb(
  query: string,
  env: Env,
  endpoint: 'games' | 'themes' = 'games',
) {
  if (!env.IGDB_CLIENT_ID || !env.IGDB_CLIENT_SECRET)
    throw new ApiError(503, 'IGDB is not configured yet.');
  if (
    !twitch ||
    twitch.expires < Date.now() ||
    twitch.client !== env.IGDB_CLIENT_ID
  ) {
    const value = await upstream('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.IGDB_CLIENT_ID,
        client_secret: env.IGDB_CLIENT_SECRET,
        grant_type: 'client_credentials',
      }),
    });
    if (
      typeof value.access_token !== 'string' ||
      !Number.isFinite(value.expires_in)
    )
      throw new ApiError(502, 'Game catalog authentication failed.');
    twitch = {
      token: value.access_token,
      expires: Date.now() + (value.expires_in - 60) * 1000,
      client: env.IGDB_CLIENT_ID,
    };
  }
  return upstream('https://api.igdb.com/v4/' + endpoint, {
    method: 'POST',
    headers: {
      'Client-ID': env.IGDB_CLIENT_ID,
      Authorization: 'Bearer ' + twitch.token,
      'Content-Type': 'text/plain',
    },
    body: query,
  });
}
export function tmdbRecord(d: Data, type: 'Movie' | 'TV') {
  if (
    !Number.isSafeInteger(d.id) ||
    d.id < 1 ||
    typeof (type === 'Movie' ? d.title : d.name) !== 'string'
  )
    return null;
  const title = plainText(type === 'Movie' ? d.title : d.name).slice(0, 500);
  if (!title) return null;
  const description = plainText(d.overview);
  const names = (a: any) =>
    Array.isArray(a) ? a.map((x) => plainText(x?.name)).filter(Boolean) : [];
  const creator =
    type === 'Movie'
      ? names(d.credits?.crew?.filter((p: Data) => p.job === 'Director')).join(
          ', ',
        )
      : names(d.created_by).join(', ');
  const keywords = names(d.keywords?.keywords || d.keywords?.results);
  const imdb = d.external_ids?.imdb_id || d.imdb_id;
  const certifications: string[] =
    type === 'Movie'
      ? (d.release_dates?.results || [])
          .filter((r: Data) => ['US', 'GB'].includes(r.iso_3166_1))
          .flatMap((r: Data) =>
            (r.release_dates || []).map((v: Data) =>
              plainText(v.certification),
            ),
          )
      : (d.content_ratings?.results || [])
          .filter((r: Data) => ['US', 'GB'].includes(r.iso_3166_1))
          .map((r: Data) => plainText(r.rating));
  const rating =
    certifications.find(matureRating) || certifications.find(Boolean);

  const tags = extractTags(description, [...names(d.genres), ...keywords]);
  if (
    names(d.genres).includes('Animation') &&
    (d.origin_country?.includes('JP') || d.original_language === 'ja')
  )
    tags.push('anime');
  if (tags.includes('sports') && tags.includes('anime'))
    tags.push('sports-anime');
  if (tags.includes('sports') && tags.includes('drama'))
    tags.push('sports-drama');
  return {
    id: `tmdb:${type}:${d.id}`,
    externalId: String(d.id),
    type,
    title,
    creator: creator || 'Creator unavailable',
    description: description || 'No description supplied by this catalog.',
    tags: [...new Set(tags)],
    genres: normalizeGenres(names(d.genres)),
    seriesKey: type === 'Movie' && Number.isSafeInteger(d.belongs_to_collection?.id) && d.belongs_to_collection.id > 0 ? 'tmdb:'+d.belongs_to_collection.id : undefined,
    adult: d.adult === true || certifications.some(matureRating),
    contentRating: rating || (d.adult === true ? 'Adult flag' : undefined),
    artworkUrl:
      typeof d.poster_path === 'string' &&
      /^\/[a-zA-Z0-9]+\.(jpg|png)$/.test(d.poster_path)
        ? 'https://image.tmdb.org/t/p/w342' + d.poster_path
        : undefined,
    provider: 'TMDB',
    sourceUrl: `https://www.themoviedb.org/${type === 'Movie' ? 'movie' : 'tv'}/${d.id}`,
    imdbUrl:
      typeof imdb === 'string' && /^tt\d+$/.test(imdb)
        ? `https://www.imdb.com/title/${imdb}/`
        : undefined,
    year: plainText(d.release_date || d.first_air_date).slice(0, 4),
    verifiedAt: new Date().toISOString(),
  };
}
export function igdbRecord(d: Data) {
  if (
    !Number.isSafeInteger(d.id) ||
    d.id < 1 ||
    typeof d.slug !== 'string' ||
    !/^[a-z0-9-]+$/.test(d.slug) ||
    typeof d.name !== 'string' ||
    !d.name
  )
    return null;
  const names = (a: any) =>
    Array.isArray(a) ? a.map((x) => plainText(x?.name)).filter(Boolean) : [];
  const description = plainText(
    [d.summary, d.storyline].filter((x) => typeof x === 'string').join(' '),
  );
  return {
    id: `igdb:${d.id}`,
    externalId: String(d.id),
    type: 'Game',
    title: plainText(d.name).slice(0, 500),
    creator:
      names(
        d.involved_companies
          ?.filter((c: Data) => c.developer)
          .map((c: Data) => c.company),
      )
        .join(', ')
        .slice(0, 500) || 'Developer unavailable',
    description: description || 'No description supplied by this catalog.',
    tags: extractTags(description, [
      ...names(d.genres),
      ...names(d.themes),
      ...names(d.keywords),
    ]),
    genres: normalizeGenres([...names(d.genres), ...names(d.themes)]),
    provider: 'IGDB',
    sourceUrl: `https://www.igdb.com/games/${d.slug}`,
    year:
      Number.isFinite(d.first_release_date) &&
      d.first_release_date > 0 &&
      d.first_release_date < 1e11
        ? new Date(d.first_release_date * 1000).getUTCFullYear().toString()
        : undefined,
    verifiedAt: new Date().toISOString(),
  };
}
const fields =
  'fields id,name,slug,summary,storyline,first_release_date,genres.name,themes.name,keywords.name,involved_companies.developer,involved_companies.company.name;';
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const headers = {
      'Access-Control-Allow-Origin':
        env.ALLOWED_ORIGIN || 'https://anonymousxbelle.github.io',
      Vary: 'Origin',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    };
    const reply = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers });
    if (origin && origin !== headers['Access-Control-Allow-Origin'])
      return reply({ error: 'Origin not allowed.' }, 403);
    if (request.method === 'OPTIONS')
      return new Response(null, {
        status: 204,
        headers: { ...headers, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' },
      });
    if (request.method !== 'GET' && !(request.method==='POST' && new URL(request.url).pathname==='/semantic'))
      return reply({ error: 'Method not allowed.' }, 405);
    try {
      const u = new URL(request.url);
      if(u.pathname==='/semantic'){
        if(request.method!=='POST')return reply({error:'Use POST.'},405);
        return reply(await semanticComparison(request,env));
      }
      if (u.pathname === '/status')
        return reply({
          tmdb: !!env.TMDB_TOKEN,
          semantic: !!(env.AI && env.AI_LIMITER),
          hardcover: !!env.HARDCOVER_TOKEN,
          igdb: !!(env.IGDB_CLIENT_ID && env.IGDB_CLIENT_SECRET),
        });
      if (!['/search', '/verify', '/discover'].includes(u.pathname))
        return reply({ error: 'Not found.' }, 404);
      const type = u.searchParams.get('type');
      if (!['Movie', 'TV', 'Game', 'Book'].includes(type || ''))
        throw new ApiError(400, 'Choose Movie, TV, Game or Book.');
      const adult = u.searchParams.get('adult') === 'true';
      const q = (u.searchParams.get('q') || '').trim();
      const id = u.searchParams.get('id') || '';
      const pageText=u.searchParams.get('page') || '1';
      if(!/^[1-3]$/.test(pageText))throw new ApiError(400,'Page must be 1–3.');
      const page=Number(pageText);
      const related=u.searchParams.get('related') || '';
      if(related && (!['Movie','TV'].includes(type || '') || !/^[1-9]\d{0,9}$/.test(related)))throw new ApiError(400,'Invalid related title.');
      const tagText = (u.searchParams.get('tags') || '').slice(0, 100);
      const tags = tagText.split(',').slice(0, 3);
      const parentTags = Object.entries(featureGroups)
        .filter(([, children]) => children.some((t) => tags.includes(t)))
        .map(([parent]) => parent);
      const matched = (rows: Data[]) =>
        rows
          .filter(
            (r) =>
              Number.isSafeInteger(r.id) &&
              extractTags('', [plainText(r.name)]).some(
                (t) => tags.includes(t) || parentTags.includes(t),
              ),
          )
          .map((r) => r.id);
      if (u.pathname === '/search' && (q.length < 2 || q.length > 100))
        throw new ApiError(400, 'Search must be 2–100 characters.');
      if (u.pathname === '/verify' && !/^[1-9]\d{0,9}$/.test(id))
        throw new ApiError(400, 'Invalid catalog ID.');
      const cacheKey =
        u.pathname +
        '?' +
        new URLSearchParams({
          type: type!,
          q,
          id,
          tags: tagText,
          adult: String(adult),
          page:pageText,related,
        });
      const hit = responseCache.get(cacheKey);
      if (u.pathname !== '/verify' && hit && hit.expires > Date.now())
        return reply({ items: hit.items,hasMore:hit.hasMore });
      if (!env.CATALOG_LIMITER)
        throw new ApiError(503, 'Catalog rate limiter is not configured.');
      if (
        !(
          await env.CATALOG_LIMITER.limit({
            key: type === 'Book' ? 'hardcover' : type === 'Game' ? 'igdb' : 'tmdb',
          })
        ).success
      )
        throw new ApiError(429, 'Catalog is busy. Please retry later.');
      let items: any[];
      let hasMore=false;
      if (type === 'Book') {
        items = await hardcoverBooks(env,u.pathname,q,id,tags);
      } else if (type === 'Game') {
        let themeIds: number[] = [];
        if (u.pathname === '/discover') {
          const themes = await igdb(
            'fields id,name; limit 100;',
            env,
            'themes',
          );
          if (Array.isArray(themes)) themeIds = matched(themes);
        }
        const escaped = q.replace(/[\\"\r\n]/g, ' ');
        const query =
          u.pathname === '/verify'
            ? `where id = ${id}; limit 1;`
            : u.pathname === '/search'
              ? `search "${escaped}"; limit 8;`
              : `where rating_count > 10${themeIds.length ? ' & themes = (' + themeIds.join(',') + ')' : ''}; sort rating desc; limit 20; offset ${(page-1)*20};`;
        const data = await igdb(fields + query, env);
        if (!Array.isArray(data))
          throw new ApiError(502, 'Invalid game catalog response.');
        items = data.map(igdbRecord).filter(Boolean);
        hasMore=u.pathname==='/discover' && data.length===20 && page<3;
      } else {
        const kind = type === 'Movie' ? 'movie' : 'tv';
        const detail = async (id: number | string) =>
          tmdbRecord(
            await tmdb(
              `${kind}/${id}?append_to_response=keywords,credits,external_ids,${kind === 'movie' ? 'release_dates' : 'content_ratings'}`,
              env,
              u.pathname === '/verify',
            ),
            type as 'Movie' | 'TV',
          );
        if (u.pathname === '/verify')
          items = [await detail(id)].filter(Boolean);
        else {
          let genreIds: number[] = [];
          const keywordIds: number[] = [];
          if (u.pathname === '/discover' && !related) {
            const genres = await tmdb(`genre/${kind}/list`, env);
            if (Array.isArray(genres.genres)) genreIds = matched(genres.genres);
            const keywordNames: Record<string, string> = {
              'sports-anime': 'sport',
              'sports-drama': 'sport',
              sports: 'sport',
              'mythic-fantasy': 'mythology',
              'magical-school': 'magic school',
            };
            for (const tag of tags
              .filter((t) => detailedTags.includes(t) || t === 'sports')
              .slice(0, 2)) {
              const name = keywordNames[tag] || tag.replaceAll('-', ' ');
              const keywords = await tmdb(
                'search/keyword?' + new URLSearchParams({ query: name }),
                env,
              );
              const exact = keywords.results?.find(
                (k: Data) =>
                  plainText(k.name).toLowerCase() === name &&
                  Number.isSafeInteger(k.id),
              );
              if (exact) keywordIds.push(exact.id);
            }
            if (!genreIds.length && !keywordIds.length)
              return reply({ items: [] });
          }
          const path =
            u.pathname === '/search'
              ? `search/${kind}?${new URLSearchParams({ query: q, include_adult: String(adult) })}`
              : related ? `${kind}/${related}/recommendations?page=${page}`
              : `discover/${kind}?page=${page}&include_adult=${adult}&sort_by=popularity.desc&with_genres=${genreIds.join(',')}&with_keywords=${keywordIds.join(',')}`;
          const data = await tmdb(path, env);
          if (!Array.isArray(data.results))
            throw new ApiError(502, 'Invalid film/TV catalog response.');
          hasMore=u.pathname==='/discover' && page<3 && (typeof data.total_pages==='number'?page<data.total_pages:data.results.length===20);
          items = [];
          const rows=data.results.slice(0,u.pathname === '/search'?8:20);
          // Bounded concurrency enriches every row on a discovery page; no skipped tail.
          for(let offset=0;offset<rows.length;offset+=4){
            const batch=await Promise.all(rows.slice(offset,offset+4).map(async(row:Data)=>Number.isSafeInteger(row.id)?detail(row.id):null));
            items.push(...batch.filter(Boolean));
          }
        }
      }
      if (u.pathname !== '/verify') {
        if (responseCache.size >= 100)
          responseCache.delete(responseCache.keys().next().value!);
        responseCache.set(cacheKey, { expires: Date.now() + 300000, items,hasMore });
      }
      return reply({ items,hasMore });
    } catch (e) {
      return reply(
        {
          error:
            e instanceof ApiError || e instanceof HardcoverError || e instanceof SemanticError
              ? e.message
              : 'Catalog service temporarily unavailable.',
        },
        e instanceof ApiError || e instanceof SemanticError ? e.status : 502,
      );
    }
  },
};
