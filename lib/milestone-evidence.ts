import {normalizeResults,queryError,verifyMedia} from './media-api.ts';
import {toUnifiedRecord} from './unified-media.ts';
export const MILESTONE_STORAGE_KEY='mosaic-milestone-evidence-v1';
export async function liveEvidenceSearch(query:string,signal?:AbortSignal){
 const invalid=queryError(query);if(invalid)throw Error(invalid);
 const url='https://api.tvmaze.com/search/shows?'+new URLSearchParams({q:query.trim()});
 const response=await fetch(url,{signal:signal?AbortSignal.any([signal,AbortSignal.timeout(12000)]):AbortSignal.timeout(12000),credentials:'omit'});
 if(!response.ok)throw Error('Catalog request failed (HTTP '+response.status+'). Retry the search.');
 const raw=await response.json();
 const normalized=normalizeResults('TV',raw).map(toUnifiedRecord);
 return {capturedAt:new Date().toISOString(),provider:'TVmaze',request:{url,query:query.trim()},httpStatus:response.status,raw,normalized};
}
export async function verifyEvidenceSelection(item:Awaited<ReturnType<typeof liveEvidenceSearch>>['normalized'][number],signal?:AbortSignal){
 return verifyMedia(item,signal);
}
