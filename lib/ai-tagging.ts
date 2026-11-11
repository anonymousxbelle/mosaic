import { taxonomy, tagApplicable, resolveTaxonomyTag, type TaxonomyKind } from './taxonomy.ts';
import { hasSynopsis } from './catalog-text.ts';
import type { Media } from './recommendations';

export type TagSource = { text: string; provider: string; url: string; retrievedAt: string };
export type ReviewDecision = { status: 'accepted'|'rejected'; tag?:string; reason:string; at:string };
export type Suggestion = {
  tag: string; kind: TaxonomyKind; definition?: string; proposed: boolean;
  centrality?: 'central'|'substantial'; quote: string; reason: string; confidence: number; basis: 'explicit' | 'inferred';
  history?: ReviewDecision[];
  status: 'pending' | 'accepted' | 'rejected'; reviewedTag?: string; reviewReason?: string; reviewedAt?: string;
};
export type ValidationIssue = { index:number; tag:string; reason:string };
export type TagAnalysis = {
  validationIssues?: ValidationIssue[];
  id: string; itemId: string; model: string; promptVersion: string; taxonomyRevision: string;
  createdAt: string; source: TagSource; suggestions: Suggestion[];
};
const kinds = new Set(['class','genre','subgenre','subject','theme','trope','setting','tone','audience','format']);
const text = (x: unknown, max: number): x is string => typeof x === 'string' && !!x.trim() && x.length <= max;
export function validateSource(source: TagSource) {
  if (!source || !text(source.text,6000) || !hasSynopsis(source.text.split('\nProvider genres:')[0]) || source.text.trim().length<32 || !text(source.provider,100) ||
      !text(source.url,1000) || !/^https:\/\//.test(source.url) || !text(source.retrievedAt,100))
    throw new Error('A catalog description, source URL and retrieval date are required. Refresh catalog details first.');
}
// Fail closed: malformed output is never partially applied to the catalog.
export function validateSuggestions(value: unknown, source: TagSource, item: Media, historical=false): Suggestion[] {
  validateSource(source);
  if (!Array.isArray(value) || value.length > 24) throw new Error('Invalid AI suggestions.');
  const seen = new Set<string>();
  return value.map(raw => {
    if(raw && typeof raw.quote==='string' && raw.quote.trim() && !source.text.includes(raw.quote))throw new Error('Evidence quote is not an exact passage in the supplied source.');
    if(raw && typeof raw.confidence==='number' && (raw.confidence<0 || raw.confidence>1))throw new Error('Confidence must be between 0 and 1.');
    if(raw && seen.has(raw.tag))throw new Error('Duplicate suggestion.');
    if (!raw || !text(raw.tag,64) || !/^[a-z][a-z0-9-]+$/.test(raw.tag) || !kinds.has(raw.kind) ||
        typeof raw.proposed !== 'boolean' || !text(raw.quote,1500) || !source.text.includes(raw.quote) ||
        !text(raw.reason,1500) || !Number.isFinite(raw.confidence) || raw.confidence<0 || raw.confidence>1 ||
        !['explicit','inferred'].includes(raw.basis) || seen.has(raw.tag)) throw new Error('AI returned invalid or unsupported evidence.');
    if(raw.centrality!==undefined && !['central','substantial'].includes(raw.centrality))throw new Error('Incidental mentions cannot become recommendation tags.');
    if(raw.centrality==='substantial' && ['genre','subgenre'].includes(raw.kind))throw new Error('Genre and subgenre suggestions need central story evidence.');
    seen.add(raw.tag);
    const node=Object.hasOwn(taxonomy,raw.tag)?taxonomy[raw.tag]:undefined;
    if(raw.proposed) {
      if((!historical && (node || resolveTaxonomyTag(raw.tag)!==raw.tag)) || !text(raw.definition,2000)) throw new Error('Invalid new-tag proposal.');
    } else if(!historical){
      if(!node || node.retired)throw new Error('Tag is not an active approved ID; new concepts must be proposed separately.');
      if(node.kind!==raw.kind)throw new Error('Category does not match the approved taxonomy category.');
      if(!tagApplicable(raw.tag,item))throw new Error('Tag does not apply to this media type or content class.');
    }
    return {...(raw.centrality?{centrality:raw.centrality}:{}),tag:raw.tag,kind:raw.kind,proposed:raw.proposed,...(raw.proposed?{definition:raw.definition}:{}),quote:raw.quote,
      reason:raw.reason,confidence:raw.confidence,basis:raw.basis,status:'pending'};
  });
}
// Validate independently; invalid rows remain diagnostics, never reviewable tags.
export function partitionSuggestions(value:unknown,source:TagSource,item:Media){
 validateSource(source);
 if(!Array.isArray(value) || value.length>24)throw new Error('Expected an array of at most 24 suggestions.');
 const suggestions:Suggestion[]=[];const validationIssues:ValidationIssue[]=[];const seen=new Set<string>();
 value.forEach((raw,index)=>{
  try{
   const [row]=validateSuggestions([raw],source,item);
   if(seen.has(row.tag))throw new Error('Duplicate suggestion.');
   seen.add(row.tag);suggestions.push(row);
  }catch(e){validationIssues.push({index,tag:typeof raw?.tag==='string'?raw.tag.slice(0,64):'(missing tag)',reason:(e as Error).message});}
 });
 return {suggestions,validationIssues};
}
export function reviewSuggestion(analysis: TagAnalysis, index: number, decision: 'accepted'|'rejected', item: Media, replacement?: string, reason=''): TagAnalysis {
  const row=analysis.suggestions[index];
  if(!row || analysis.itemId!==item.id) throw new Error('Suggestion does not belong to this title.');
  const tag=replacement || row.tag;
  if(decision==='accepted' && (!Object.hasOwn(taxonomy,tag) || taxonomy[tag].retired || !tagApplicable(tag,item)))
    throw new Error('Approve and publish new tags in the taxonomy editor first, or choose an existing tag.');
  const at=new Date().toISOString();
  const history=[...(row.history || []),{status:decision,tag:decision==='accepted'?tag:undefined,reason:reason.slice(0,1000),at}].slice(-100);
  return {...analysis,suggestions:analysis.suggestions.map((s,i)=>i===index?{...s,status:decision,
    reviewedTag:decision==='accepted'?tag:undefined,reviewReason:reason.slice(0,1000),reviewedAt:at,history}:s)};
}
export function acceptedAnalysisTags(analyses: TagAnalysis[], item: Media): string[] {
  // Latest explicit review wins; a new pending analysis never overwrites a human decision.
  const decisions=new Map<string,{accepted:boolean;time:string}>();
  for(const a of analyses) if(a.itemId===item.id) for(const s of a.suggestions) {
    if(s.status==='pending' || !s.reviewedAt)continue;
    const tag=s.reviewedTag || s.tag;
    if(!Object.hasOwn(taxonomy,tag) || taxonomy[tag].retired || !tagApplicable(tag,item))continue;
    if(!decisions.has(tag) || decisions.get(tag)!.time<=s.reviewedAt)
      decisions.set(tag,{accepted:s.status==='accepted',time:s.reviewedAt});
  }
  return [...decisions].filter(([,v])=>v.accepted).map(([tag])=>tag);
}
export function restoreAnalyses(value: unknown, item: Media): TagAnalysis[] {
  if(!Array.isArray(value))return [];
  return value.slice(-10).flatMap(a=>{
    try {
      if(a.itemId!==item.id || !text(a.id,100) || !text(a.model,200) || !text(a.promptVersion,100) || !text(a.taxonomyRevision,100) || !text(a.createdAt,100))return [];
      const clean=validateSuggestions(a.suggestions,a.source,item,true);
      const suggestions=clean.map((s,i)=>{
        const old=a.suggestions[i];
        if(!['accepted','rejected'].includes(old.status) || !text(old.reviewedAt,100))return s;
        if(old.status==='accepted' && (!text(old.reviewedTag,64) || !Object.hasOwn(taxonomy,old.reviewedTag) || taxonomy[old.reviewedTag].retired || !tagApplicable(old.reviewedTag,item)))return s;
        const history=Array.isArray(old.history)?old.history.slice(-100).filter((h:any)=>h && ['accepted','rejected'].includes(h.status) && text(h.at,100) && typeof h.reason==='string' && h.reason.length<=1000 && (h.tag===undefined || text(h.tag,64))):[];
        return {...s,history,status:old.status,reviewedTag:old.reviewedTag,reviewedAt:old.reviewedAt,reviewReason:typeof old.reviewReason==='string'?old.reviewReason.slice(0,1000):''};
      });
      const validationIssues=Array.isArray(a.validationIssues)?a.validationIssues.slice(0,24).filter((v:any)=>Number.isInteger(v?.index) && v.index>=0 && v.index<24 && text(v.tag,64) && text(v.reason,500)):[];
      return [{validationIssues,id:a.id,itemId:a.itemId,model:a.model,promptVersion:a.promptVersion,taxonomyRevision:a.taxonomyRevision,createdAt:a.createdAt,source:a.source,suggestions}];
    } catch {return [];}
  });
}

