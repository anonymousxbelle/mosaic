'use client';
import {useState,useRef} from 'react';
import {catalogApi, type CatalogMedia} from '@/lib/media-api';
import {taxonomy, taxonomyLabel} from '@/lib/taxonomy';
import {reviewSuggestion, restoreAnalyses, type TagAnalysis} from '@/lib/ai-tagging';
import type {Media} from '@/lib/recommendations';
import type {TagEdits} from '@/lib/tags';

export function AiTagReview({item,edit,onChange}:{item:Media;edit:TagEdits[string];onChange:(edit:TagEdits[string])=>void}) {
  const [key,setKey]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [replacements,setReplacements]=useState<Record<string,string>>({});
  const [reasons,setReasons]=useState<Record<string,string>>({});
  const latest=useRef(edit); latest.current=edit;
  const analyses=edit.analyses || [];
  async function analyze(){
    setBusy(true);setMessage('');
    try{
      if(analyses.length>=10)throw Error('This title has 10 saved analyses. Export the review history before starting a new testing round.');
      const record=item as CatalogMedia;
      if(!record.provider || !record.sourceUrl || !record.verifiedAt)throw Error('Refresh catalog details first. This item needs source information.');
      const source={provider:record.provider,url:record.metadataSourceUrl || record.sourceUrl,retrievedAt:record.verifiedAt,
        text:[item.description,...(item.sourceGenreLabels?.length?['Provider genres: '+item.sourceGenreLabels.join(', ')]:[])].join('\n').slice(0,6000)};
      const response=await fetch(catalogApi+'/analyze-tags',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},
        body:JSON.stringify({itemId:item.id,type:item.type,source}),signal:AbortSignal.timeout(30000)});
      const data:any=await response.json();if(!response.ok)throw Error(data.error || 'Analysis failed.');
      const restored=restoreAnalyses([data],item);
      if(restored.length!==1)throw Error('Analysis could not be validated. Nothing was applied.');
      // The endpoint supplies suggestions, never review decisions.
      const analysis={...restored[0],suggestions:restored[0].suggestions.map(s=>({...s,status:'pending' as const,reviewedTag:undefined,reviewedAt:undefined}))};
      onChange({...latest.current,analyses:[...(latest.current.analyses || []),analysis]});
      setMessage(analysis.suggestions.length?'Analysis saved. Review each suggestion below.':'No supported suggestions found. No tags changed.');
    }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
  }
  function decide(a:TagAnalysis,index:number,status:'accepted'|'rejected',replacement?:string){
    try{const updated=reviewSuggestion(a,index,status,item,replacement,reasons[a.id+index] || '');
      onChange({...edit,hidden:status==='accepted'?edit.hidden.filter(t=>t!==(replacement || a.suggestions[index].tag)):edit.hidden,analyses:analyses.map(x=>x.id===a.id?updated:x)});setMessage(status==='accepted'?'Accepted. This tag is now active for this title and matching in your library.':'Rejected. This suggestion contributes no tag; independently supplied catalog tags are unchanged.');
    }catch(e){setMessage((e as Error).message);}
  }
  function download(){
    const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,itemId:item.id,analyses},null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='mosaic-tag-reviews.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <details className="ai-tag-review" style={{padding:'1rem',border:'1px solid var(--border, #ddd)',borderRadius:12}}>
    <summary>AI tag analysis · reviewer testing</summary>
    <p>Analyze the saved catalog description and provider genres. Your ratings and personal tags are not sent. Suggestions remain inactive until accepted. Reviews are local to this browser and do not train the model.</p>
    <label style={{display:'grid',gap:8}}>Reviewer key
      <input type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} placeholder="Configured privately on the backend" />
    </label>
    <p>The key stays in memory only. Confidence is the model’s estimate, not measured accuracy.</p>
    <button disabled={busy || !key || !catalogApi} onClick={analyze}>{busy?'Analyzing…':'Analyze tags'}</button>
    {!catalogApi && <p>Configure the catalog backend to enable analysis.</p>}
    <p role="status">{message}</p>
    {analyses.length>0 && <button onClick={download}>Export evidence and reviews</button>}
    {[...analyses].reverse().map(a=><section key={a.id} style={{marginTop:24}}>
      <h4>Analysis · {new Date(a.createdAt).toLocaleString()}</h4>
      <p>Source: {a.source.provider} · retrieved {a.source.retrievedAt}. This is a saved catalog snapshot, not a fresh fetch.</p>
      <details><summary>Source and analysis record</summary><p style={{overflowWrap:'anywhere'}}>{a.source.url}</p><pre style={{whiteSpace:'pre-wrap'}}>{a.source.text}</pre><p style={{overflowWrap:'anywhere'}}>Model: {a.model} · Prompt: {a.promptVersion} · Taxonomy: {a.taxonomyRevision}</p></details>
      {!!a.validationIssues?.length && <section role="status"><h4>Suggestions excluded by validation</h4><p>These are not available to accept and cannot affect recommendations. Valid suggestions below still need your review.</p><ul>{a.validationIssues.map(v=><li key={v.index}>Suggestion {v.index+1}: {v.tag} — {v.reason}</li>)}</ul></section>}
      {a.suggestions.map((s,i)=>{const row=a.id+i;return <article key={row} style={{padding:16,marginTop:12,border:'1px solid var(--border, #ddd)',borderRadius:10}}>
        <h4>{taxonomyLabel(s.tag)} · {s.kind}{s.proposed?' · New tag proposal':''}</h4>
        {s.definition && <p>{s.definition}</p>}
        <blockquote style={{margin:'12px 0',paddingLeft:12,borderLeft:'3px solid #718b7a'}}>{s.quote}</blockquote>
        <p>{s.reason}</p><p>{s.centrality ? s.centrality+' · ' : ''}{s.basis} · Estimated confidence: {Math.round(s.confidence*100)}% · Review: {s.status}{s.reviewedTag?' as '+taxonomyLabel(s.reviewedTag):''}</p>
        {s.reviewReason && <p>Your reason: {s.reviewReason}</p>}
        <label style={{display:'grid',gap:8}}>Review reason (optional)<input maxLength={1000} value={reasons[row] || ''} onChange={e=>setReasons({...reasons,[row]:e.target.value})} placeholder="Unsupported, too broad, wrong meaning…" /></label>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:12}}>
          <button disabled={busy || (s.proposed && !taxonomy[s.tag])} onClick={()=>decide(a,i,'accepted')}>Accept</button>
          <button disabled={busy} onClick={()=>decide(a,i,'rejected')}>Reject</button>
        </div>
        <label style={{display:'grid',gap:8,marginTop:12}}>Replace with an existing tag
          <select value={replacements[row] || ''} onChange={e=>setReplacements({...replacements,[row]:e.target.value})}><option value="">Choose a correction</option>{Object.entries(taxonomy).filter(([,n])=>!n.retired).sort((a,b)=>taxonomyLabel(a[0]).localeCompare(taxonomyLabel(b[0]))).map(([id,n])=><option key={id} value={id}>{taxonomyLabel(id)} · {n.kind}</option>)}</select>
        </label>
        <button disabled={busy || !replacements[row]} onClick={()=>decide(a,i,'accepted',replacements[row])}>Accept correction</button>
        {s.proposed && <p>New tags need a separate taxonomy decision. Export this proposal, add its definition and applicability in the taxonomy editor, and publish it before applying it here. You can also replace it with an existing tag.</p>}
      </article>;})}
    </section>)}
  </details>;
}

