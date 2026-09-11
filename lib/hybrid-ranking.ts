import type { Media } from './recommendations';
import type { RetrievalEvidence } from './retrieval';

export type RankingEvidence = Record<string, RetrievalEvidence[]>;
export type SemanticScores = Record<string, number>;

// Experimental, smoothed rank fusion. A provider receives one vote (its best
// position), regardless of how many overlapping queries returned the same work.
// Missing signals are neutral, never a reason to punish sparse metadata.
export function hybridRank<T extends Media & {score:number;priority?:number}>(
 items:T[], evidence:RankingEvidence={}, semantic:SemanticScores={},
):Array<T & {baselineScore:number}> {
 const ranked=items.map(item=>({...item,baselineScore:item.score}));
 if(!ranked.some(x=>evidence[x.id]?.length || Number.isFinite(semantic[x.id])))return ranked;
 const reciprocal=(rank:number)=>21/(20+rank);
 for(const priority of new Set(ranked.map(x=>x.priority||0))){
  const tier=ranked.filter(x=>(x.priority||0)===priority);
  const semanticOrder=[...tier].filter(x=>Number.isFinite(semantic[x.id]))
    .sort((a,b)=>semantic[b.id]-semantic[a.id]||a.id.localeCompare(b.id));
  for(const item of tier){
   const tagRank=1+tier.filter(x=>x.baselineScore>item.baselineScore).length;
   const tag=reciprocal(tagRank);
   const ranks=(evidence[item.id]||[]).map(x=>x.rank).filter(x=>Number.isSafeInteger(x)&&x>0);
   const provider=ranks.length?reciprocal(Math.min(...ranks)):tag;
   const semanticRank=Number.isFinite(semantic[item.id])
     ?1+semanticOrder.filter(x=>semantic[x.id]>semantic[item.id]).length:undefined;
   item.score=0.65*tag+0.2*provider+0.15*(semanticRank?reciprocal(semanticRank):tag);
  }
 }
 return ranked.sort((a,b)=>(a.priority||0)-(b.priority||0)||b.score-a.score||a.title.localeCompare(b.title));
}
