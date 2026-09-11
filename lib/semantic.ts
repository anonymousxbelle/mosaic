import { bookSynopsis, hasSynopsis } from './catalog-text.ts';
import type { Media } from './recommendations';

export function semanticText(item:Pick<Media,'description'>):string {
 if(!hasSynopsis(item.description))return '';
 // Exclude titles, personal tags, and ratings. Compare the synopsis itself.
 return bookSynopsis(item.description).replace(/&(?:amp|quot|nbsp);/g,' ').replace(/\s+/g,' ').trim().slice(0,1200);
}
export async function compareDescriptions(api:string, seed:Media, items:Media[], signal?:AbortSignal) {
 const text=semanticText(seed);
 const eligible=items.filter(x=>semanticText(x).length>=32).slice(0,24);
 if(!api || text.length<32 || !eligible.length)throw Error('Descriptions unavailable');
 const response=await fetch(api+'/semantic',{
  method:'POST',headers:{'Content-Type':'application/json'},
  signal:AbortSignal.any([signal || new AbortController().signal,AbortSignal.timeout(12000)]),
  body:JSON.stringify({seed:{id:seed.id,text},items:eligible.map(x=>({id:x.id,text:semanticText(x)}))}),
 });
 if(!response.ok)throw Error('Description comparison unavailable');
 const data=await response.json() as {scores?:Record<string,number>};
 if(!data.scores || typeof data.scores!=='object')throw Error('Invalid comparison');
 const scores=data.scores;
 return Object.fromEntries(eligible.filter(x=>Number.isFinite(scores[x.id]) && Math.abs(scores[x.id])<=1)
  .map(x=>[x.id,scores[x.id]]));
}
