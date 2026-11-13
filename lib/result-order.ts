// Story compatibility remains more important than a raw similarity score.
export function rankForPages<T extends {score:number;priority?:number}>(items:T[]):T[] {
  return [...items].sort((a,b)=>(a.priority??0)-(b.priority??0)||b.score-a.score);
}
