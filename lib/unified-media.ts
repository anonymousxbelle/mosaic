import {featureKind} from './features.ts';
import {normalizeGenres} from './genres.ts';
import type {Media} from './recommendations';
export type UnifiedFields={schemaVersion:1;genres:string[];themes:string[];moods:string[];creators:string[];keywords:string[]};
export function toUnifiedRecord<T extends Media>(item:T):T & UnifiedFields {
 const tags=[...new Set(item.tags)];
 return {...item,schemaVersion:1,genres:[...new Set([...(item.genres||[]),...normalizeGenres(tags.filter(t=>['genre','subgenre'].includes(featureKind(t))))])],
  themes:tags.filter(t=>['theme','trope'].includes(featureKind(t))),
  moods:tags.filter(t=>featureKind(t)==='tone'),
  // TVmaze's legacy display credit is a network, not an author/creator.
  creators:!item.id.startsWith('tvmaze:') && item.creator && !/unavailable|unknown/i.test(item.creator)?[item.creator]:[],keywords:tags};
}
export function validUnifiedRecord(value:unknown):value is Media & UnifiedFields {
 const x=value as Media & UnifiedFields;
 return !!x && x.schemaVersion===1 && typeof x.id==='string' && !!x.id && typeof x.title==='string' && !!x.title && ['Book','Movie','TV','Game','Music'].includes(x.type) && typeof x.creator==='string' && typeof x.description==='string' &&
 ['tags','genres','themes','moods','creators','keywords'].every(key=>Array.isArray(x[key as keyof typeof x]) && (x[key as keyof typeof x] as unknown[]).every(v=>typeof v==='string'));
}
