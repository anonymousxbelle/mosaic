'use client';
import {useId,useState} from 'react';
import {normalizeTag} from '@/lib/tags';
import {resolveTaxonomyTag,taxonomy,taxonomyLabel} from '@/lib/taxonomy';
export function TagChoice({label,selected,onChange,suggestions,limit=30}:{label:string;selected:string[];onChange:(tags:string[])=>void;suggestions:string[];limit?:number}){
 const id=useId(),[text,setText]=useState(''),[error,setError]=useState('');
 function add(raw:string){const tag=normalizeTag(resolveTaxonomyTag(raw));if(!tag){setError('Use 2–32 characters: letters, numbers and spaces.');return;}if(selected.length>=limit&&!selected.includes(tag)){setError(`Choose up to ${limit} tags.`);return;}onChange([...new Set([...selected,tag])]);setText('');setError('');}
 const matches=[...new Set(suggestions)].filter(t=>!selected.includes(t)&&taxonomyLabel(t).toLowerCase().includes(text.toLowerCase())).sort((a,b)=>taxonomyLabel(a).localeCompare(taxonomyLabel(b))).slice(0,8);
 return <div className="tag-choice"><label htmlFor={id}>{label}</label><div className="tag-entry"><input id={id} value={text} maxLength={64} placeholder="Type a genre, theme or tag…" onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();add(text);}}}/><button type="button" disabled={!text.trim()} onClick={()=>add(text)}>Add</button></div>
 <p>Choose a label such as sports to exclude titles tagged sports. This does not scan the whole description: a title with a missing sports tag may still appear. Typing your own term works only when a title has that tag. To correct a title's labels, use Edit tags in My Library.</p>
 {error&&<p role="alert">{error}</p>}
 <div className="tag-options" aria-label={label+' selected'}>{selected.map(t=><button key={t} onClick={()=>onChange(selected.filter(x=>x!==t))} aria-label={'Remove '+taxonomyLabel(t)}>{taxonomyLabel(t)} ×</button>)}</div>
 <div className="tag-options" aria-label={label+' suggestions'}>{matches.map(t=><button key={t} title={taxonomy[t]?.description} onClick={()=>add(t)}>+ {taxonomyLabel(t)}</button>)}</div></div>;
}

