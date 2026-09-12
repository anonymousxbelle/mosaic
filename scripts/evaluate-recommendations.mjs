import {readFile} from 'node:fs/promises';
import {recommend,vector,diversify} from '../lib/recommendations.ts';
import {hybridRank} from '../lib/hybrid-ranking.ts';
import {evaluateRanking} from '../lib/evaluation.ts';
import {sameSeries} from '../lib/story-profile.ts';
const path=process.argv[2];
if(!path)throw Error('Usage: node --experimental-strip-types scripts/evaluate-recommendations.mjs <snapshot.json>');
const data=JSON.parse(await readFile(path,'utf8'));
if(!Array.isArray(data.cases))throw Error('Expected cases array');
const results=data.cases.map(c=>{
 if(!c.seed || !Array.isArray(c.candidates))throw Error('Each case needs seed and candidates');
 const judgments=c.judgments||{};
 if(Object.values(judgments).some(x=>!Number.isInteger(x)||x<0||x>3))throw Error('Judgments must be integers 0–3; omit unjudged items');
 const pool=c.candidates.filter(i=>c.seriesView==='series'?sameSeries(c.seed,i):c.seriesView==='discover'?!sameSeries(c.seed,i):true);
 const story=recommend(pool,vector(c.focusTags||c.seed.tags),c.category||'All',[c.seed.id],c.requiredGenre,c.seed,true);
 const baseline=recommend(pool,vector(c.focusTags||c.seed.tags),c.category||'All',[c.seed.id],c.requiredGenre,c.seed);
 const evidence=c.evidence||{};
 const rank=x=>Math.min(...(evidence[x.id]||[]).map(p=>p.rank).filter(r=>Number.isInteger(r)&&r>0),Infinity);
 const provider=[...baseline].sort((a,b)=>a.priority-b.priority||rank(a)-rank(b)||a.title.localeCompare(b.title));
 const methods={story,standard:baseline,provider,providerBlend:hybridRank(baseline,evidence),semanticBlend:hybridRank(baseline,evidence,c.semanticScores||{})};
 return {id:c.id,candidates:c.candidates.length,eligible:baseline.length,
  retrievedJudgedRecall:evaluateRanking(c.candidates.map(x=>x.id),judgments).judgedRecall,
  methods:Object.fromEntries(Object.entries(methods).map(([method,rows])=>[method,{...evaluateRanking(rows.map(x=>x.id),judgments),top:rows.slice(0,10).map(x=>x.id),finalList:evaluateRanking(diversify(rows,10).map(x=>x.id),judgments),finalTop:diversify(rows,10).map(x=>x.id)}]))};
});
console.log(JSON.stringify({label:data.label||'Unspecified evaluation',note:'Metrics concern the supplied judged pool, not whole-catalog accuracy. Null metrics indicate missing judgments. Both raw ranking and final diversified lists are measured.',results},null,2));
