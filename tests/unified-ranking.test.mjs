import test from 'node:test';
import assert from 'node:assert/strict';
import {unifiedRank} from '../lib/unified-ranking.ts';
import {diversify} from '../lib/recommendations.ts';
const seed={id:'s',type:'Book',title:'Example',creator:'Writer',tags:['romance','historical-romance'],genres:['romance'],description:'In Regency England, a marriage of convenience becomes forbidden love.'};
const item=(id,description,tags=seed.tags)=>({...seed,id,title:id,description,tags,score:0.2,priority:0});
test('core compatibility outranks maximum provider and AI evidence, including after diversity',()=>{
 const good=item('good',seed.description);
 const wrongSetting={...item('wrong','In Victorian London, a marriage of convenience.'),score:1};
 const contemporary=item('contemporary','Office romance at a modern workplace.',['romance','contemporary-romance']);
 const wrongGenre={...item('genre',seed.description,['fantasy']),genres:['fantasy']};
 const out=unifiedRank([wrongSetting,contemporary,wrongGenre,good],seed,{wrong:[{rank:1,page:1,plan:'popular'}]},{wrong:1,good:0});
 assert.equal(out[0].id,'good');assert.equal(diversify(out)[0].id,'good');assert.ok(!out.some(x=>['contemporary','genre'].includes(x.id)));
});
test('missing metadata is visible and never treated as an exact match',()=>{
 const out=unifiedRank([item('unknown',''),item('known',seed.description)],seed);
 assert.equal(out[0].id,'known');assert.match(out[1].compatibilityNote,/missing/);
 assert.ok(out.every(x=>Number.isFinite(x.score)));
});
test('premise precedence also applies outside romance',()=>{
 const mystery={...seed,tags:['mystery'],genres:['mystery'],description:'Detectives solve a murder mystery in a small town.'};
 const match={...item('match',mystery.description,['mystery']),genres:['mystery']};
 const other={...match,id:'other',description:'A small town struggles with family secrets.',score:1};
 const out=unifiedRank([other,match],mystery,{}, {other:1});assert.equal(out[0].id,'match');
});
