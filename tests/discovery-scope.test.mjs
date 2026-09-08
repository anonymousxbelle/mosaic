import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverMedia, normalizeResults } from '../lib/media-api.ts';
import { restoreLibrary } from '../lib/library-storage.ts';
import { discoveryCategories } from '../lib/recommendations.ts';
test('paused music remains restorable but is not a discovery category',()=>{
 assert.equal(discoveryCategories.includes('Music'),false);
 const item=normalizeResults('Music',{results:[{kind:'song',trackId:12,trackName:'Saved song',primaryGenreName:'Alternative'}]})[0];
 const restored=restoreLibrary(JSON.stringify({version:1,added:[item],ratings:{[item.id]:5}}),[]);
 assert.equal(restored.added[0].type,'Music');assert.equal(restored.ratings[item.id],5);
});
test('unconfigured discovery never sends a genre as a title query',async()=>{
 const original=globalThis.fetch;let called=false;
 globalThis.fetch=async()=>{called=true;throw new Error('Unexpected title search');};
 try {const found=await discoverMedia(['Music','Book','TV','Movie','Game'],['alternative']);assert.equal(called,false);assert.deepEqual(found.items,[]);assert.deepEqual(found.failures,['Book','TV','Movie','Game']);}finally{globalThis.fetch=original;}
});
