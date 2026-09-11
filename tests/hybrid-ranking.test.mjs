import test from 'node:test';
import assert from 'node:assert/strict';
import {hybridRank} from '../lib/hybrid-ranking.ts';
import {recommend,vector} from '../lib/recommendations.ts';
import {retrievePages} from '../lib/retrieval.ts';
const item=(id,tags=['fantasy'],type='Book')=>({id,title:id,creator:id,type,tags,description:'',score:0.5});
test('retrieval keeps page positions and evidence from repeated queries',async()=>{
 const result=await retrievePages(['a','b'],async(plan,page)=>({items:[item('same'),item(plan+page)],hasMore:true}),()=>true,undefined,99);
 assert.equal(result.items.filter(x=>x.id==='same').length,1);
 assert.equal(result.evidence.same.length,6);
 assert.equal(result.evidence.a3[0].rank,6);
});
test('provider evidence resolves tag ties without multiplying duplicate votes',()=>{
 const rows=[item('a'),item('b')],proof={b:[{plan:'q',page:1,rank:1}],a:[{plan:'q',page:1,rank:20}]};
 const once=hybridRank(rows,proof);
 assert.equal(once[0].id,'b');
 assert.deepEqual(hybridRank(rows,{...proof,b:[...proof.b,...proof.b]}),once);
 assert.deepEqual(hybridRank(rows).map(x=>x.score),[0.5,0.5]);
});
test('hybrid never admits rejected topics or crosses the same-medium priority tier',()=>{
 const seed=item('seed',['sports','basketball','anime'],'TV');
 const pool=[item('basketball-book',['sports','basketball']),item('basketball-anime',['sports','basketball','anime'],'TV'),item('football',['sports','football','anime'],'TV')];
 const base=recommend(pool,vector(seed.tags),'All',[],'sports',seed);
 const result=hybridRank(base,{'basketball-book':[{rank:1,plan:'x',page:1}]},{'basketball-book':1,football:1});
 assert.equal(result[0].id,'basketball-anime');assert.ok(!result.some(x=>x.id==='football'));
});
test('semantic signal resolves equal matches without modifying baseline data',()=>{
 const rows=[item('a'),item('b')];
 assert.equal(hybridRank(rows,{}, {a:0.2,b:0.9})[0].id,'b');
 assert.equal(rows[0].score,0.5);
});
