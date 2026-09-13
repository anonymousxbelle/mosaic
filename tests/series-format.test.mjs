import test from 'node:test';
import assert from 'node:assert/strict';
import {groupSeries,seriesGroupKey} from '../lib/story-profile.ts';
import {extractTags} from '../lib/media-api.ts';
import {tmdbRecord} from '../backend/worker.ts';
const item=(id,extra={})=>({id,title:id,type:'Book',creator:'Author',description:'A story',tags:['fantasy'],...extra});
test('series collapse selects earliest eligible volume and preserves format adaptations',()=>{
 const items=[item('v3',{seriesKey:'hardcover:example',seriesPosition:3,tags:['manga']}),item('v1',{seriesKey:'hardcover:example',seriesPosition:1,tags:['manga']}),item('novel',{seriesKey:'hardcover:example',tags:['light-novel']}),item('unknown')];
 const groups=groupSeries(items);
 assert.deepEqual(groups.map(x=>x.id),['v1','novel','unknown']);
 assert.deepEqual(groups[0].seriesEntries.map(x=>x.id),['v1','v3']);
 assert.notEqual(seriesGroupKey(items[0]),seriesGroupKey(items[2]));
 assert.equal(groupSeries([item('same title'),item('same title 2')]).length,2);
});
test('anime adaptation mentions do not label prose as anime; book formats require source labels',()=>{
 assert.ok(!extractTags('This story inspired an anime adaptation.', ['Fantasy']).includes('anime'));
 assert.ok(extractTags('A story',['Manga']).includes('manga'));
 assert.ok(extractTags('A story',['Light Novel']).includes('light-novel'));
});
test('Chinese animation is donghua while Chinese live action is not anime',()=>{
 const source={id:42,name:'A basketball story',overview:'Inspired by anime.',origin_country:['CN'],original_language:'zh',keywords:{results:[{name:'anime'}]}};
 const animated=tmdbRecord({...source,genres:[{name:'Animation'},{name:'Drama'}]},'TV');
 assert.ok(animated.tags.includes('donghua'));assert.ok(animated.tags.includes('animation'));assert.ok(!animated.tags.includes('anime'));
 const live=tmdbRecord({...source,genres:[{name:'Drama'}]},'TV');
 assert.ok(!live.tags.includes('anime'));assert.ok(!live.tags.includes('donghua'));assert.ok(!live.tags.includes('animation'));
 const japanese=tmdbRecord({...source,origin_country:['JP'],original_language:'ja',genres:[{name:'Animation'}]},'TV');
 assert.ok(japanese.tags.includes('anime'));assert.ok(!japanese.tags.includes('donghua'));
});
