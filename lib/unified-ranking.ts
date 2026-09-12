import type {Media} from './recommendations';
import type {RankingEvidence,SemanticScores} from './hybrid-ranking';
import {featureGroups,primaryGenre,matchesGenre,seedTopic} from './features.ts';
import {storyProfile,storyMatch,sameSeries,definingSettings} from './story-profile.ts';
function tier(a:string[],b:string[]){return !a.length?0:!b.length?1:a.some(x=>b.includes(x))?0:2;}
export function unifiedRank<T extends Media & {score:number;priority?:number}>(items:T[],seed:Media,evidence:RankingEvidence={},semantic:SemanticScores={}){
 const genre=primaryGenre(seed),topic=seedTopic(seed),labels=(i:Media)=>[...new Set([...(i.genres||[]),...i.tags])];
 const subs=(i:Media)=>(featureGroups[genre || '']||[]).filter(t=>labels(i).includes(t));
 const seedSubs=subs(seed),a=storyProfile(seed);
 return items.filter(i=>(!genre||matchesGenre(i,genre)) && (!topic||i.tags.includes(topic)))
 .filter(i=>!(seedSubs.includes('historical-romance') && subs(i).includes('contemporary-romance') && !subs(i).includes('historical-romance')))
 .filter(i=>!(seedSubs.includes('contemporary-romance') && subs(i).includes('historical-romance') && !subs(i).includes('contemporary-romance')))
 .map(i=>{
  const b=storyProfile(i),sub=tier(seedSubs,subs(i)),era=tier(a.era,b.era),setting=tier(definingSettings(seed),definingSettings(i)),premise=tier(a.premise,b.premise);
  const story=storyMatch(seed,i);
  const positions=(evidence[i.id]||[]).map(x=>x.rank).filter(x=>Number.isInteger(x)&&x>0);
  const provider=positions.length?1/(1+Math.min(...positions)):0;
  const ai=Number.isFinite(semantic[i.id])?Math.max(0,Math.min(1,semantic[i.id])):0;
  const later=i.type==='Book' && (i.seriesPosition||0)>1 && !sameSeries(seed,i)?0.8:1;
  // Lexicographic compatibility precedes all scores and media preferences.
  // Missing fields remain distinguishable from observed non-overlap.
  return {...i,priority:era*1000+setting*100+sub*20+premise*4+(i.priority||0),
   score:(0.6*i.score+0.3*story.score+0.08*ai+0.02*provider)*later,
   storyReasons:story.reasons,
   compatibilityNote:era===1 || sub===1 || setting===1 || premise===1?'Some comparison metadata is missing':era===2 || sub===2 || setting===2 || premise===2?'Broader match: some story features differ':'Core story features align'};
 }).sort((a,b)=>a.priority-b.priority||b.score-a.score||a.title.localeCompare(b.title));
}
