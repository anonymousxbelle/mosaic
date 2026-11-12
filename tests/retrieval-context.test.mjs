import test from 'node:test';
import assert from 'node:assert/strict';
import {retrievalClass,retrievalClassCompatible,sportSubject} from '../lib/retrieval-context.ts';
import {seedTopic} from '../lib/features.ts';
import {recommend,vector} from '../lib/recommendations.ts';
import {unifiedRank} from '../lib/unified-ranking.ts';
const item=(id,tags,description='',sourceGenreLabels=[])=>({id,title:id,creator:'Writer',type:'Book',tags,description,sourceGenreLabels});
test('story/reference separation generalizes to sports, mystery and romance without title rules',()=>{
 for(const genre of ['sports','mystery','romance']){
  const seed=item('story',['fiction',genre]);
  const manual=item('manual',[genre],'This book provides step-by-step instructions.', ['Handbooks']);
  assert.equal(retrievalClassCompatible(seed,manual),false);
  assert.equal(retrievalClassCompatible(seed,item('novel',[genre],'',['Fiction'])),true);
 }
 assert.equal(retrievalClass(item('character',['mystery'],'A detective reads a manual while investigating a crime.')),'fiction');
 assert.equal(retrievalClass(item('unknown',['sports'])),'unknown');
});
test('sport-specific retrieval uses central evidence and works across media',()=>{
 const seed={...item('team',['sports','drama'],'A high school volleyball team trains for a championship.'),type:'TV'};
 assert.equal(seedTopic(seed),'volleyball');
 assert.equal(sportSubject(item('passing',[],'She briefly watches volleyball in a single scene.')),undefined);
 const same=item('novel',['sports','fiction'],'A volleyball team competes in a tournament.');
 const wrong=item('other',['sports','fiction'],'A basketball team competes in a tournament.');
 assert.deepEqual(recommend([same,wrong],vector(seed.tags),'Book',[],'sports',seed).map(x=>x.id),['novel']);
});
test('unknown class cannot outrank confirmed compatible fiction solely through external scores',()=>{
 const seed=item('seed',['fiction','sports']);
 const known={...item('known',['fiction','sports']),score:0.1};
 const unknown={...item('unknown',['sports']),score:1};
 assert.equal(unifiedRank([unknown,known],seed,{}, {unknown:1,known:0})[0].id,'known');
});

