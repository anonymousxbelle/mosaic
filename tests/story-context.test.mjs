import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesStoryContext,storySearchTerms} from '../lib/story-profile.ts';
import {unifiedRank} from '../lib/unified-ranking.ts';
for(const type of ['Book','TV','Movie'])void test(`${type}: historical romance setting outweighs provider and AI scores`,()=>{
 const seed={id:'seed',title:'Seed',type,tags:['romance','historical-romance'],genres:['romance'],description:'In Regency England, a marriage of convenience changes two lives.'};
 const close={...seed,id:'close',title:'Different story',type:type==='Book'?'Movie':'Book',score:.2};
 const broad={...seed,id:'broad',title:'Broad match',description:'In Victorian London, former lovers reunite.',score:1};
 assert.ok(matchesStoryContext(seed,close));assert.ok(!matchesStoryContext(seed,broad));
 assert.deepEqual(storySearchTerms(seed),['regency','marriage of convenience']);
 assert.equal(unifiedRank([broad,close],seed,{broad:[{rank:1}]},{broad:1})[0].id,'close');
});
void test('unknown metadata is not treated as confirmed context',()=>{
 const seed={id:'s',title:'Seed',type:'Movie',tags:['science-fiction'],description:'On a space station, a crew fights for survival.'};
 assert.ok(storySearchTerms(seed).includes('space'));
 assert.ok(!matchesStoryContext(seed,{...seed,description:''}));
});
void test('TMDB context searches retain the genre and advertise additional pages',async()=>{
 const {default:worker}=await import('../backend/worker.ts');const old=fetch,calls=[];
 globalThis.fetch=async raw=>{const u=new URL(raw);calls.push(u);return Response.json(u.pathname.includes('/genre/')?{genres:[{id:10749,name:'Romance'}]}:u.pathname.includes('search/keyword')?{results:[{id:42,name:'regency'}]}:{results:[],total_pages:6});};
 try{
 const response=await worker.fetch(new Request('https://api.test/discover?type=Movie&tags=romance&context=regency&page=3'),{CATALOG_LIMITER:{limit:async()=>({success:true})},TMDB_TOKEN:'test-only',ALLOWED_ORIGIN:'https://anonymousxbelle.github.io'});
 assert.equal(response.status,200);assert.equal((await response.json()).hasMore,true);
 const discover=calls.find(u=>u.pathname.includes('discover/movie'));assert.equal(discover.searchParams.get('with_keywords'),'42');assert.equal(discover.searchParams.get('with_genres'),'10749');
 }finally{globalThis.fetch=old;}
});

void test('anime is a distinct subset of animation, never its synonym',async()=>{
 const {extractTags}=await import('../lib/media-api.ts');
 const anime=extractTags('', ['Anime']);assert.ok(anime.includes('anime'));assert.ok(anime.includes('animation'));
 const animation=extractTags('', ['Animation']);assert.ok(animation.includes('animation'));assert.ok(!animation.includes('anime'));
});
