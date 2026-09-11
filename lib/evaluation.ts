// Judgments: 0 irrelevant, 1 weak, 2 good, 3 strong. Unjudged is not irrelevant.
export function evaluateRanking(ids:string[],judgments:Record<string,number>,k=10){
 const top=ids.slice(0,k),grades=Object.values(judgments).filter(x=>Number.isInteger(x)&&x>=0&&x<=3);
 const complete=top.length>0 && top.every(id=>Object.hasOwn(judgments,id));
 const gain=(values:number[])=>values.reduce((sum,g,index)=>sum+(2**g-1)/Math.log2(index+2),0);
 const ideal=gain([...grades].sort((a,b)=>b-a).slice(0,k));
 const relevant=Object.entries(judgments).filter(([,grade])=>grade>=2).map(([id])=>id);
 return {
  returned:top.length,judged:top.filter(id=>Object.hasOwn(judgments,id)).length,
  precision:complete?top.filter(id=>judgments[id]>=2).length/k:null,
  ndcg:complete&&ideal>0?gain(top.map(id=>judgments[id]))/ideal:null,
  judgedRecall:relevant.length?relevant.filter(id=>ids.includes(id)).length/relevant.length:null,
 };
}
