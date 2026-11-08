import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSuggestions,reviewSuggestion,restoreAnalyses,acceptedAnalysisTags} from '../lib/ai-tagging.ts';
import {effectiveTags,restoreTagEdits} from '../lib/tags.ts';
import {cosine,vector} from '../lib/recommendations.ts';
import {analyzeTags} from '../backend/tag-analysis.ts';
const source={text:'A group of strangers forms a chosen family while facing difficult choices together.',provider:'Test catalog',url:'https://example.com/item',retrievedAt:'2026-11-08'};
const item={id:'test',title:'Test',type:'Book',creator:'',description:'',tags:[]};
const suggestion={tag:'found-family',kind:'theme',proposed:false,quote:'strangers forms a chosen family',reason:'A chosen family forms.',confidence:0.8,basis:'explicit'};
function analysis(){return {id:'analysis',itemId:item.id,model:'test-model',promptVersion:'v1',taxonomyRevision:'revision',createdAt:'2026-11-08',source,suggestions:validateSuggestions([suggestion],source,item)};}
test('pending and rejected tags never alter cosine; accepted tags do and survive restoration',()=>{
 const a=analysis();const edits={added:[],hidden:[],analyses:[a]};
 const score=e=>cosine(vector(effectiveTags(item,e)),vector(['found-family']));
 assert.equal(score(edits),0);
 const rejected=reviewSuggestion(a,0,'rejected',item,undefined,'Unsupported');
 assert.equal(score({...edits,analyses:[rejected]}),0);
 const accepted=reviewSuggestion(a,0,'accepted',item);
 assert.equal(score({...edits,analyses:[accepted]}),1);
 const restored=restoreTagEdits({test:{...edits,analyses:[accepted]}},[item]);
 assert.equal(score(restored.test),1);
 assert.equal(restored.test.analyses[0].source.text,source.text);
});
test('corrections preserve model evidence and new analyses do not erase review decisions',()=>{
 const a=reviewSuggestion(analysis(),0,'accepted',item,'friendship','Better fit');
 assert.deepEqual(acceptedAnalysisTags([a,analysis()],item),['friendship']);
 assert.equal(a.suggestions[0].tag,'found-family');
 assert.equal(a.suggestions[0].reviewReason,'Better fit');
 const rejected=reviewSuggestion(a,0,'rejected',item);
 assert.deepEqual(acceptedAnalysisTags([rejected],item),[]);
 assert.equal(rejected.suggestions[0].history.length,2);
 assert.equal(restoreAnalyses([rejected],item)[0].suggestions[0].history.length,2);
 assert.deepEqual(restoreAnalyses([a],{...item,id:'other'}),[]);
});
test('unknown IDs, invented quotations, invalid confidence and duplicate tags fail closed',()=>{
 for(const patch of [{tag:'invented-tag'},{quote:'not in source'},{confidence:2},{kind:'setting'}])
   assert.throws(()=>validateSuggestions([{...suggestion,...patch}],source,item));
 assert.throws(()=>validateSuggestions([suggestion,suggestion],source,item));
 assert.throws(()=>validateSuggestions([suggestion],{...source,url:'javascript:alert(1)'},item));
});
test('new proposals remain separate until taxonomy approval; can map to an existing tag',()=>{
 const proposal={...suggestion,tag:'chosen-companions',proposed:true,definition:'People build enduring bonds by choice.'};
 const a={...analysis(),suggestions:validateSuggestions([proposal],source,item)};
 assert.throws(()=>reviewSuggestion(a,0,'accepted',item));
 assert.deepEqual(acceptedAnalysisTags([reviewSuggestion(a,0,'accepted',item,'found-family')],item),['found-family']);
});
const request=()=>new Request('https://example.com/analyze-tags',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify({itemId:item.id,type:item.type,source})});
test('backend is key-protected, rate limited and stamps validated pending suggestions',async()=>{
 let calls=0;
 const env={TAGGING_REVIEW_KEY:'test',AI_LIMITER:{limit:async()=>({success:true})},AI:{run:async(model,input)=>{
   calls++;assert.ok(input.messages[0].content.includes('not remembered title knowledge'));
   return {response:JSON.stringify({suggestions:[suggestion]})};}}};
 await assert.rejects(()=>analyzeTags(request(),{...env,TAGGING_REVIEW_KEY:'different'}),e=>e.status===401);
 await assert.rejects(()=>analyzeTags(request(),{...env,AI_LIMITER:{limit:async()=>({success:false})}}),e=>e.status===429);
 assert.equal(calls,0);
 const result=await analyzeTags(request(),env);
 assert.equal(result.suggestions[0].status,'pending');assert.equal(result.taxonomyRevision.length,64);
 assert.equal(result.source.url,source.url);assert.equal(calls,1);
 const invalid=await analyzeTags(request(),{...env,AI:{run:async()=>({response:{suggestions:[{...suggestion,quote:'invented'}]}})}});
 assert.equal(invalid.suggestions.length,0);assert.match(invalid.validationIssues[0].reason,/quote/);
});
test('provider failures produce safe AI-specific messages without leaking raw details',async()=>{
 for(const [message,status,pattern] of [
  ['Model not found: 7003 secret',503,/model is unavailable/],
  ['daily quota exceeded secret',429,/usage allowance/],
  ['429 too many requests secret',429,/rate limited/],
  ['internal failure secret',502,/Cloudflare AI could not/],
 ]){
  const env={TAGGING_REVIEW_KEY:'test',AI_LIMITER:{limit:async()=>({success:true})},AI:{run:async()=>{throw Error(message);}}};
  await assert.rejects(()=>analyzeTags(request(),env),e=>e.status===status && pattern.test(e.message) && !e.message.includes('secret'));
 }
});


test('mixed output retains valid pending rows and persists excluded-row diagnostics',async()=>{
 const env={TAGGING_REVIEW_KEY:'test',AI_LIMITER:{limit:async()=>({success:true})},AI:{run:async()=>({response:{suggestions:[suggestion,{...suggestion,tag:'friendship',quote:'invented'}]}})}};
 const result=await analyzeTags(request(),env);
 assert.equal(result.suggestions.length,1);assert.equal(result.suggestions[0].status,'pending');
 assert.equal(result.validationIssues.length,1);assert.equal(result.validationIssues[0].tag,'friendship');
 assert.deepEqual(acceptedAnalysisTags([result],item),[]);
 const restored=restoreAnalyses([result],item)[0];
 assert.deepEqual(restored.validationIssues,result.validationIssues);
 assert.deepEqual(acceptedAnalysisTags([reviewSuggestion(restored,0,'accepted',item)],item),['found-family']);
});

