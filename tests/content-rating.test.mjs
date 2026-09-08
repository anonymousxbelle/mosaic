import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdult, inContentSection, contentLabel } from '../lib/content-rating.ts';
import { normalizeResults, validStoredItem } from '../lib/media-api.ts';
import { restoreLibrary } from '../lib/library-storage.ts';
import { tmdbRecord } from '../backend/worker.ts';
test('explicit books are separated; romance and unknown ratings are not guessed', () => {
 const books=normalizeResults('Book',{results:[{kind:'ebook',trackId:1,trackName:'One',trackExplicitness:'explicit'},{kind:'ebook',trackId:2,trackName:'Two',genres:['Romance']},{kind:'ebook',trackId:3,trackName:'Three',genres:['Erotica']}]});
 assert.deepEqual(books.map(isAdult),[true,false,true]);
 assert.equal(inContentSection(books[0],false),false);
 assert.equal(contentLabel(books[1]),'Content rating unknown');
 const marked={...books[1],adultMarked:true};
 const restored=restoreLibrary(JSON.stringify({version:1,added:[marked]}),[]);
 assert.equal(isAdult(restored.added[0]),true);
 assert.equal(validStoredItem({...marked,adultMarked:'false'}),false);
 assert.equal(isAdult({...marked,type:'Music'}),false);
});
test('TMDB adult flags and mature certifications are honored without treating absent ratings as safe',()=>{
 const base={id:1,title:'A',name:'A'};
 assert.equal(isAdult(tmdbRecord({...base,adult:true},'Movie')),true);
 assert.equal(isAdult(tmdbRecord({...base,release_dates:{results:[{iso_3166_1:'US',release_dates:[{certification:'R'}]}]}},'Movie')),true);
 assert.equal(isAdult(tmdbRecord({...base,content_ratings:{results:[{iso_3166_1:'US',rating:'TV-MA'}]}},'TV')),true);
 assert.equal(contentLabel(tmdbRecord(base,'TV')),'Content rating unknown');
});
