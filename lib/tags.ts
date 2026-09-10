import { detailedFeatures } from './features.ts';
import type { Media } from './recommendations';
export type TagEdits = Record<string, { added: string[]; hidden: string[] }>;
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
  return [
    ...new Set([
      ...[
        ...new Set([
          ...item.tags,
          ...detailedFeatures(item.description, item.genres || []),
        ]),
      ].filter((t) => !edit?.hidden.includes(t)),
      ...(edit?.added || []),
    ]),
  ];
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
      hidden: [
        ...new Set([
          ...item.tags,
          ...detailedFeatures(item.description, item.genres || []),
        ]),
      ].filter((t) => edit.hidden.includes(t)),
    };
  }
  return out;
}
