import type {Media, Ratings, Category} from './recommendations';
import {sameWork} from './media-identity.ts';
import {resolveTaxonomyTag} from './taxonomy.ts';

export type FeatureMedia=Media & {themes?:string[];moods?:string[];keywords?:string[];creators?:string[]};
export const normalizeFeature=(value:string)=>value.normalize('NFKC').trim().toLowerCase().replace(/[\s_]+/g,'-');
// Union, not concatenation: a genre repeated in keywords counts only once.
export function features(item:FeatureMedia):string[]{
 return [...new Set([item.tags,item.genres,item.themes,item.moods,item.keywords].flatMap(x=>x||[]).map(normalizeFeature).filter(Boolean).map(resolveTaxonomyTag))].sort();
}
export function vocabularyFor(items:FeatureMedia[]):string[]{return [...new Set(items.flatMap(features))].sort();}
export function itemVector(item:FeatureMedia,vocabulary:string[]):number[]{
 const present=new Set(features(item));return vocabulary.map(tag=>present.has(tag)?1:0);
}
export function ratingSignal(rating:number):number{return Number.isInteger(rating)&&rating>=1&&rating<=5?rating-3:0;}
export function tasteVector(items:FeatureMedia[],ratings:Ratings,vocabulary:string[]):number[]{
 const out=vocabulary.map(()=>0);
 const seen=new Set<string>();
 for(const item of items){if(seen.has(item.id))continue;seen.add(item.id);
  const weight=ratingSignal(ratings[item.id]);if(!weight)continue;
  itemVector(item,vocabulary).forEach((value,i)=>{out[i]+=weight*value;});
 }
 // Preserve interpretable +2/+1/-1/-2 contributions; cosine normalizes magnitude.
 return out;
}
export function cosineSimilarity(a:number[],b:number[]):number{
 if(a.length!==b.length)throw Error('Feature vectors must use the same vocabulary.');
 if([...a,...b].some(x=>!Number.isFinite(x)))throw Error('Feature vectors must contain finite numbers.');
 let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}
 return aa&&bb?Math.max(-1,Math.min(1,dot/Math.sqrt(aa*bb))):0;
}
export function cosineDiscovery<T extends FeatureMedia>(items:T[],options:{mode:'for-you'|'based-on';ratings:Ratings;library?:FeatureMedia[];seed?:FeatureMedia;category?:Category|'All'}){
 const universe=[...items,...(options.library||[]),...(options.seed?[options.seed]:[])];
 const vocabulary=vocabularyFor(universe);
 const query=options.mode==='based-on'&&options.seed?itemVector(options.seed,vocabulary):options.mode==='for-you'?tasteVector(universe,options.ratings,vocabulary):vocabulary.map(()=>0);
 const excluded=[...(options.library||[]),...universe.filter(x=>Object.hasOwn(options.ratings,x.id)),...(options.seed?[options.seed]:[])];
 const unique:T[]=[];for(const item of items)if(!unique.some(x=>sameWork(x,item)))unique.push(item);
 const scored=unique.filter(item=>!excluded.some(x=>sameWork(x,item))).map(item=>{
  const values=itemVector(item,vocabulary);
  const contributions=vocabulary.map((feature,i)=>({feature,contribution:query[i]*values[i]})).filter(x=>x.contribution!==0).sort((a,b)=>b.contribution-a.contribution||a.feature.localeCompare(b.feature));
  return {...item,score:cosineSimilarity(query,values),values,contributions,sharedTags:contributions.filter(x=>x.contribution>0).map(x=>x.feature),reasons:contributions.filter(x=>x.contribution>0).slice(0,3).map(x=>x.feature)};
 }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 // Category filtering is a view of the same calculated scores, never a separate list.
 const results=scored.filter(x=>x.score>0&&(!options.category||options.category==='All'||x.type===options.category));
 return {vocabulary,query,scored,results,hasPositiveSignal:query.some(x=>x>0)};
}
