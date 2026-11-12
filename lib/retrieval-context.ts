import {contentClass,type ContentClass} from './taxonomy.ts';
import {sportsCentrality} from './tag-centrality.ts';
type ContextItem={tags:string[];genres?:string[];description?:string;sourceGenreLabels?:string[];type?:string};
// Retrieval evidence only: these decisions never add taxonomy labels to a work.
export function retrievalClass(item:ContextItem):ContentClass {
 const explicit=[...item.tags,...(item.genres||[])];
 if(explicit.includes('non-fiction'))return 'non-fiction';
 if(explicit.includes('fiction'))return 'fiction';
 const subjects=item.sourceGenreLabels||[];
 if(subjects.some(s=>/\b(?:nonfiction|non-fiction|textbooks?|handbooks?|manuals?|study guides?|instruction and study|legal reference)\b/i.test(s)))return 'non-fiction';
 if(subjects.some(s=>/\bfiction\b/i.test(s)))return 'fiction';
 const description=item.description||'';
 // Require a description of the work's purpose, not a character's occupation.
 if(item.type==='Book' && /\b(?:this (?:book|guide|manual|textbook) (?:teaches|explains|examines|provides) (?:practical |the )?(?:techniques|instructions|principles|exercises|guidance)|(?:a|an) (?:practical |comprehensive |sports psychology )?(?:guide|manual|textbook|reference book) (?:to|for|on)|principles of law|step-by-step instructions)\b/i.test(description))return 'non-fiction';
 return contentClass(item);
}
export function retrievalClassCompatible(seed:ContextItem,item:ContextItem){
 const a=retrievalClass(seed),b=retrievalClass(item);
 return a==='unknown'||b==='unknown'||a===b;
}
const sports=['volleyball','basketball','baseball','football','soccer','tennis','swimming'] as const;
export function sportSubject(item:ContextItem):string|undefined {
 const subjects=[...(item.sourceGenreLabels||[]),...(item.genres||[]),...item.tags];
 const text=item.description||'';
 return sports.find(s=>subjects.some(label=>new RegExp('^'+s+'(?: fiction| stories| drama)?$','i').test(label.replaceAll('-',' '))) ||
   text.split(/[.!?\n]+/).some(sentence=>new RegExp('\\b'+s+'\\b','i').test(sentence) && sportsCentrality(sentence,[])==='central'));
}
export function matchesRetrievalTopic(item:ContextItem,topic:string){return item.tags.includes(topic)||sportSubject(item)===topic;}

