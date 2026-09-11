import {extractTags,plainText} from '../lib/media-api.ts';
import {normalizeGenres} from '../lib/genres.ts';
import {bookSynopsis,hasSynopsis} from '../lib/catalog-text.ts';
type Row=Record<string,any>;
export class HardcoverError extends Error {}
export type HardcoverEnv={HARDCOVER_TOKEN?:string};
export function hardcoverRecord(row:Row){
 if(!row||typeof row!=='object')return null;
 const id=String(row.id||'');const slug=plainText(row.slug);const title=plainText(row.title).slice(0,500);
 if(!/^[1-9]\d{0,9}$/.test(id)||!title||!/^[a-z0-9][a-z0-9-]*$/.test(slug))return null;
 const strings=(x:unknown):string[]=>Array.isArray(x)?x.filter((v):v is string=>typeof v==='string').slice(0,20):[];
 const genres=strings(row.genres),moods=strings(row.moods),tags=strings(row.tags);
 const description=bookSynopsis(plainText(row.description));
 const series = strings(row.series_names)[0];
 const seriesKey = series?.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N} -]/gu,'').trim().slice(0,160);
 return {id:'hardcover:'+id,externalId:id,provider:'Hardcover',type:'Book',title,creator:plainText(strings(row.author_names).join(', ')).slice(0,500)||'Author unavailable',
 description:description||'No synopsis supplied by this catalog.',genres:normalizeGenres(genres),tags:extractTags(description,[...genres,...moods,...tags]),
 seriesKey:seriesKey?'hardcover:'+seriesKey:undefined,
 sourceUrl:'https://hardcover.app/books/'+slug,verifiedAt:new Date().toISOString(),year:Number.isInteger(row.release_year)?String(row.release_year):undefined,
 ratingCount:Number.isSafeInteger(row.ratings_count)&&row.ratings_count>=0?row.ratings_count:undefined,
 adult:genres.some(t=>/\berotica\b/i.test(t))||undefined};
}
async function query(env:HardcoverEnv,query:string,variables:Row){
 const token=(env.HARDCOVER_TOKEN||'').trim();if(!token)throw Error('Hardcover is not configured.');
 const r=await fetch('https://api.hardcover.app/v1/graphql',{method:'POST',headers:{Authorization:token.startsWith('Bearer ')?token:'Bearer '+token,'Content-Type':'application/json','User-Agent':'Mosaic seminar catalog (https://github.com/anonymousxbelle/mosaic)'},body:JSON.stringify({query,variables}),signal:AbortSignal.timeout(12000)});
 if(!r.ok){
  const details=await r.text();
  const field=/\bweights\b/i.test(details)?'weights':/\bfields\b/i.test(details)?'fields':/\bgenres\b/i.test(details)?'genres':/\bdescription\b/i.test(details)?'description':'request';
  throw new HardcoverError('Hardcover '+field+' failed (HTTP '+r.status+').');
 }
 const d=await r.json() as Row;if(d.errors||!d.data){
  const messages=JSON.stringify(d.errors||[]);
  const category=/field.*not found|unknown argument|unexpected.*field/i.test(messages)?'unsupported field':/expected.*(string|integer|array|list)|type.*mismatch/i.test(messages)?'argument type':/permission|access|authorized/i.test(messages)?'permission':/index|query_by|searchable/i.test(messages)?'search index':'provider rejection';
  throw new HardcoverError('Hardcover query failed: '+category+'.');
 }return d.data;
}
async function search(env:HardcoverEnv,text:string){
 const q='query Search($q: String!) { search(query: $q, query_type: "Book", per_page: 20, page: 1) { results } }';
 const data=await query(env,q,{q:text});
 let result=data.search?.results;if(typeof result==='string'){try{result=JSON.parse(result);}catch{throw Error('Invalid Hardcover response.');}}
 if(!Array.isArray(result?.hits))throw Error('Invalid Hardcover search response.');
 return result.hits.slice(0,20).map((hit:Row)=>hardcoverRecord(hit.document)).filter(Boolean);
}
export async function hardcoverBooks(env:HardcoverEnv,action:string,q:string,id:string,tags:string[]){
 if(action==='/search')return search(env,q);
 if(action==='/verify'){
  const d=await query(env,'query Verify($id: Int!) { books(where: {id: {_eq: $id}}, limit: 1) { id title slug description contributions { author { name } } } }',{id:Number(id)});
  const row=d.books?.find((x:Row)=>String(x.id)===id);if(!row)return [];
  const matches=await search(env,String(row.title).slice(0,100));
  const rich=matches.find((x:Row|null)=>x?.externalId===id);
  if(rich){
   const description=bookSynopsis(plainText(row.description));
   return [{...rich,description:hasSynopsis(rich.description)?rich.description:description,
    tags:[...new Set([...rich.tags,...extractTags(description,[])])]}];
  }
  const item=hardcoverRecord({...row,author_names:row.contributions?.map((x:Row)=>x.author?.name)});return item?[item]:[];
 }
 // The live search index rejected metadata-field queries. Keep discovery on
 // Open Library subject queries until Hardcover supports a verified equivalent.
 // Never fall back to searching genre words in book titles.
 return [];
}


