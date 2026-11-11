import {sportsCentrality} from './tag-centrality.ts';
import { acceptedAnalysisTags, restoreAnalyses, type TagAnalysis } from './ai-tagging.ts';
import {tagApplicable} from './taxonomy.ts';
import { detailedFeatures } from './features.ts';
import type { Media } from './recommendations';
export type TagEdits = Record<string, { added: string[]; hidden: string[]; analyses?: TagAnalysis[] }>;
export function normalizeTag(raw: string): string {
  const tag = raw
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
  if (
    tag.length < 2 ||
    tag.length > 32 ||
    !/^\p{L}[\p{L}\p{N}-]*$/u.test(tag) ||
    ['constructor', 'prototype', '__proto__'].includes(tag)
  )
    throw new Error(
      'Use 2–32 letters, numbers or spaces, starting with a letter.',
    );
  return tag;
}
export function effectiveTags(item: Media, edit?: TagEdits[string]): string[] {
  const role=sportsCentrality(item.description,(item as Media & {sourceGenreLabels?:string[]}).sourceGenreLabels || item.genres || []);
  return [
    ...new Set([
      ...[
        ...new Set([
          ...item.tags,
          ...detailedFeatures(item.description, item.genres || []),
        ]),
      ].filter((t) => !edit?.hidden.includes(t))
      .filter(t=>!['sports','sports-drama','sports-anime'].includes(t)||role==='central')
      .filter(t=>!['basketball','football','baseball'].includes(t)||role!=='incidental'),
      ...(edit?.added || []),
      ...acceptedAnalysisTags(edit?.analyses || [],item).filter(t=>!edit?.hidden.includes(t)),
    ]),
  ].filter(tag=>tagApplicable(tag,{...item,tags:[...item.tags,...(edit?.added||[])]}));
}
export function restoreTagEdits(value: unknown, items: Media[]): TagEdits {
  const out: TagEdits = Object.create(null);
  if (!value || typeof value !== 'object') return out;
  for (const item of items) {
    const edit = (value as TagEdits)[item.id];
    if (!edit || !Array.isArray(edit.added) || !Array.isArray(edit.hidden))
      continue;
    const added: string[] = [];
    for (const raw of edit.added.slice(0, 12)) {
      try {
        if (typeof raw === 'string') {
          const t = normalizeTag(raw);
          if (!added.includes(t)) added.push(t);
        }
      } catch {}
    }
    out[item.id] = {
      added,
      ...(Array.isArray(edit.analyses)?{analyses:restoreAnalyses(edit.analyses,item)}:{}),
      hidden: [
        ...new Set([
          ...item.tags,
          ...detailedFeatures(item.description, item.genres || []),
          ...acceptedAnalysisTags(restoreAnalyses(edit.analyses,item),item),
        ]),
      ].filter((t) => edit.hidden.includes(t)),
    };
  }
  return out;
}

