import {catalogApi,validStoredItem,type CatalogMedia} from './media-api.ts';
import {sameWork,workIdentity} from './media-identity.ts';
import {hasSynopsis} from './catalog-text.ts';
import {seriesPosition} from './story-profile.ts';
const cache=new Map<string,{at:number;item:CatalogMedia|undefined}>();
export function mergeBookMetadata(item:CatalogMedia,other:CatalogMedia):CatalogMedia{
 if(other.provider!=='Hardcover' || !validStoredItem(other) || !sameWork(item,other))return item;
 return {...item,description:hasSynopsis(item.description)?item.description:other.description,
  synopsisStatus:hasSynopsis(item.description)||hasSynopsis(other.description)?'available':item.synopsisStatus,
  tags:[...new Set([...item.tags,...other.tags])],genres:[...new Set([...(item.genres||[]),...(other.genres||[])])],
  seriesKey:other.seriesKey || item.seriesKey,seriesPosition:other.seriesPosition || item.seriesPosition || seriesPosition(other.description),
  adult:item.adult || other.adult || undefined,metadataSourceUrl:other.sourceUrl};
}
export async function enrichBookAcrossSources(item:CatalogMedia,signal?:AbortSignal):Promise<CatalogMedia>{
 if(!catalogApi || item.provider!=='Open Library')return item;
 const key=workIdentity(item),saved=cache.get(key);
 if(saved && Date.now()-saved.at<600000)return saved.item?mergeBookMetadata(item,saved.item):item;
 try{
  const response=await fetch(catalogApi+'/search?'+new URLSearchParams({type:'Book',q:item.title.slice(0,100)}),{
   credentials:'omit',signal:AbortSignal.any([signal || new AbortController().signal,AbortSignal.timeout(6000)])});
  if(!response.ok)return item;
  const data=await response.json() as {items?:unknown[]};
  const match=Array.isArray(data.items)?data.items.filter(validStoredItem).find((x:CatalogMedia)=>x.provider==='Hardcover' && sameWork(item,x)):undefined;
  if(cache.size>=60)cache.delete(cache.keys().next().value!);
  cache.set(key,{at:Date.now(),item:match});return match?mergeBookMetadata(item,match):item;
 }catch(error){if(signal?.aborted)throw error;return item;}
}
