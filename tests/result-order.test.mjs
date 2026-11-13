import test from 'node:test';
import assert from 'node:assert/strict';
import {rankForPages} from '../lib/result-order.ts';
test('page boundaries preserve global quality order and newly retrieved strong matches rise',()=>{
 const initial=Array.from({length:25},(_,i)=>({id:i,score:i/100,priority:0}));
 const sorted=rankForPages(initial);
 assert.equal(sorted.length,25);
 assert.ok(sorted[11].score>=sorted[12].score);
 assert.ok(sorted[23].score>=sorted[24].score);
 assert.equal(initial[0].id,0);
 const expanded=rankForPages([...sorted,{id:99,score:1,priority:0}]);
 assert.equal(expanded[0].id,99);
});
test('story compatibility precedes score across page boundaries',()=>{
 const ranked=rankForPages([{score:1,priority:2},{score:0.1,priority:0}]);
 assert.equal(ranked[0].priority,0);
});
