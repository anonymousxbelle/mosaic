import test from 'node:test';
import assert from 'node:assert/strict';
import {recommend,vector,diversify} from '../lib/recommendations.ts';
import {unifiedRank} from '../lib/unified-ranking.ts';
import {storyProfile} from '../lib/story-profile.ts';
import {extractTags} from '../lib/media-api.ts';
const seed={id:'s',type:'TV',title:'Example seed',creator:'Creator',genres:['mystery'],tags:['mystery','detective-fiction','history','anime'],description:"A servant in the emperor's palace is solving medical mysteries."};
test('historical court mystery remains eligible without a detective fiction label',()=>{
 const court={...seed,id:'court',title:'Unrelated title',tags:['mystery','history','anime','fantasy'],description:'An imperial consort in the inner palace uncovers secrets for the emperor.'};
 const modern={...seed,id:'modern',tags:['mystery','detective-fiction','anime'],description:'A present-day detective solves murders at a school.'};
 const base=recommend([modern,court],vector(seed.tags),'All',[],'mystery',seed);
 assert.ok(base.some(x=>x.id==='court'));
 const ranked=unifiedRank(base,seed,{modern:[{rank:1}]},{modern:1,court:0});
 assert.equal(ranked[0].id,'court');assert.equal(diversify(ranked)[0].id,'court');
 assert.ok(storyProfile(seed).setting.includes('imperial court'));assert.ok(extractTags(seed.description,[]).includes('imperial-court'));
});
test('a palace mention alone does not invent a historical era',()=>{
 const futuristic={...seed,tags:['mystery'],genres:['mystery'],description:'An emperor rules from a palace on a spaceship.'};
 assert.deepEqual(storyProfile(futuristic).era,[]);
});

test('animation discovery uses genre filtering without a redundant anime keyword',async()=>{
 const {default:worker}=await import('../backend/worker.ts');const old=fetch,calls=[];
 globalThis.fetch=async raw=>{const url=new URL(raw);calls.push(url);return Response.json(url.pathname.includes('/genre/')?{genres:[{id:16,name:'Animation'},{id:9648,name:'Mystery'}]}:{results:[],total_pages:1});};
 try{
 const r=await worker.fetch(new Request('https://api.test/discover?type=TV&tags=mystery,animation,anime'),{CATALOG_LIMITER:{limit:async()=>({success:true})},TMDB_TOKEN:'test-only',ALLOWED_ORIGIN:'https://anonymousxbelle.github.io'});
 assert.equal(r.status,200);assert.ok(!calls.some(x=>x.pathname.includes('search/keyword')));
 const request=calls.find(x=>x.pathname.includes('discover/tv'));assert.ok(request);assert.equal(request.searchParams.get('with_genres'),'16,9648');assert.equal(request.searchParams.get('with_keywords'),'');
 }finally{globalThis.fetch=old;}
});
