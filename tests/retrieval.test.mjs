import test from 'node:test';
import assert from 'node:assert/strict';
import {retrievePages,cachedCatalog} from '../lib/retrieval.ts';
import worker from '../backend/worker.ts';
const item=(id,tags=['fantasy'])=>({id,externalId:id,provider:'Open Library',type:'Book',title:id,creator:'Writer',description:'',tags,verifiedAt:new Date().toISOString(),sourceUrl:'https://openlibrary.org/works/'+id});
test('rejected first pages trigger more retrieval and alternate plans retain results',async()=>{
 const calls=[];
 const result=await retrievePages(['subject','related'],async(plan,page)=>{
  calls.push([plan,page]);
  if(plan==='related')throw Error('Provider unavailable');
  return {items:[item('page'+page,page===1?['friendship']:['fantasy'])],hasMore:true};
 },x=>x.tags.includes('fantasy'),undefined,1);
 assert.deepEqual(calls,[['subject',1],['related',1],['subject',2]]);
 assert.deepEqual(result.items.map(x=>x.id),['page2']);
 assert.equal(result.stats.rejected,1);assert.equal(result.stats.failedQueries,1);
 assert.ok(cachedCatalog().some(x=>x.id==='page2'));
});
test('retrieval stops at three pages and deduplicates without relaxing eligibility',async()=>{
 let count=0;
 const result=await retrievePages(['a'],async()=>{count++;return {items:[item('repeat')],hasMore:true};},()=>true);
 assert.equal(count,3);assert.equal(result.items.length,1);assert.equal(result.stats.examined,1);
});
test('a full non-anime pool does not prevent additional anime retrieval',async()=>{
 const result=await retrievePages(['a'],async(_,page)=>({items:[item('style'+page,page===1?['sports']:['sports','anime'])],hasMore:true}),()=>true,undefined,1,x=>x.tags.includes('anime'));
 assert.equal(result.stats.pages,2);
});
test('gateway validates pagination and supports cached distinct related pages',async()=>{
 const env={ALLOWED_ORIGIN:'https://anonymousxbelle.github.io',TMDB_TOKEN:'fake',CATALOG_LIMITER:{limit:async()=>({success:true})}};
 for(const query of ['page=0','page=99','related=bad'])assert.equal((await worker.fetch(new Request('https://api.test/discover?type=TV&'+query),env)).status,400);
 const old=fetch,urls=[];
 globalThis.fetch=async(url)=>{
  urls.push(String(url));
  if(String(url).includes('/recommendations'))return new Response(JSON.stringify({results:[{id:999}],total_pages:3}));
  return new Response(JSON.stringify({id:999,name:'Basketball example',overview:'Basketball team',genres:[{name:'Animation'}],origin_country:['JP']}));
 };
 try{
  const request=page=>worker.fetch(new Request('https://api.test/discover?type=TV&related=45783&page='+page),env);
  const one=await(await request(1)).json();await request(1);await request(2);
  assert.equal(one.hasMore,true);assert.ok(one.items[0].tags.includes('basketball'));
  assert.equal(urls.filter(x=>x.includes('recommendations')).length,2);
  assert.ok(urls.some(x=>x.includes('recommendations?page=2')));
 }finally{globalThis.fetch=old;}
});
