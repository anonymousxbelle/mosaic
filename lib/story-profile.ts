import {hasSynopsis} from './catalog-text.ts';
import type {Media} from './recommendations';
// Conservative, explainable text cues. These are evidence snippets, not AI facts.
const groups:Record<string,Record<string,RegExp>>={
 setting:{'school':/\b(?:school|academy|boarding school)\b/i,'space':/\b(?:spaceship|space station|interstellar)\b/i,'royal court':/\b(?:royal court|palace|royal family)\b/i},
 premise:{'learning magic':/\b(?:learn|study|studies|training|school|academy)\b[^.!?]{0,80}\b(?:magic|wizard|witch|sorcer)/i,'quest':/\b(?:quest|journey to|search for|sets out to)\b/i,'competition':/\b(?:tournament|championship|compete|competition)\b/i,'solving a mystery':/\b(?:investigat|solve|solving)[^.!?]{0,60}\b(?:murder|mystery|crime)/i},
 tone:{'lighthearted':/\b(?:lighthearted|light-hearted|comedic|hilarious)\b/i,'dark':/\b(?:bleak|brutal|grim|terrifying)\b/i},
};

Object.assign(groups.setting,{
 'imperial court':/\b(?:imperial (?:court|palace)|inner palace|emperor.{0,12}palace|palace.{0,80}emperor|imperial consort)\b/i,
 'Regency Britain':/\b(?:regency|regency[- ]era|regency England)\b/i,
 'Victorian Britain':/\b(?:victorian|victorian London)\b/i,
 'medieval':/\b(?:medieval|middle ages)\b/i,
 'Second World War':/\b(?:world war (?:ii|two|2)|second world war|194[0-5])\b/i,
 'small town':/\b(?:small[- ]town|rural community)\b/i,
 'workplace':/\b(?:office romance|workplace|co[- ]workers|colleagues)\b/i,
});
Object.assign(groups.premise,{
 'marriage of convenience':/\b(?:marriage of convenience|convenient marriage|marry for convenience)\b/i,
 'forbidden love':/\b(?:forbidden love|forbidden romance|star[- ]crossed lovers)\b/i,
 'second-chance romance':/\b(?:second[- ]chance romance|rekindle their (?:love|romance)|former lovers)\b/i,
 'enemies to lovers':/\b(?:enemies[- ]to[- ]lovers|rivals[- ]to[- ]lovers)\b/i,
 'friends to lovers':/\b(?:friends[- ]to[- ]lovers|friendship blossoms into love)\b/i,
 'fake relationship':/\b(?:fake dating|fake relationship|pretend (?:engagement|relationship))\b/i,
 'survival':/\b(?:fight for survival|struggle to survive|survival against)\b/i,
 'heist':/\b(?:heist|plan a robbery|steal the treasure)\b/i,
 'political intrigue':/\b(?:political intrigue|struggle for the throne|court intrigue)\b/i,
 'family secrets':/\b(?:family secrets|secret family history)\b/i,
});

export function storyProfile(item:Media){
 const text=hasSynopsis(item.description)?item.description:'';
 const out:Record<string,string[]>={};
 for(const [group,patterns] of Object.entries(groups))out[group]=Object.entries(patterns).filter(([,p])=>p.test(text)).map(([label])=>label);
 const labels=[...item.tags,...(item.genres||[])];
 out.era=labels.some(t=>['historical-fiction','historical-romance'].includes(t)) || (labels.includes('history') && out.setting.includes('imperial court')) || /\b(?:Regency|Victorian|medieval|ancient (?:China|Japan|Rome)|feudal|Joseon|Edo period|(?:Tang|Ming|Qing|Han) dynasty|historical setting)\b/i.test(text)?['historical']:/\b(?:present[- ]day|modern[- ]day|contemporary setting)\b/i.test(text) || labels.includes('contemporary-romance')?['contemporary']:[];
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
