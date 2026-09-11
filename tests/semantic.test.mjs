import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../backend/worker.ts';
import {semanticText,compareDescriptions} from '../lib/semantic.ts';
const text='A basketball team learns to work together through difficult competitions.';
const base={ALLOWED_ORIGIN:'https://anonymousxbelle.github.io'};
const req=body=>new Request('https://api.test/semantic',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const input={seed:{id:'seed',text},items:[{id:'other',text:text+' Their rivals improve.'}]};
test('semantic endpoint validates input and configuration',async()=>{
 assert.equal((await worker.fetch(req(input),base)).status,503);
 assert.equal((await worker.fetch(req({...input,items:Array(25).fill(input.items[0])}),base)).status,400);
 assert.equal((await worker.fetch(req({...input,items:[input.items[0],input.items[0]]}),base)).status,400);
 assert.equal((await worker.fetch(req({text:'a'.repeat(41000)}),base)).status,413);
 assert.equal((await worker.fetch(new Request('https://api.test/semantic'),base)).status,405);
 const forbidden=new Request(req(input),{headers:{Origin:'https://untrusted.test'}});
 assert.equal((await worker.fetch(forbidden,base)).status,403);
});
test('semantic endpoint batches, caches by text, and returns finite similarities',async()=>{
 let calls=0;
 const env={...base,AI_LIMITER:{limit:async()=>({success:true})},AI:{run:async(model,{text})=>{
  calls++;assert.equal(model,'@cf/baai/bge-small-en-v1.5');
  return {data:text.map(()=>[1,...Array(383).fill(0)])};
 }}};
 const result=await (await worker.fetch(req(input),env)).json();
 assert.equal(result.scores.other,1);
 await worker.fetch(req({...input,seed:{...input.seed,id:'another-id'}}),env);assert.equal(calls,1);
 const denied={...env,AI_LIMITER:{limit:async()=>({success:false})}};
 assert.equal((await worker.fetch(req({...input,seed:{id:'s',text:text+' Uncached.'}}),denied)).status,429);
});
test('invalid or failed AI output does not leak upstream errors',async()=>{
 const env={...base,AI_LIMITER:{limit:async()=>({success:true})},AI:{run:async()=>({data:[[NaN]]})}};
 const fresh={...input,seed:{id:'s',text:text+' Different metadata.'}};
 assert.equal((await worker.fetch(req(fresh),env)).status,502);
 env.AI.run=async()=>{throw Error('sensitive upstream detail');};
 const response=await worker.fetch(req(fresh),env);assert.equal(response.status,502);
 assert.ok(!(await response.text()).includes('sensitive'));
});
test('client sends only IDs and cleaned descriptions and rejects unavailable AI',async()=>{
 const old=fetch;let payload;
 globalThis.fetch=async(_,init)=>{payload=JSON.parse(init.body);return Response.json({scores:{other:0.8,unrequested:1}});};
 try{
  const seed={id:'seed',description:text,tags:['private-tag'],title:'Seed'},other={...seed,id:'other'};
  assert.deepEqual(await compareDescriptions('https://api.test',seed,[other]),{other:0.8});
  assert.deepEqual(Object.keys(payload.seed),['id','text']);assert.ok(!JSON.stringify(payload).includes('private-tag'));
  globalThis.fetch=async()=>new Response('',{status:429});
  await assert.rejects(compareDescriptions('https://api.test',seed,[other]));
 }finally{globalThis.fetch=old;}
 assert.ok(!semanticText({description:'<p>'+text+'</p><p>Praise for this book: amazing!</p>'}).includes('Praise'));
});
