import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog} from '../lib/catalog.ts';
import {features,vocabularyFor,itemVector,tasteVector,cosineSimilarity,cosineDiscovery,ratingSignal} from '../lib/cosine-discovery.ts';
const media=(id,tags,type='Book')=>({id,title:id,creator:'Writer '+id,type,tags,description:''});
test('stable shared vocabulary unifies facets and deduplicates spelling variants',()=>{
 const a={...media('a',[' Survival ','survival']),themes:['survival'],moods:['Emotional'],keywords:['custom_tag'],genres:['dystopian']};
 const b=media('b',['magic']);const vocab=vocabularyFor([a,b]);
 assert.deepEqual(vocab,vocabularyFor([b,a]));assert.deepEqual(features(a),['custom-tag','dystopian','emotional','survival']);
 assert.equal(itemVector(a,vocab).reduce((s,x)=>s+x),4);
 assert.deepEqual(itemVector(media('unknown',['outside-vocabulary']),vocab),vocab.map(()=>0));
});
test('cosine is actual normalized dot product, including zero and signed vectors',()=>{
 assert.equal(cosineSimilarity([1,0],[1,0]),1);assert.equal(cosineSimilarity([1,0],[0,1]),0);
 assert.ok(Math.abs(cosineSimilarity([1,1],[1,0])-1/Math.sqrt(2))<1e-12);
 assert.equal(cosineSimilarity([-1,0],[1,0]),-1);assert.equal(cosineSimilarity([],[]),0);assert.equal(cosineSimilarity([0,0],[1,1]),0);
 assert.throws(()=>cosineSimilarity([1],[1,0]));assert.throws(()=>cosineSimilarity([NaN],[1]));
});
test('ratings produce signed weights, cancellation is safe and creator credits are excluded',()=>{
 assert.deepEqual([1,2,3,4,5].map(ratingSignal),[-2,-1,0,1,2]);assert.equal(ratingSignal(6),0);
 const items=[media('a',['survival']),media('b',['survival'])],v=vocabularyFor(items);
 assert.deepEqual(tasteVector(items,{a:5,b:1},v),[0]);assert.deepEqual(tasteVector(items,{a:3},v),[0]);
 assert.deepEqual(v,['survival']);assert.deepEqual(tasteVector([...items,items[0]],{a:5},v),[2]);assert.deepEqual(tasteVector(items,{a:4},v),[1]);
});
test('changed ratings change profile and rank, unseen library items and duplicate works are excluded',()=>{
 const items=[media('a',['survival']),media('b',['romance']),media('x',['survival'],'TV'),media('y',['romance'],'Movie')];
 const first=cosineDiscovery(items,{mode:'for-you',ratings:{a:5,b:4}}),second=cosineDiscovery(items,{mode:'for-you',ratings:{a:4,b:5}});
 assert.notDeepEqual(first.query,second.query);assert.equal(first.results[0].id,'x');assert.equal(second.results[0].id,'y');
 assert.ok(!first.results.some(x=>['a','b'].includes(x.id)));
 assert.equal(cosineDiscovery(items,{mode:'for-you',ratings:{a:5},library:[items[2]]}).results.length,0);
 const duplicate={...items[2],id:'duplicate'};assert.equal(cosineDiscovery([...items,duplicate],{mode:'based-on',ratings:{},seed:items[0]}).results.length,1);
});
test('both modes use the same vectors; category filtering preserves scores and descending order',()=>{
 const seed=catalog[0],run=cosineDiscovery(catalog,{mode:'based-on',ratings:{},seed});
 const profile=cosineDiscovery(catalog,{mode:'for-you',ratings:{[seed.id]:5}});
 assert.deepEqual(run.query.map(x=>x*2),profile.query);assert.deepEqual(run.results.map(x=>[x.id,x.score]),profile.results.map(x=>[x.id,x.score]));
 assert.ok(run.results.some(x=>x.type!==seed.type));
 for(const category of ['Book','Movie','TV','Music','Game']){
  const filtered=cosineDiscovery(catalog,{mode:'based-on',ratings:{},seed,category});
  assert.deepEqual(filtered.results.map(x=>[x.id,x.score]),run.results.filter(x=>x.type===category).map(x=>[x.id,x.score]));
 }
 assert.ok(run.results.every((x,i)=>!i||run.results[i-1].score>=x.score));
 const alternate=cosineDiscovery(catalog,{mode:'based-on',ratings:{},seed:catalog.find(x=>x.id!==seed.id&&x.tags.includes('romance'))});
 assert.notDeepEqual(run.results.map(x=>x.id),alternate.results.map(x=>x.id));
});
test('explanations reflect real signed dot-product contributions and empty profiles stay empty',()=>{
 const items=[media('a',['survival']),media('b',['romance']),media('c',['survival','romance'],'TV')];
 const run=cosineDiscovery(items,{mode:'for-you',ratings:{a:5,b:2}}),candidate=run.results[0];
 assert.deepEqual(candidate.sharedTags,['survival']);assert.ok(candidate.contributions.find(x=>x.feature==='romance').contribution<0);
 assert.equal(cosineDiscovery(items,{mode:'for-you',ratings:{}}).results.length,0);
 assert.equal(cosineDiscovery(items,{mode:'for-you',ratings:{a:1}}).hasPositiveSignal,false);
});
