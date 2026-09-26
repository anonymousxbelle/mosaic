import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {catalog} from '../lib/catalog.ts';
import {cosineDiscovery,itemVector} from '../lib/cosine-discovery.ts';
const hunger=catalog.find(x=>x.id==='hunger');
const romance=catalog.find(x=>x.type==='Book'&&x.tags.includes('romance'));
assert.ok(hunger&&romance);
const beforeRatings={[hunger.id]:5,[romance.id]:4},afterRatings={[hunger.id]:1,[romance.id]:5};
function capture(options){const run=cosineDiscovery(catalog,options);return {options,vocabulary:run.vocabulary,itemExample:{id:hunger.id,vector:itemVector(hunger,run.vocabulary)},profileVector:run.query,candidateScores:run.scored.map(x=>({id:x.id,title:x.title,type:x.type,score:x.score,contributions:x.contributions})),finalRankedResults:run.results.map(x=>({id:x.id,title:x.title,type:x.type,score:x.score,sharedFeatures:x.sharedTags}))};}
const before=capture({mode:'for-you',ratings:beforeRatings}),after=capture({mode:'for-you',ratings:afterRatings});
assert.notDeepEqual(before.profileVector,after.profileVector);assert.notDeepEqual(before.finalRankedResults.map(x=>x.id),after.finalRankedResults.map(x=>x.id));
assert.ok(new Set(before.finalRankedResults.map(x=>x.type)).size>1);
const basedOn=capture({mode:'based-on',ratings:{},seed:hunger,category:'Music'});assert.ok(basedOn.finalRankedResults.length);
const mixed=capture({mode:'for-you',ratings:{[hunger.id]:5,[catalog.find(x=>x.type==='Movie').id]:4,[catalog.find(x=>x.type==='TV').id]:5}});
await mkdir('evidence/week8',{recursive:true});
await writeFile('evidence/week8/algorithm-evidence.json',JSON.stringify({capturedAt:new Date().toISOString(),algorithm:'signed-cosine-v1',source:'data/catalog.json — curated fixture, not live API results',ratingSignals:{1:-2,2:-1,3:0,4:1,5:2},before,after,basedOn,mixed},null,2)+'\n');
console.log(JSON.stringify({before:before.finalRankedResults.slice(0,3),after:after.finalRankedResults.slice(0,3),bookToMusic:basedOn.finalRankedResults,mixedCategories:[...new Set(mixed.finalRankedResults.map(x=>x.type))]},null,2));
