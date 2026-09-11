import type { Media } from './recommendations';
const normalized = (s:string) => s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
// Only remove explicit edition/format suffixes; preserve subtitles and volume numbers.
export function workIdentity(item:Media):string {
 const title=item.type==='Book' ? item.title.replace(/\s*[:(\[]\s*(?:(?:first|second|new|revised|illustrated|anniversary|special|collector.s|american|british)\s+)*(?:edition|paperback|hardcover|audiobook)(?:\s*[:\-][^\])]+)?\s*[\])]?$/i,'') : item.title;
 return item.type+':'+normalized(title)+':'+normalized(item.creator);
}
export function sameWork(a:Media,b:Media):boolean {
 if(a.id===b.id) return true;
 if(a.type==='Music' || b.type==='Music') return false;
 if(!a.creator || !b.creator || /unavailable|unknown/i.test(a.creator+' '+b.creator)) return false;
 return workIdentity(a)===workIdentity(b);
}

