import type { CatalogMedia } from './media-api';
import { sameWork } from './media-identity.ts';
export type RetrievalStats = {examined:number;rejected:number;accepted:number;pages:number;failedQueries:number;cached:number};
export const emptyStats=():RetrievalStats=>({examined:0,rejected:0,accepted:0,pages:0,failedQueries:0,cached:0});
export type RetrievalEvidence={plan:string;page:number;rank:number};
export type RetrievalCursor = Record<string,{page:number;offset:number;done:boolean}>;
const pool=new Map<string,{at:number;item:CatalogMedia}>();
export function cachedCatalog():CatalogMedia[]{
 const now=Date.now();for(const [id,row] of pool)if(now-row.at>600000)pool.delete(id);
 return [...pool.values()].map(x=>x.item);
}
export function rememberCatalog(items:CatalogMedia[]){
 for(const item of items){pool.delete(item.id);pool.set(item.id,{at:Date.now(),item});}
 while(pool.size>400)pool.delete(pool.keys().next().value!);
}
// Round-robin query plans: inspect each source before expanding its next page.
// Never relax eligibility to reach a target. Preserve partial results on failure.
export async function retrievePages(
 plans:string[],
 fetchPage:(plan:string,page:number)=>Promise<{items:CatalogMedia[];hasMore:boolean}>,
 accept:(item:CatalogMedia)=>boolean,
 signal?:AbortSignal,
 target=30,
 preferred:(item:CatalogMedia)=>boolean=()=>true,
 maxPages=3,
 cursor:RetrievalCursor={},
){
 const items:CatalogMedia[]=[],stats=emptyStats(),seen=new Set<string>(),active=new Set(plans);
 const evidence:Record<string,RetrievalEvidence[]>={};
 const next:RetrievalCursor=Object.fromEntries(plans.map(plan=>[plan,{...(cursor[plan]||{page:1,offset:0,done:false})}]));
 for(const plan of plans)if(next[plan].done || next[plan].page>6)active.delete(plan);
 for(let round=1;round<=Math.min(6,Math.max(1,maxPages)) && active.size;round++){
  for(const plan of plans){
   if(!active.has(plan))continue;
   signal?.throwIfAborted();
   try{
    stats.pages++;
    const page=next[plan].page;
    const batch=await fetchPage(plan,page);rememberCatalog(batch.items);
    const offset=next[plan].offset;
    next[plan]={page:page+1,offset:offset+batch.items.length,done:!batch.hasMore || page>=6};
    if(next[plan].done)active.delete(plan);
    for(const [index,item] of batch.items.entries()){
     (evidence[item.id] ||= []).push({plan,page,rank:offset+index+1});
     if(seen.has(item.id))continue;seen.add(item.id);stats.examined++;
     if(!accept(item)){stats.rejected++;continue;}
     if(!items.some(x=>sameWork(x,item)))items.push(item);
    }
   }catch(error){if(signal?.aborted)throw error;stats.failedQueries++;active.delete(plan);}
  }
  if(items.filter(preferred).length>=target)break;
 }
 stats.accepted=items.length;return {items,stats,evidence,cursor:next,hasMore:Object.values(next).some(x=>!x.done && x.page<=6)};
}

