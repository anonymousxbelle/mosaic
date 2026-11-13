'use client';
import {useEffect,useRef,useState} from 'react';
import {hasSynopsis} from '@/lib/catalog-text';
import {verifyMedia,type CatalogMedia} from '@/lib/media-api';
import type {Media} from '@/lib/recommendations';

// Description hydration is presentation-only: it must not invalidate or reorder a search.
const requests=new Map<string,Promise<string>>();
function fetchDescription(item:CatalogMedia){
  let request=requests.get(item.id);
  if(!request){
    request=(async()=>{
      let fresh=item;
      if(item.provider==='Open Library'){
        fresh=await(await import('@/lib/book-api')).enrichBook(item);
        if(!hasSynopsis(fresh.description))fresh=await(await import('@/lib/book-enrichment')).enrichBookAcrossSources(fresh);
      }else fresh=await verifyMedia(item);
      return hasSynopsis(fresh.description)?fresh.description:'';
    })();
    if(requests.size>=100)requests.delete(requests.keys().next().value!);
    requests.set(item.id,request);
    request.catch(()=>requests.delete(item.id));
  }
  return request;
}
export function AutoSynopsis({item,previewLength=420}:{item:Media;previewLength?:number}){
  const root=useRef<HTMLDivElement>(null);
  const [description,setDescription]=useState(item.description);
  const [status,setStatus]=useState<'waiting'|'loading'|'done'|'error'>('waiting');
  const [retry,setRetry]=useState(0);
  const [expanded,setExpanded]=useState(false);
  useEffect(()=>setExpanded(false),[item.id]);
  useEffect(()=>{
    let active=true;
    if(hasSynopsis(item.description)){setDescription(item.description);setStatus('done');return;}
    const load=()=>{
      if(!('provider' in item)){setStatus('done');return;}
      setStatus('loading');
      fetchDescription(item as CatalogMedia).then(text=>{if(active){setDescription(text);setStatus('done');}})
        .catch(()=>{if(active)setStatus('error');});
    };
    if(!root.current)return;
    if(!('IntersectionObserver' in window)){load();return()=>{active=false;};}
    const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();load();}},{rootMargin:'250px'});
    observer.observe(root.current);
    return()=>{active=false;observer.disconnect();};
  },[item.id,item.description,retry]);
  const preview=description.length>previewLength?description.slice(0,previewLength).replace(/\s+\S*$/,''):description;
  
  return (
    <div ref={root} className="synopsis">
      <p className="description">
        {hasSynopsis(description)
          ? description.length > previewLength && !expanded
            ? preview + '…'
            : description
          : status === 'error'
            ? 'The synopsis could not load.'
            : status === 'done'
              ? 'No synopsis is available from the catalog. Use the source link for more details.'
              : 'Loading synopsis…'}
  
        {hasSynopsis(description) &&
          description.length > previewLength && (
            <>
              {' '}
              <button
                type="button"
                className="synopsis-toggle"
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? 'Show less' : 'Continue reading'}
              </button>
            </>
          )}
      </p>
  
      {status === 'error' && (
        <button onClick={() => setRetry((n) => n + 1)}>
          Retry synopsis
        </button>
      )}
    </div>
  );

}
