import test from 'node:test';
import assert from 'node:assert/strict';
import {extractTags} from '../lib/media-api.ts';
import {featureKind} from '../lib/features.ts';
import {sameWork} from '../lib/media-identity.ts';
import {recommend,vector,diversify} from '../lib/recommendations.ts';
const book=(id,title,tags,extra={})=>({id,title,tags,creator:'A Writer',type:'Book',description:'',...extra});
test('incidental sports and audience prose do not become genre or audience labels',()=>{
 assert.equal(extractTags('Magic classes and aerial sports.', ['Fantasy']).includes('sports'),false);
 assert.ok(extractTags('A basketball team competes.', ['Drama']).includes('sports'));
 assert.equal(extractTags('A young adult searches for work.',[]).includes('young-adult'),false);
 assert.ok(extractTags('', ['Young adult fiction']).includes('young-adult'));
 assert.equal(featureKind('anime'),'format'); assert.equal(featureKind('quest'),'theme');
});
test('mood and audience alone rank below substantive interests',()=>{
 const relevant=book('1','Magic story',['magic','fantasy']);
 const superficial=book('2','Unrelated',['young-adult','lighthearted']);
 const ranked=recommend([superficial,relevant],vector(['magic','fantasy','young-adult','lighthearted']),'Book');
 assert.deepEqual(ranked.map(x=>x.id),['1','2']);
 assert.ok(ranked[0].score>ranked[1].score*5);
 assert.equal(recommend([superficial],vector(['young-adult']),'Book').length,1);
});
test('edition suffixes collapse while subtitles and volume numbers remain distinct',()=>{
 assert.ok(sameWork(book('1','Example',['magic']),book('2','Example (Illustrated Edition)',['magic'])));
 assert.equal(sameWork(book('1','Example: Part One',[]),book('2','Example: Part Two',[])),false);
 assert.equal(sameWork(book('1','Example',[],{creator:'Unknown'}),book('2','Example',[],{creator:'Unknown'})),false);
});
test('series diversity and edition deduplication preserve unrelated alternatives',()=>{
 const a=book('1','First',['magic'],{score:1,seriesKey:'hardcover:series'});
 const duplicate={...a,id:'2',title:'First (Illustrated Edition)',score:.99};
 const sequel=book('3','Second',['magic'],{score:.95,seriesKey:'hardcover:series'});
 const other=book('4','Alternative',['magic'],{creator:'B Writer',score:.9});
 const out=diversify([a,duplicate,sequel,other]);
 assert.deepEqual(out.map(x=>x.id),['1','4','3']);
});
