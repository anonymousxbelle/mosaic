import type {TaxonomyNode} from './taxonomy.ts';
export const kinds=['class','genre','subgenre','theme','trope','setting','tone','audience','format'] as const;
export type TaxonomyDocument={version:1;nodes:Record<string,TaxonomyNode>};
export const slug=(s:string)=>s.normalize('NFKC').trim().toLowerCase().replace(/[\s_]+/g,'-');
export function validateTaxonomy(value:unknown):string[]{
 const errors:string[]=[];
 if(!value || typeof value!=='object')return ['Expected a taxonomy document.'];
 const doc=value as TaxonomyDocument;
 if(doc.version!==1)return ['Unsupported document version.'];
 if(!doc.nodes || typeof doc.nodes!=='object'||Array.isArray(doc.nodes))return ['Expected a nodes object.'];
 if(Object.keys(doc.nodes).length>2000)return ['Maximum 2,000 tags.'];
 const aliases=new Map<string,string>();
 for(const [id,node] of Object.entries(doc.nodes)){
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)||id.length>100)errors.push(`Invalid stable ID: ${id}`);
  if(!node || typeof node!=='object'){errors.push(`${id}: invalid tag.`);continue;}
  if(!kinds.includes(node.kind))errors.push(`${id}: choose a valid type.`);
  if(typeof node.description!=='string'||!node.description.trim()||node.description.length>2000)errors.push(`${id}: description must contain 1–2,000 characters.`);
  if(node.label!==undefined&&(typeof node.label!=='string'||!node.label.trim()||node.label.length>100))errors.push(`${id}: invalid display name.`);
  for(const key of ['parents','classes','media','aliases'] as const){const a=node[key];if(a!==undefined&&(!Array.isArray(a)||a.some(x=>typeof x!=='string')||a.length>100))errors.push(`${id}: invalid ${key}.`);}
  if(node.retired!==undefined&&typeof node.retired!=='boolean')errors.push(`${id}: invalid archive status.`);
 }
 if(errors.length)return errors;
 for(const id of ['fiction','non-fiction'])if(doc.nodes[id]?.kind!=='class'||doc.nodes[id]?.retired)errors.push(`Keep ${id} as an active content class.`);
 for(const [id,node] of Object.entries(doc.nodes)){
  for(const c of node.classes||[])if(!['fiction','non-fiction','unknown'].includes(c))errors.push(`${id}: invalid content class.`);
  for(const m of node.media||[])if(!['Book','TV','Movie','Music','Game'].includes(m))errors.push(`${id}: invalid media type.`);
  for(const parent of node.parents||[]){if(!Object.hasOwn(doc.nodes,parent))errors.push(`${id}: missing related tag ${parent}.`);else if(!node.retired&&doc.nodes[parent].retired)errors.push(`${id}: ${parent} is archived. Remove this relationship first.`);}
  for(const alias of node.aliases||[]){const key=slug(alias);if(!key||key.length>100)errors.push(`${id}: invalid alias.`);if(Object.hasOwn(doc.nodes,key)&&key!==id)errors.push(`${id}: alias conflicts with ${key}.`);if(aliases.has(key)&&aliases.get(key)!==id)errors.push(`${id}: alias ${key} already belongs to ${aliases.get(key)}.`);aliases.set(key,id);}
 }
 const done=new Set<string>(),visiting=new Set<string>();
 function visit(id:string){if(visiting.has(id)){errors.push(`Circular relationship at ${id}.`);return;}if(done.has(id))return;visiting.add(id);for(const p of doc.nodes[id]?.parents||[])visit(p);visiting.delete(id);done.add(id);}
 Object.keys(doc.nodes).forEach(visit);
 return [...new Set(errors)];
}
export function canonicalTag(tag:string,nodes:Record<string,TaxonomyNode>){const key=slug(tag);if(Object.hasOwn(nodes,key))return key;return Object.keys(nodes).find(id=>(nodes[id].aliases||[]).some(a=>slug(a)===key))||key;}
export function previewSuggestions(nodes:Record<string,TaxonomyNode>,tags:string[],media:string,contentClass:string){
 const known=new Set(tags.map(t=>canonicalTag(t,nodes)));
 for(let i=0;i<Object.keys(nodes).length;i++){const size=known.size;for(const tag of [...known])for(const p of nodes[tag]?.parents||[])known.add(p);if(size===known.size)break;}
 return Object.entries(nodes).filter(([,n])=>!n.retired&&(!n.media?.length||n.media.includes(media))&&(!n.classes?.length||n.classes.includes(contentClass as never))&&(!n.parents?.length||n.parents.some(p=>known.has(p)))).map(([id])=>id).sort();
}
