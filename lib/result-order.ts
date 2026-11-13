import {sameWork} from './media-identity.ts';
import type {Media} from './recommendations';

// Story compatibility remains more important than a raw similarity score.
export function rankForPages<T extends {score:number;priority?:number}>(items:T[]):T[] {
  return [...items].sort((a,b)=>(a.priority??0)-(b.priority??0)||b.score-a.score);
}
// Preserve the user's place; only the newly appended batch is ranked.
export function appendRankedBatch<T extends Media & {score:number;priority?:number}>(previous:T[],candidates:T[],limit:number):T[] {
  const fresh=rankForPages(candidates.filter(item=>!previous.some(old=>sameWork(old,item))));
  return [...previous,...fresh.slice(0,Math.max(0,limit-previous.length))];
}
