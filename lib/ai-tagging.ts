import { taxonomy, tagApplicable, resolveTaxonomyTag, type TaxonomyKind } from './taxonomy.ts';
import { hasSynopsis } from './catalog-text.ts';
import type { Media } from './recommendations';

export type TagSource = { text: string; provider: string; url: string; retrievedAt: string };
export type ReviewDecision = { status: 'accepted'|'rejected'; tag?:string; reason:string; at:string };
export type Suggestion = {
  tag: string; kind: TaxonomyKind; definition?: string; proposed: boolean;
  quote: string; reason: string; confidence: number; basis: 'explicit' | 'inferred';
  history?: ReviewDecision[];
  status: 'pending' | 'accepted' | 'rejected'; reviewedTag?: string; reviewReason?: string; reviewedAt?: string;
};
export type TagAnalysis = {
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
    if (!raw || !text(raw.tag,64) || !/^[a-z][a-z0-9-]+$/.test(raw.tag) || !kinds.has(raw.kind) ||
        typeof raw.proposed !== 'boolean' || !text(raw.quote,1500) || !source.text.includes(raw.quote) ||
        !text(raw.reason,1500) || !Number.isFinite(raw.confidence) || raw.confidence<0 || raw.confidence>1 ||
        !['explicit','inferred'].includes(raw.basis) || seen.has(raw.tag)) throw new Error('AI returned invalid or unsupported evidence.');
    seen.add(raw.tag);
    const node=Object.hasOwn(taxonomy,raw.tag)?taxonomy[raw.tag]:undefined;
    if(raw.proposed) {
      if((!historical && (node || resolveTaxonomyTag(raw.tag)!==raw.tag)) || !text(raw.definition,2000)) throw new Error('Invalid new-tag proposal.');
    } else if(!historical && (!node || node.retired || node.kind!==raw.kind || !tagApplicable(raw.tag,item))) throw new Error('AI returned an unavailable taxonomy tag.');
    return {tag:raw.tag,kind:raw.kind,proposed:raw.proposed,...(raw.proposed?{definition:raw.definition}:{}),quote:raw.quote,
      reason:raw.reason,confidence:raw.confidence,basis:raw.basis,status:'pending'};
  });
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
      return [{id:a.id,itemId:a.itemId,model:a.model,promptVersion:a.promptVersion,taxonomyRevision:a.taxonomyRevision,createdAt:a.createdAt,source:a.source,suggestions}];
    } catch {return [];}
  });
}

