'use client';
import Link from 'next/link';
import {useState,useEffect} from 'react';
import {catalog} from '@/lib/catalog';
import {categories,type Ratings,type Category} from '@/lib/recommendations';
import {cosineDiscovery,itemVector} from '@/lib/cosine-discovery';
export default function Week8(){
 const [ratings,setRatings]=useState<Ratings>({}),[ready,setReady]=useState(false),[error,setError]=useState('');
 const [mode,setMode]=useState<'for-you'|'based-on'>('for-you'),[seedId,setSeedId]=useState(''),[category,setCategory]=useState<Category|'All'>('All');
 useEffect(()=>{try{const raw=JSON.parse(localStorage.getItem('mosaic-week8-v1')||'{}');setRatings(Object.fromEntries(Object.entries(raw).filter(([id,r])=>catalog.some(x=>x.id===id)&&Number.isInteger(r)&&Number(r)>=1&&Number(r)<=5)) as Ratings);}catch{setError('Stored ratings could not be read.');}setReady(true);},[]);
 useEffect(()=>{if(ready)try{localStorage.setItem('mosaic-week8-v1',JSON.stringify(ratings));}catch{setError('Browser storage unavailable. Ratings will not survive reload.');}},[ratings,ready]);
 const seed=catalog.find(x=>x.id===seedId);
 const run=cosineDiscovery(catalog,{mode,ratings,seed:mode==='based-on'?seed:undefined,category});
 const snapshot={algorithm:'signed-cosine-v1',catalogSource:'data/catalog.json',mode,ratings,seedId,category,vocabulary:run.vocabulary,itemExample:{id:catalog[0].id,vector:itemVector(catalog[0],run.vocabulary)},query:run.query,candidates:run.scored.map(x=>({id:x.id,title:x.title,type:x.type,score:x.score,contributions:x.contributions})),ranked:run.results.map(x=>x.id)};
 function download(){const url=URL.createObjectURL(new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='mosaic-week8-evidence.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return <main style={{maxWidth:1120,margin:'0 auto',padding:32,lineHeight:1.6}}>
 <Link href="/">← Mosaic</Link> · <Link href="/milestones/">Weeks 4 & 6</Link>
 <h1 style={{fontSize:32,margin:'20px 0'}}>Week 8 · Your taste across media</h1>
 <p>This course workspace uses the 25 curated JSON records, including games and music. These are not live API recommendations. The normal Mosaic interface keeps its supported media and also offers this cosine method.</p>
 <p>Rating signals: 5 → +2; 4 → +1; 3 → 0; 2 → −1; 1 → −2. Shared negative features lower scores. Creators are excluded. Results are ordered by actual cosine score, with no AI, story tiers or variety adjustment.</p>
 {error&&<p role="alert">{error}</p>}
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:28,marginTop:24}}>
 <section style={{border:'1px solid #d8d0bd',borderRadius:16,padding:24}}><h2 style={{fontSize:23}}>Your ratings</h2><p>Changes recalculate immediately and are saved separately in this browser.</p>
 <div style={{maxHeight:550,overflow:'auto'}}>{catalog.map(item=><label key={item.id} style={{display:'flex',justifyContent:'space-between',gap:12,padding:'12px 0',borderBottom:'1px solid #eee'}}><span>{item.title}<small style={{display:'block'}}>{item.type}</small></span><select aria-label={'Rate '+item.title} value={ratings[item.id]||''} onChange={e=>setRatings(old=>{const next={...old};if(e.target.value)next[item.id]=Number(e.target.value);else delete next[item.id];return next;})}><option value="">Not rated</option>{[5,4,3,2,1].map(n=><option value={n} key={n}>{n} stars</option>)}</select></label>)}</div></section>
 <section style={{border:'1px solid #d8d0bd',borderRadius:16,padding:24}}><h2 style={{fontSize:23}}>Discover</h2>
 <div role="group" aria-label="Discovery mode" style={{display:'flex',gap:12,margin:'16px 0'}}>{(['for-you','based-on'] as const).map(value=><button key={value} aria-pressed={mode===value} onClick={()=>setMode(value)} style={{padding:'8px 16px',borderRadius:8,background:mode===value?'#245b48':'#eee',color:mode===value?'white':'#222'}}>{value==='for-you'?'For You':'Based On'}</button>)}</div>
 {mode==='based-on'&&<label style={{display:'block',margin:'16px 0'}}>Starting title <select aria-label="Starting title" value={seedId} onChange={e=>setSeedId(e.target.value)}><option value="">Choose a title</option>{catalog.map(x=><option key={x.id} value={x.id}>{x.title} · {x.type}</option>)}</select></label>}
 <label>Target media <select aria-label="Target media" value={category} onChange={e=>setCategory(e.target.value as Category|'All')}><option>All</option>{categories.map(x=><option key={x}>{x}</option>)}</select></label>
 {!run.hasPositiveSignal?<p role="status" style={{marginTop:20}}>{mode==='based-on'?'Choose a starting title to find related media.':'Rate a title 4 or 5 stars to start. No positive taste signal is available yet; neutral, negative or cancelling ratings do not create personalized suggestions.'}</p>:!run.results.length?<p role="status">No positive matches in this category. Try another category or update your ratings.</p>:<ol style={{paddingLeft:24}}>{run.results.map(x=><li key={x.id} style={{padding:'18px 0',borderBottom:'1px solid #eee'}}><h3>{x.title}</h3><p>{x.type} · Cosine score: <strong>{x.score.toFixed(6)}</strong></p><p>Recommended because it shares {x.sharedTags.join(', ')} with {mode==='based-on'?'your starting title':'positive features in your rated profile'}.</p>{x.contributions.some(c=>c.contribution<0)&&<p>Reduced by: {x.contributions.filter(c=>c.contribution<0).map(c=>c.feature).join(', ')}.</p>}</li>)}</ol>}
 </section></div><details style={{marginTop:24}}><summary>Inspect vocabulary, vectors and every candidate score</summary><pre style={{overflow:'auto',maxHeight:500}}>{JSON.stringify(snapshot,null,2)}</pre></details><button style={{padding:12,marginTop:16}} onClick={download}>Download Week 8 evidence</button>
 </main>;
}
