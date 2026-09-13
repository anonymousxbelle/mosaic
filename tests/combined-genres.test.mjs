import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeGenres} from '../lib/genres.ts';
import {extractTags} from '../lib/media-api.ts';
import {tmdbRecord} from '../backend/worker.ts';
test('combined catalog shelves never assign fantasy or science fiction by themselves',()=>{
 for(const shelf of ['Science Fiction & Fantasy','Sci-Fi & Fantasy','Fantasy / Science Fiction','Science-Fiction and Fantasy','Children’s Sci Fi + Fantasy','Fantasy &amp; Sci-Fi']){
  assert.ok(!normalizeGenres([shelf]).includes('science-fiction'),shelf);
  assert.ok(!normalizeGenres([shelf]).includes('fantasy'),shelf);
  assert.ok(!extractTags('',[shelf]).includes('science-fiction'),shelf);
  assert.ok(!extractTags('',[shelf]).includes('fantasy'),shelf);
  assert.ok(!extractTags('Filed under '+shelf,[]).includes('science-fiction'),shelf);
 }
});
test('specific independent evidence resolves ambiguous shelves without title exceptions',()=>{
 const tags=extractTags('A young wizard learns magic at a magical school.',['Sci-Fi & Fantasy']);
 assert.ok(tags.includes('fantasy'));assert.ok(!tags.includes('science-fiction'));
 const genres=normalizeGenres(['Sci-Fi & Fantasy','Space Opera']);
 assert.ok(genres.includes('science-fiction'));assert.ok(!genres.includes('fantasy'));
 const hybrid=normalizeGenres(['Fantasy','Science Fiction']);
 assert.ok(hybrid.includes('fantasy'));assert.ok(hybrid.includes('science-fiction'));
});
test('source labels remain available while normalized classifications stay ambiguous',()=>{
 const item=tmdbRecord({id:12,name:'An unknown world',overview:'An adventure.',genres:[{name:'Sci-Fi & Fantasy'}]},'TV');
 assert.deepEqual(item.sourceGenreLabels,['Sci-Fi & Fantasy']);
 assert.ok(!item.genres.includes('science-fiction'));assert.ok(!item.tags.includes('fantasy'));
});
