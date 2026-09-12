import test from 'node:test';
import assert from 'node:assert/strict';
import {storyMatch,seriesPosition,sameSeries} from '../lib/story-profile.ts';
import {mergeBookMetadata} from '../lib/book-enrichment.ts';
import {recommend,vector} from '../lib/recommendations.ts';
import {validStoredItem} from '../lib/media-api.ts';
const seed={id:'openlibrary:OL123W',externalId:'OL123W',provider:'Open Library',sourceUrl:'https://openlibrary.org/works/OL123W',verifiedAt:new Date().toISOString(),title:'An Example',creator:'Example Author',type:'Book',genres:['fantasy'],tags:['fantasy','magic'],description:'At a school pupils learn magic and go on a quest.'};
const other={...seed,id:'hardcover:123',externalId:'123',provider:'Hardcover',sourceUrl:'https://hardcover.app/books/an-example',seriesKey:'hardcover:example',description:'The second book in the series follows pupils who learn magic at a school.'};
test('cross-source enrichment requires both identity and a validated source',()=>{
 const merged=mergeBookMetadata({...seed,description:''},other);
 assert.equal(merged.id,seed.id);assert.equal(merged.description,other.description);assert.equal(merged.seriesPosition,2);assert.equal(merged.metadataSourceUrl,other.sourceUrl);assert.ok(validStoredItem(merged));
 assert.equal(mergeBookMetadata(seed,{...other,creator:'Different Author'}),seed);
 assert.equal(mergeBookMetadata(seed,{...other,title:'A Different Work'}),seed);
 assert.equal(mergeBookMetadata(seed,{...other,sourceUrl:'https://evil.test'}),seed);
 assert.equal(mergeBookMetadata(seed,other).description,seed.description);
 assert.equal(validStoredItem({...merged,seriesPosition:-1}),false);
});
test('story evidence is grouped, missing text is neutral, series position is explicit',()=>{
 assert.ok(storyMatch(seed,other).reasons.includes('setting: school'));
 assert.equal(storyMatch(seed,{...other,description:'No synopsis supplied.'}).score,0);
 assert.equal(seriesPosition('The ninth book in the series continues the adventure.'),9);
 assert.equal(seriesPosition('Nine friends enter a school.'),undefined);
 assert.equal(sameSeries(seed,other),false);assert.equal(sameSeries(other,{...other,id:'different'}),true);
});
test('story method prefers matching story evidence and accessible entry points without bypassing genre',()=>{
 const items=[{...seed,id:'a',description:'A grim struggle for power at the royal court.'},{...seed,id:'b'},{...seed,id:'c',seriesPosition:9},{...seed,id:'d',genres:['drama'],tags:['friendship'],description:seed.description}];
 const ranked=recommend(items,vector(seed.tags),'All',[],'fantasy',seed,true);
 assert.equal(ranked[0].id,'b');assert.ok(ranked.findIndex(x=>x.id==='c')>ranked.findIndex(x=>x.id==='b'));assert.ok(!ranked.some(x=>x.id==='d'));
 const base=recommend(items,vector(seed.tags),'All',[],'fantasy',seed,false);assert.equal(base[0].score,base[1].score);
});
