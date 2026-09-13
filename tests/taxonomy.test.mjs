import test from 'node:test';
import assert from 'node:assert/strict';
import {contentClass,tagApplicable,compatibleClass,suggestedFacets,taxonomy} from '../lib/taxonomy.ts';
import {extractTags} from '../lib/media-api.ts';
import {featureKind} from '../lib/features.ts';
const factual={tags:['non-fiction','biography'],type:'Book'};
void test('factual work about fantasy does not become fantasy fiction',()=>{
 assert.equal(contentClass(factual),'non-fiction');
 assert.ok(!tagApplicable('magical-school',factual));
 assert.ok(!extractTags('A study of magic school stories.',['Nonfiction','Biography']).includes('magical-school'));
 assert.ok(!compatibleClass(factual,{tags:['fantasy']}));
});
void test('genres and facets can overlap without forcing unknown class',()=>{
 assert.equal(contentClass({tags:['history']}),'unknown');
 assert.ok(tagApplicable('imperial-court',{tags:['history','non-fiction'],type:'TV'}));
 assert.ok(tagApplicable('imperial-court',{tags:['fantasy'],type:'Book'}));
});
void test('subgenre expands to relevant themes and tropes',()=>{
 const suggestions=suggestedFacets({tags:['historical-romance'],type:'Book'});
 assert.ok(suggestions.includes('slow-burn'));assert.ok(suggestions.includes('regency-britain'));
 assert.ok(!suggestions.includes('magical-school'));
 assert.ok(!suggestedFacets(factual).includes('fantasy'));
});
void test('format and audience require source evidence and compatible media',()=>{
 assert.equal(featureKind('anime'),'subgenre');assert.deepEqual(taxonomy.anime.parents,['animation']);
 assert.equal(featureKind('animation'),'format');
 assert.ok(!tagApplicable('short-film',{tags:[],type:'Book'}));
 assert.ok(!extractTags('An adult visits children in a school.',[]).includes('adult-audience'));
 assert.ok(extractTags('', ['Novella']).includes('novella'));
});
void test('biography belongs to nonfiction and magical school is a setting',()=>{
 assert.equal(featureKind('biography'),'genre');assert.equal(featureKind('magical-school'),'setting');
 assert.equal(featureKind('chosen-one'),'trope');assert.equal(featureKind('fiction'),'class');
});
