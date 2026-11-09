import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreProject,studySummary,studyCsv,emptyProject,completionTasks} from '../lib/project-completion.ts';
const row={id:'one',participant:'P01',condition:'same-media',order:'first',date:'2026-11-08',version:'test',source:'book:1',results:'movie:2',completed:'yes',relevance:'5',discovery:'',clarity:'3',intent:'4',ease:'4',tried:'pending',enjoyed:'',notes:'=SUM(A1:A2)'};
test('checklist IDs are unique and imported completion needs evidence',()=>{
 assert.equal(new Set(completionTasks.map(t=>t[0])).size,completionTasks.length);
 const state=restoreProject({...emptyProject(),tasks:{scope:{status:'Done',notes:'',evidence:''}}});
 assert.equal(state.tasks.scope.status,'Needs verification');
});
test('study summaries exclude missing ratings and unanswered follow-ups',()=>{
 const s=studySummary([row,{...row,id:'two',participant:'P02',relevance:'3',tried:'no'}],'same-media');
 assert.equal(s.ratings.relevance.mean,4);assert.equal(s.ratings.discovery.n,0);assert.equal(s.ratings.discovery.mean,null);
 assert.equal(s.followups,1);assert.equal(s.tried,0);assert.equal(s.participants,2);
});
test('study imports preserve valid observations and reject invalid scales or duplicate IDs',()=>{
 assert.deepEqual(restoreProject({...emptyProject(),study:[row]}).study,[row]);
 assert.throws(()=>restoreProject({...emptyProject(),study:[{...row,relevance:'9'}]}));
 assert.throws(()=>restoreProject({...emptyProject(),study:[row,row]}));
 assert.throws(()=>restoreProject({...emptyProject(),study:[{...row,participant:'person@example.com'}]}));
});
test('CSV quotes observations and neutralizes spreadsheet formulas',()=>{
 const csv=studyCsv([row]);assert.ok(csv.includes("\"'=SUM(A1:A2)\""));
 assert.ok(studyCsv([{...row,notes:'said "yes", then paused'}]).includes('"said ""yes"", then paused"'));
});

