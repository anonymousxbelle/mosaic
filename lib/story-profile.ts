import {hasSynopsis} from './catalog-text.ts';
import type {Media} from './recommendations';
// Conservative, explainable text cues. These are evidence snippets, not AI facts.
const groups:Record<string,Record<string,RegExp>>={
 setting:{'school':/\b(?:school|academy|boarding school)\b/i,'space':/\b(?:spaceship|space station|interstellar)\b/i,'royal court':/\b(?:royal court|palace|royal family)\b/i},
 premise:{'learning magic':/\b(?:learn|study|studies|training|school|academy)\b[^.!?]{0,80}\b(?:magic|wizard|witch|sorcer)/i,'quest':/\b(?:quest|journey to|search for|sets out to)\b/i,'competition':/\b(?:tournament|championship|compete|competition)\b/i,'solving a mystery':/\b(?:investigat|solve|solving)[^.!?]{0,60}\b(?:murder|mystery|crime)/i},
 tone:{'lighthearted':/\b(?:lighthearted|light-hearted|comedic|hilarious)\b/i,'dark':/\b(?:bleak|brutal|grim|terrifying)\b/i},
};
export function storyProfile(item:Media){
 const text=hasSynopsis(item.description)?item.description:'';
 const out:Record<string,string[]>={};
 for(const [group,patterns] of Object.entries(groups))out[group]=Object.entries(patterns).filter(([,p])=>p.test(text)).map(([label])=>label);
 out.audience=item.tags.filter(t=>['middle-grade','young-adult'].includes(t));
 return out;
}
export function storyMatch(seed:Media,item:Media){
 const a=storyProfile(seed),b=storyProfile(item),reasons:string[]=[];let total=0,known=0;
 for(const group of Object.keys(a)){
  if(!a[group].length || !b[group].length)continue;
  const shared=a[group].filter(x=>b[group].includes(x));
  known++;total+=shared.length/new Set([...a[group],...b[group]]).size;
  reasons.push(...shared.map(x=>group+': '+x));
 }
 return {score:known?total/known:0,reasons};
}
export function seriesPosition(description:string):number|undefined{
 const m=description.slice(0,280).match(/\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d{1,2}(?:st|nd|rd|th))\s+(?:book|novel|volume|installment)\s+(?:in|of)\b/i);
 if(!m)return undefined;
 const words=['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth'];
 const n=words.indexOf(m[1].toLowerCase());return n>=0?n+1:Number.parseInt(m[1]);
}
export function sameSeries(a:Media,b:Media){return !!a.seriesKey && a.seriesKey===b.seriesKey;}
