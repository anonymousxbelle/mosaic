import test from 'node:test';
import assert from 'node:assert/strict';
import {seedTopic} from '../lib/features.ts';
import {recommend,vector} from '../lib/recommendations.ts';
import {retrieveBooks} from '../lib/book-api.ts';
const seed={id:'seed',title:'A magical adventure',creator:'Writer',type:'Book',genres:['fantasy'],tags:['fantasy','magic','friendship','magical-school'],description:''};
test('core fantasy and magic eligibility applies across media before scoring',()=>{
 const entries=['Book','Movie','TV'].flatMap(type=>[
 {...seed,id:type,title:type,type,tags:['fantasy','magic']},
 {...seed,id:type+'-friendship',type,tags:['friendship'],genres:['drama']},
 {...seed,id:type+'-no-magic',type,tags:['fantasy','friendship']},
 ]);
 assert.equal(seedTopic(seed),'magic');
 const matches=recommend(entries,vector(seed.tags),'All',[],'fantasy',seed);
 assert.deepEqual(new Set(matches.map(x=>x.id)),new Set(['Book','Movie','TV']));
 assert.equal(seedTopic({...seed,genres:['drama'],tags:['drama','friendship']}),undefined);
 assert.equal(seedTopic({...seed,genres:['sports'],tags:['sports','basketball','friendship']}),'basketball');
});
test('book queries retain core requirements and enrich uncertain subjects before rejection',async()=>{
 const old=fetch;const queries=[];
 globalThis.fetch=async raw=>{
  const url=new URL(raw);
  if(url.pathname==='/search.json'){
   queries.push(url.searchParams.get('q'));
   return Response.json({docs:[{key:'/works/OL9999876W',title:'Uncertain magic',author_name:['Writer'],subject:['Fantasy']}],numFound:1});
  }
  return Response.json({description:'Wizards learn magic and discover an enchanted world.',subjects:['Fantasy','Magic']});
 };
 try{
  const result=await retrieveBooks(seed.tags,undefined,i=>i.tags.includes('magic'),'fantasy','magic');
  assert.ok(queries.length);assert.ok(queries.every(q=>q.includes('subject:"fantasy"') && q.includes('subject:"magic"')));
  assert.equal(result.items.length,1);assert.ok(result.items[0].tags.includes('magic'));
 }finally{globalThis.fetch=old;}
});
