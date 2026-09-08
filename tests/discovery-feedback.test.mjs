import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendationEligible, connectionEvidence } from '../lib/discovery-feedback.ts';
import { normalizeResults, validStoredItem, validArtwork } from '../lib/media-api.ts';
import { restoreLibrary } from '../lib/library-storage.ts';
test('saved feedback survives reload and removes consumed/dismissed titles without inventing ratings', () => {
 const base=normalizeResults('Book',{results:[{kind:'ebook',trackId:20,trackName:'Example'}]})[0];
 for(const libraryState of ['later','experienced','dismissed']) {
  const saved=restoreLibrary(JSON.stringify({version:1,added:[{...base,libraryState}],ratings:{},tagEdits:{}}),[]);
  assert.equal(saved.added[0].libraryState,libraryState);
  assert.equal(recommendationEligible(saved.added[0],saved.ratings),false);
  assert.deepEqual(saved.ratings,{});
 }
 assert.equal(recommendationEligible(base,{}),true);
 assert.equal(recommendationEligible(base,{[base.id]:4}),false);
 assert.equal(validStoredItem({...base,libraryState:'invented'}),false);
});
test('explanations name only source titles with actual shared tags',()=>{
 const target={id:'a',tags:['mystery','friendship']};
 assert.deepEqual(connectionEvidence(target,[{id:'b',title:'B',tags:['mystery']},{id:'c',title:'C',tags:['romance']},{id:'a',title:'Self',tags:['mystery']}]),[{title:'B',tags:['mystery']}]);
});
test('artwork accepts known HTTPS catalog hosts and rejects arbitrary URLs',()=>{
 assert.equal(validArtwork('https://is1-ssl.mzstatic.com/image/example.jpg'),true);
 assert.equal(validArtwork('https://static.tvmaze.com/uploads/test.jpg'),true);
 for(const url of ['http://static.tvmaze.com/x','https://static.tvmaze.com.evil.test/x','javascript:alert(1)','https://user:password@image.tmdb.org/x']) assert.equal(validArtwork(url),false);
});
