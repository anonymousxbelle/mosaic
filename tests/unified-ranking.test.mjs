import test from 'node:test';
import assert from 'node:assert/strict';
import {unifiedRank} from '../lib/unified-ranking.ts';
import {diversify} from '../lib/recommendations.ts';
import {recommend,vector} from '../lib/recommendations.ts';
import {storyMatch,storyProfile} from '../lib/story-profile.ts';
const seed={id:'s',type:'Book',title:'Example',creator:'Writer',tags:['romance','historical-romance'],genres:['romance'],description:'In Regency England, a marriage of convenience becomes forbidden love.'};
const item=(id,description,tags=seed.tags)=>({...seed,id,title:id,description,tags,score:0.2,priority:0});
test('explicit story facets work across media without a synopsis',()=>{
 for(const type of ['Book','Movie','TV']){
  const work={...seed,type,description:'',tags:['mystery','imperial-court','solving-a-mystery'],genres:['mystery']};
  assert.ok(storyProfile(work).setting.includes('imperial court'));
  assert.ok(storyMatch(work,work).reasons.includes('premise: solving a mystery'));
 }
});
test('sparse evidence cannot earn a complete story score and tone cannot outweigh setting',()=>{
 const full={...seed,tags:['mystery'],description:'A lighthearted detective solves a murder mystery in a small town.'};
 const toneOnly={...full,description:'A lighthearted tale.'};
 const coreOnly={...full,description:'Detectives solve a murder mystery in a small town.'};
 assert.ok(storyMatch(full,toneOnly).score<storyMatch(full,coreOnly).score);
 assert.ok(storyMatch(full,toneOnly).coverage<1);
 assert.equal(storyMatch(full,full).score,1);
});
test('absent external evidence does not punish an otherwise identical match',()=>{
 const a=item('a',seed.description),b=item('b',seed.description);
 const initial=unifiedRank([a,b],seed);const core=initial[0].score;
 const ranked=unifiedRank([a,b],seed,{}, {b:core});
 assert.ok(Math.abs(ranked[0].score-ranked[1].score)<1e-10);
});
test('all shared tags are counted even when top explanations show three',()=>{
 const tags=['mystery','drama','imperial-court','history','political-intrigue'];
 const out=recommend([{...seed,id:'many',tags}],vector(tags),'All');
 assert.equal(out[0].sharedTags.length,5);assert.equal(out[0].reasons.length,3);
});
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
