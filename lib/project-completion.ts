export const completionTasks = [
 ['scope','Scope','Confirm final course requirements','Deadline: November 13. Record a 10–15 minute presentation covering problem, methodology, results/demo, challenges and solutions, and conclusion. Upload slides to Canvas in advance and post a shareable YouTube or Drive recording link in the Canvas discussion. Check the detailed requirements when received.'],
 ['baseline','Scope','Freeze the study version','Record deployed commit, taxonomy revision, ranking mode and provider configuration before collecting results.'],
 ['ui-review','User experience','Review the main journey together','Walk through add title → rate → discover → inspect → save. Agree changes before participant testing.'],
 ['ui-admin','User experience','Separate project and reviewer tools','Keep taxonomy editing, reviewer keys, milestone demonstrations and algorithm selectors outside the ordinary discovery journey. Hiding controls is not authorization.'],
 ['ui-copy','User experience','Simplify matching controls','Explain Require versus Prefer, Based On versus For You, and same series versus other stories in plain language.'],
 ['ui-layout','User experience','Check layout and accessibility','Verify mobile and desktop spacing, contrast, keyboard navigation, focus, labels and modal scrolling. Save screenshots.'],
 ['ui-states','User experience','Check empty, loading and failure states','No fabricated personalization; failed searches and unavailable synopses explain recovery. Changing criteria clears stale results.'],
 ['ui-trust','User experience','Keep useful transparency','Show synopsis, source, understandable match reasons and feedback; move raw scores, vectors and development terminology to reviewer tools.'],
 ['ui-scope','User experience','Align visible copy with supported media','Remove unsupported game/music promises and demo-title visuals from the user journey; retain course fixtures separately.'],
 ['catalog','Catalog and library','Verify real catalog search and saving','For books, movies and TV: search, select, verify, normalize, save, reload, and detect duplicates. Preserve raw/normalized evidence.'],
 ['synopsis','Catalog and library','Check synopsis quality and provenance','Test missing, long and promotional descriptions; source URL and retrieval date remain available.'],
 ['genres','Catalog and library','Fix stale and combined genre classifications','Check combined shelves, magical time travel and saved metadata refresh without title-specific exceptions or lost user edits.'],
 ['taxonomy','Catalog and library','Finish taxonomy definitions and relationships','Check categories, aliases, applicability, multiple genres and descriptions. Medical mystery is published; verify it in the user workflow.'],
 ['drafts','Catalog and library','Resolve stale taxonomy drafts','Warn when a browser draft differs from published taxonomy; offer a non-destructive compare/update route.'],
 ['persistence','Catalog and library','Verify ratings, edits and backups','Reload and export/import a real library, including AI decisions. Explain device-local storage and test quota errors.'],
 ['age','Catalog and library','Agree audience and mature-content policy','Keep intended audience separate from age ratings; document unknown ratings. Formal age verification remains deferred unless required.'],
 ['ai-live','AI review','Capture a complete live analysis','Save real provider source, model output/provenance, taxonomy revision and review decisions. Mock responses do not satisfy this check.'],
 ['ai-review','AI review','Verify accept, correct and reject end to end','Confirm accepted approved tags affect features, pending/rejected AI suggestions add nothing, and corrections survive refresh. Independent provider tags need separate correction.'],
 ['ai-new','AI review','Verify new-tag approval workflow','Approve a definition and applicability separately from applying the tag to an item. Preserve old proposals and history.'],
 ['ai-fail','AI review','Verify validation and service failures','Test invalid quotes, IDs, categories, quota, wrong key and timeouts. Explain excluded rows; never silently apply them.'],
 ['ai-quality','AI review','Measure tagging accuracy','Review 15–20 varied titles; count correct, incorrect, uncertain and missing tags by category. Keep training examples separate from evaluation titles.'],
 ['ai-security','AI review','Check reviewer access and usage','Key stays out of GitHub, exports and logs. Confirm rate limits and actual account usage. No automatic acceptance before evidence supports it.'],
 ['rec-core','Recommendations','Verify genre, setting and premise priority','Use varied genres, not only fantasy. Check that generic friendship or tone cannot overwhelm the defining story context.'],
 ['rec-candidates','Recommendations','Inspect candidate retrieval quality','Record query filters, pages, candidate counts, missing metadata and duplicate removal. Distinguish retrieval failures from ranking failures.'],
 ['rec-modes','Recommendations','Verify both discovery modes','Mixed ratings build For You; one title drives Based On. Category filters, exclusions and changing preferences behave correctly.'],
 ['rec-evidence','Recommendations','Refresh cosine and ranking evidence','Retain vocabulary, vectors, scores, ordering and rating-change examples; label pure cosine versus hybrid accurately.'],
 ['rec-compare','Recommendations','Compare before and after reviewed tagging','Use the same candidate pool and query; record ranked IDs and explanations before/after. Do not infer improvement from tests alone.'],
 ['study-pilot','User study','Pilot the study and consent script','Use anonymous IDs, voluntary participation, permission for quotes and a consistent task script. Fix confusing questions before the main study.'],
 ['study-run','User study','Collect paired same-media and cross-media sessions','Aim for 5–8 participants for a formative study; alternate condition order and record actual completed sessions, not invented results.'],
 ['study-follow','User study','Collect follow-up behavior','After an agreed interval ask which recommendation was tried and whether it was enjoyed. Missing follow-up is not a negative outcome.'],
 ['study-analysis','User study','Collate ratings and qualitative findings','Report sample sizes, paired differences, distributions, task completion, themes and limitations. Do not claim statistical proof from a small convenience sample.'],
 ['refinement','Final verification','Fix findings and retest','Prioritize observed blockers and recommendation mismatches; preserve before/after evidence and note version changes.'],
 ['regression','Final verification','Run fresh tests, typecheck and production build','Capture logs for the final commit, deploy both services, and verify live browser workflows on desktop and mobile.'],
 ['documentation','Submission','Update architecture, setup and limitations','Explain actual providers, storage, algorithms, AI review and deferred features. Include reproducible instructions and safe credential setup.'],
 ['milestones','Submission','Audit Weeks 4, 6, 8, 10 and 12','Each completed requirement links to working evidence. Separate implemented, tested, deployed and human-evaluated claims.'],
 ['demo','Submission','Record the final demonstration','Show live search, saved preferences, cross-media recommendations, reviewed AI tags and recovery from a failure. Prepare a fallback recording.'],
 ['handoff','Submission','Package and check the submission','Confirm public URL, repository access, report, evidence, study summary, references and rubric coverage. Export this checklist.'],
] as const;
export const statuses=['Not started','In progress','Needs verification','Blocked','Done','Deferred'] as const;
export type TaskProgress={status:typeof statuses[number];notes:string;evidence:string};
export const metrics=['relevance','discovery','clarity','intent','ease'] as const;
export type StudyRow={id:string;participant:string;condition:'same-media'|'cross-media';order:'first'|'second';date:string;version:string;source:string;results:string;completed:'yes'|'partial'|'no';relevance:string;discovery:string;clarity:string;intent:string;ease:string;tried:'pending'|'yes'|'no';enjoyed:string;notes:string};
export type ProjectState={version:1;tasks:Record<string,TaskProgress>;study:StudyRow[]};
export const emptyProject=():ProjectState=>({version:1,tasks:{},study:[]});
export function restoreProject(value:unknown):ProjectState{
 const x=value as ProjectState;if(!x || x.version!==1 || !x.tasks || !Array.isArray(x.study))throw Error('Choose a Mosaic project export (version 1).');
 const out=emptyProject();
 for(const [id] of completionTasks){const p=x.tasks[id];if(p && statuses.includes(p.status))out.tasks[id]={status:p.status==='Done' && !(typeof p.evidence==='string' && p.evidence.trim())?'Needs verification':p.status,notes:typeof p.notes==='string'?p.notes.slice(0,5000):'',evidence:typeof p.evidence==='string'?p.evidence.slice(0,5000):''};}
 const ids=new Set<string>();
 for(const r of x.study.slice(0,500)){
  if(!r || !r.id || ids.has(r.id) || !/^[A-Za-z0-9_-]{1,32}$/.test(r.participant) || !['same-media','cross-media'].includes(r.condition) || !['first','second'].includes(r.order) || !['yes','partial','no'].includes(r.completed) || !['pending','yes','no'].includes(r.tried))throw Error('Invalid or duplicate study record.');
  if([...metrics,'enjoyed' as const].some(k=>!['','1','2','3','4','5'].includes(r[k])))throw Error('Ratings must be blank or 1–5.');
  const clean={...r};for(const k of Object.keys(clean) as (keyof StudyRow)[])if(typeof clean[k]!=='string' || clean[k].length>5000)throw Error('Invalid study text.');
  ids.add(r.id);out.study.push(clean);
 }
 return out;
}
export function studySummary(rows:StudyRow[],condition:StudyRow['condition']){
 const group=rows.filter(r=>r.condition===condition);
 return {n:group.length,participants:new Set(group.map(r=>r.participant)).size,completed:group.filter(r=>r.completed==='yes').length,
  ratings:Object.fromEntries(metrics.map(k=>{const nums=group.filter(r=>r[k]!=='').map(r=>Number(r[k]));return [k,{n:nums.length,mean:nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:null}];})),followups:group.filter(r=>r.tried!=='pending').length,tried:group.filter(r=>r.tried==='yes').length};
}
export function studyCsv(rows:StudyRow[]){
 const keys: (keyof StudyRow)[]=['id','participant','condition','order','date','version','source','results','completed',...metrics,'tried','enjoyed','notes'];
 const cell=(s:string)=>'"'+(/^[\s]*[=+@-]/.test(s)?"'"+s:s).replaceAll('"','""')+'"';
 return [keys.join(','),...rows.map(r=>keys.map(k=>cell(r[k])).join(','))].join('\r\n');
}

