import test from 'node:test';
import assert from 'node:assert/strict';
import {sportsCentrality} from '../lib/tag-centrality.ts';
import {detailedFeatures,primaryGenre} from '../lib/features.ts';
import {effectiveTags} from '../lib/tags.ts';
test('sports-driven plot qualifies, passing mention does not',()=>{
 assert.equal(sportsCentrality('A basketball team trains to win the championship.',[]),'central');
 assert.equal(sportsCentrality('She briefly watches basketball before investigating a murder.',[]),'incidental');
 assert.ok(!detailedFeatures('A lawyer plays basketball once.',[]).includes('sports'));
});
test('substantial sport subject does not become a genre anchor',()=>{
 assert.equal(sportsCentrality('An essay explores basketball and its cultural meaning.',[]),'substantial');
 const tags=detailedFeatures('An essay explores basketball and its cultural meaning.',[]);
 assert.ok(tags.includes('basketball'));assert.ok(!tags.includes('sports'));
 assert.notEqual(primaryGenre({tags}),'sports');
});
test('old automatic sports tags are corrected but deliberate manual tags remain',()=>{
 const item={id:'x',title:'X',creator:'',type:'Book',description:'She briefly watches basketball before investigating a murder.',tags:['sports','basketball','mystery'],sourceGenreLabels:['Mystery']};
 assert.deepEqual(effectiveTags(item),['mystery']);
 assert.ok(effectiveTags(item,{added:['basketball'],hidden:[]}).includes('basketball'));
});

