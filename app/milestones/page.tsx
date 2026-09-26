'use client';
import {useEffect,useState,useRef} from 'react';
import Link from 'next/link';
import {catalog} from '@/lib/catalog';
import {profile,recommend,type Ratings} from '@/lib/recommendations';
import {liveEvidenceSearch,verifyEvidenceSelection,MILESTONE_STORAGE_KEY} from '@/lib/milestone-evidence';
import {validUnifiedRecord} from '@/lib/unified-media';
type SearchEvidence=Awaited<ReturnType<typeof liveEvidenceSearch>>;
export default function Milestones(){
 const [ratings,setRatings]=useState<Ratings>({});
 const [saved,setSaved]=useState<SearchEvidence['normalized']>([]);
 const [ready,setReady]=useState(false),[query,setQuery]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [evidence,setEvidence]=useState<SearchEvidence|null>(null);
 const [selected,setSelected]=useState(''),[notice,setNotice]=useState('');
 const request=useRef<AbortController|null>(null);
 useEffect(()=>{try{const value=JSON.parse(localStorage.getItem(MILESTONE_STORAGE_KEY)||'{}');
  const entries=Array.isArray(value.saved)?value.saved.filter(validUnifiedRecord):[];setSaved(entries);
  const ids=new Set([...catalog,...entries].map(x=>x.id));
  setRatings(Object.fromEntries(Object.entries(value.ratings||{}).filter(([id,r])=>ids.has(id)&&Number.isInteger(r)&&Number(r)>=1&&Number(r)<=5)) as Ratings);
 }catch{setError('Stored verification preferences could not be read.');}setReady(true);return()=>request.current?.abort();},[]);
 useEffect(()=>{if(ready)try{localStorage.setItem(MILESTONE_STORAGE_KEY,JSON.stringify({version:1,ratings,saved}));}catch{setError('Storage unavailable; preferences will not survive reload.');}},[ready,ratings,saved]);
 const items=[...catalog,...saved],taste=profile(items,ratings),matches=recommend(catalog,taste,'All',Object.keys(ratings));
 async function search(){request.current?.abort();const controller=new AbortController();request.current=controller;setBusy(true);setError('');setNotice('');setEvidence(null);setSelected('');try{const result=await liveEvidenceSearch(query,controller.signal);if(!controller.signal.aborted)setEvidence(result);}catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Search failed. Retry.');}finally{if(!controller.signal.aborted)setBusy(false);}}
 async function save(){const item=evidence?.normalized.find(x=>x.id===selected);if(!item)return;const controller=new AbortController();request.current=controller;setBusy(true);setError('');try{const verified=await verifyEvidenceSelection(item,controller.signal);if(controller.signal.aborted)return;setSaved(old=>[...old.filter(x=>x.id!==verified.id),verified]);setNotice('Verified by provider ID and saved: '+verified.title);}catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Verification failed.');}finally{if(!controller.signal.aborted)setBusy(false);}}
 function download(){const payload={version:1,catalogSource:'data/catalog.json',catalogCount:catalog.length,ratings,saved,taste,search:evidence,selectedId:selected};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='mosaic-milestone-evidence.json';a.click();URL.revokeObjectURL(url);}
 return <main style={{maxWidth:1000,margin:'auto',padding:32}}><Link href="/">← Back to Mosaic</Link><h1>Milestone verification</h1>
 <p>This isolated course workspace loads 25 curated records from JSON. They are fixtures, not API results. It does not add demos to your normal library or enable games/music in discovery.</p>
 <p><Link href="/week8/">Week 8: rated profiles, cosine scores and cross-media recommendations →</Link></p>
 <section><h2>Week 4 · Structured catalog & preferences</h2><p>{catalog.length} records loaded from data/catalog.json. Five each: Book, Game, Music, Movie and TV.</p>
 <div style={{overflowX:'auto'}}><table><thead><tr><th>Title</th><th>Type</th><th>Rating</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td style={{padding:8}}>{item.title}</td><td>{item.type}</td><td><select aria-label={'Rate '+item.title} value={ratings[item.id]||''} onChange={e=>setRatings(old=>{const next={...old};if(e.target.value)next[item.id]=Number(e.target.value);else delete next[item.id];return next;})}><option value="">Not rated</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} stars</option>)}</select></td></tr>)}</tbody></table></div>
 <p>Storage key: <code>{MILESTONE_STORAGE_KEY}</code>. Reload to verify persistence. The same profile and ranking functions used in Mosaic consume these ratings.</p>
 <details><summary>Stored preferences and computed profile</summary><pre>{JSON.stringify({ratings,savedIds:saved.map(x=>x.id),taste},null,2)}</pre></details>
 <h3>Recommendations from the stored course catalog</h3><ol>{matches.slice(0,5).map(x=><li key={x.id}>{x.title} · {x.score.toFixed(3)}</li>)}</ol></section>
 <section><h2>Week 6 · Live TVmaze workflow</h2><p>Search a real title, inspect the raw response and unified records, select one, and verify its provider ID before saving. TVmaze is a direct public provider; this audit does not require secret credentials.</p>
 <form onSubmit={e=>{e.preventDefault();void search();}}><label>Title <input value={query} onChange={e=>{request.current?.abort();setBusy(false);setQuery(e.target.value);setEvidence(null);setSelected('');setNotice('');setError('');}} /></label><button disabled={busy} type="submit">{busy?'Working…':'Search live TV catalog'}</button></form>
 {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {evidence&&<><p role="status">HTTP {evidence.httpStatus} · {evidence.normalized.length} results{!evidence.normalized.length?' · No matching titles. Check spelling or try another title.':''}</p><label>Catalog result <select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select a title</option>{evidence.normalized.map(x=><option key={x.id} value={x.id}>{x.title} ({x.id})</option>)}</select></label><button disabled={!selected||busy} onClick={save}>Verify & save selection</button>
 <details><summary>Raw API response</summary><pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(evidence.raw,null,2)}</pre></details><details><summary>Normalized Mosaic records</summary><pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(evidence.normalized,null,2)}</pre></details></>}
 <button onClick={download}>Download evidence JSON</button></section></main>;
}
