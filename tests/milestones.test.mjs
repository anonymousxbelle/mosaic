import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog} from '../lib/catalog.ts';
import {validUnifiedRecord,toUnifiedRecord} from '../lib/unified-media.ts';
import {liveEvidenceSearch} from '../lib/milestone-evidence.ts';
import {queryError} from '../lib/media-api.ts';
import {profile,recommend} from '../lib/recommendations.ts';
test('25 JSON records share one schema across five media types and feed recommendations',()=>{
 assert.equal(catalog.length,25);assert.ok(catalog.every(validUnifiedRecord));
 for(const type of ['Book','Game','Music','Movie','TV'])assert.equal(catalog.filter(x=>x.type===type).length,5);
 const ratings={[catalog[0].id]:5};const taste=profile(catalog,ratings);assert.ok(Object.keys(taste).length);
 assert.ok(recommend(catalog,taste,'All',Object.keys(ratings)).length);
});
test('unified fields represent missing metadata as empty arrays without invented creators',()=>{
 const record=toUnifiedRecord({id:'x',title:'Test',type:'Game',creator:'Creator unavailable',tags:[],description:''});
 assert.ok(validUnifiedRecord(record));assert.deepEqual(record.creators,[]);assert.deepEqual(record.themes,[]);assert.deepEqual(record.moods,[]);
 const network=toUnifiedRecord({...record,id:'tvmaze:1',type:'TV',creator:'Netflix'});
 assert.deepEqual(network.creators,[], 'a network credit is not an author or creator');
});
test('empty or invalid search is rejected before fetching; unknown title can return no results',async(t)=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response('[]',{status:200});});
 await assert.rejects(liveEvidenceSearch(''),/at least/);await assert.rejects(liveEvidenceSearch('!!!'),/letters or numbers/);assert.equal(calls,0);
 const result=await liveEvidenceSearch('No matching title');assert.deepEqual(result.normalized,[]);assert.equal(calls,1);
 assert.ok(queryError('x'.repeat(101)));
});
test('failed API and malformed responses are surfaced, never replaced with fixtures',async(t)=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('Unavailable',{status:503}));
 await assert.rejects(liveEvidenceSearch('Example'),/HTTP 503/);
 globalThis.fetch=async()=>new Response('{}',{status:200});await assert.rejects(liveEvidenceSearch('Example'),/Unexpected TV/);
});
