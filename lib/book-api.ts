import type { CatalogMedia } from './media-api';
import { extractTags, plainText } from './media-api.ts';
import { normalizeGenres } from './genres.ts';
import { bookSubjects, specificity } from './features.ts';
import { retrievePages } from './retrieval.ts';
import { bookSynopsis, hasSynopsis } from './catalog-text.ts';
import { recommend, vector, diversify } from './recommendations.ts';
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
  const description = bookSynopsis(plainText(
    typeof row.description === 'string'
      ? row.description
      : row.description?.value,
  ));
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
    description,
    synopsisStatus:description?'available':'pending',
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
  const item = openLibraryRecord(row);
  if (!item) throw Error('Invalid book record.');
  return enrichBook(item,signal);
}
export async function enrichBook(item:CatalogMedia,signal?:AbortSignal):Promise<CatalogMedia>{
  if(item.provider!=='Open Library' || !/^OL\d+W$/.test(item.externalId))return item;
  const work=await request('/works/'+item.externalId+'.json',signal);
  const description=bookSynopsis(plainText(typeof work.description==='string'?work.description:work.description?.value));
  const subjects=Array.isArray(work.subjects)?work.subjects.filter((s:unknown)=>typeof s==='string'):[];
  return {...item,description:description || (hasSynopsis(item.description)?item.description:''),
    synopsisStatus:description || hasSynopsis(item.description)?'available':'unavailable',
    tags:[...new Set([...item.tags,...extractTags(description,subjects)])],
    genres:[...new Set([...(item.genres||[]),...normalizeGenres(subjects)])],
    adult:item.adult || subjects.some((s:string)=>/\berotica|erotic fiction\b/i.test(s)) || undefined,
  };
}
export async function retrieveBooks(tags:string[], signal?:AbortSignal, accept:(item:CatalogMedia)=>boolean=()=>true, anchor?:string, topic?:string) {
  const fiction=tags.includes('fiction') || tags.includes('fantasy') || tags.includes('magic');
  const subjects=[...new Set(tags.filter(t=>bookSubjects[t]).sort((a,b)=>specificity(b)-specificity(a)).map(t=>bookSubjects[t]))].slice(0,3);
  const core=[anchor && bookSubjects[anchor],topic && bookSubjects[topic]].filter((x):x is string=>!!x);
  const clauses=(values:string[])=>[...new Set(values)].map(s=>'subject:"'+s+'"').join(' AND ')+(fiction?' AND subject:fiction':'');
  const plans=[...new Set(subjects.map(s=>clauses([...core,s])))];
  if(core.length) { if(plans.length>=3)plans[2]=clauses(core);else plans.push(clauses(core)); }
  let detailBudget=8;
  const result=await retrievePages([...new Set(plans)].slice(0,3),async(q,page)=>{
    const data=await request('/search.json?'+new URLSearchParams({q,fields,limit:'30',page:String(page),lang:'en'}),signal);
    if(!Array.isArray(data.docs))throw Error('Unexpected book catalog response.');
    const items=data.docs.map(openLibraryRecord).filter((x:CatalogMedia|null):x is CatalogMedia=>!!x);
    // Search subjects can omit defining features: inspect a bounded number of
    // full records before rejecting uncertain candidates. Never infer a match
    // from the fact that the provider returned the title.
    for(let index=0;index<items.length && detailBudget>0;index++){
      if(accept(items[index]))continue;
      detailBudget--;
      try{items[index]=await enrichBook(items[index],signal);}catch(error){if(signal?.aborted)throw error;}
    }
    const total=data.numFound ?? data.num_found;
    return {items,hasMore:data.docs.length===30 && (typeof total!=='number' || page*30<total)};
  },accept,signal);
  // Hydrate the likely displayed matches, using the same ranking and diversity
  // as the result list. Tag-count order used to leave top recommendations blank.
  const leading=diversify(recommend(result.items,vector(tags),'Book',[],anchor),12);
  const rejected=new Set<string>();
  for(const candidate of leading){
    signal?.throwIfAborted();
    const index=result.items.findIndex(x=>x.id===candidate.id);
    const item=result.items[index];
    try {
      const enriched=await enrichBook(item,signal);
      if(accept(enriched))result.items[index]=enriched;else rejected.add(item.id);
    }catch(error){if(signal?.aborted)throw error;}
  }
  result.items=result.items.filter(x=>!rejected.has(x.id));result.stats.rejected+=rejected.size;result.stats.accepted=result.items.length;
  return result;
}
export async function discoverBooks(tags:string[],signal?:AbortSignal){
 return (await retrieveBooks(tags,signal)).items;
}
