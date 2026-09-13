import test from 'node:test';
import assert from 'node:assert/strict';
import {preferMatches} from '../lib/recommendations.ts';
test('preferences boost matching titles without removing candidates or overriding core tiers',()=>{
 const make=(id,tags,score,priority=0)=>({id,title:id,creator:'',description:'',type:'Book',tags,score,priority});
 const items=[make('plain',['fantasy'],1),make('magic',['fantasy','magic'],.9),make('broader',['magic'],10,1),make('unknown',[],0)];
 const result=preferMatches(items,['magic']);
 assert.deepEqual(result.map(i=>i.id),['magic','plain','unknown','broader']);
 assert.deepEqual(new Set(result.map(i=>i.id)),new Set(items.map(i=>i.id)));
 assert.equal(result.find(i=>i.id==='plain').score,1);
 assert.equal(items[1].score,.9);
});
