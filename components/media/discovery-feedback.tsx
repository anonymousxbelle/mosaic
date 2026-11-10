'use client';
import { useState,useRef,useEffect } from 'react';
import {catalogApi} from '@/lib/media-api';
import type { Media } from '@/lib/recommendations';
export type FeedbackEntry = {
  id: string;
  seedId?: string;
  kind: string;
  reason: string;
  at: string;
};
export function DiscoveryFeedback({
  item,
  seed,
  library,
  onDismiss,
  reviewer=false,
}: {
  reviewer?: boolean;
  item: Media;
  seed?: Media;
  library: Media[];
  onDismiss: () => void;
}) {
  const [kind, setKind] = useState('good-match'),
    [reason, setReason] = useState(''),
    [message, setMessage] = useState(''),
    [target, setTarget] = useState('');
  const [sharedReady,setSharedReady]=useState(false);
  useEffect(()=>{let active=true;if(catalogApi)fetch(catalogApi+'/status',{signal:AbortSignal.timeout(8000)}).then(r=>r.json()).then((data:any)=>{if(active)setSharedReady(data.feedback===true);}).catch(()=>{});return()=>{active=false;};},[]);
  const [send,setSend]=useState(false),[busy,setBusy]=useState(false);
  const submission=useRef<{payload:string;id:string}|null>(null);
  async function save() {
    if(busy)return;
    setBusy(true);
    try {
      if (reason.trim().length > 280)
        throw Error('Keep the reason to 280 characters.');
      if (kind === 'suggest-similar' && (!target || target === item.id))
        throw Error('Choose a different saved catalog title.');
      const key = 'mosaic-feedback-v1';
      const raw = JSON.parse(localStorage.getItem(key) || '[]');
      const entries: Array<FeedbackEntry> = Array.isArray(raw)
        ? raw
            .filter(
              (x) =>
                x && typeof x.id === 'string' && typeof x.kind === 'string',
            )
            .slice(-199)
        : [];
      const entry = {
        id: item.id,
        seedId: kind === 'suggest-similar' ? target : seed?.id,
        kind,
        reason: reason.trim(),
        at: new Date().toISOString(),
      };
      const prior = entries.findIndex(
        (x) =>
          x.id === entry.id &&
          x.seedId === entry.seedId &&
          x.kind === entry.kind,
      );
      if (prior >= 0) entries.splice(prior, 1);
      entries.push(entry);
      localStorage.setItem(key, JSON.stringify(entries));
      setMessage(
        'Feedback saved in this browser. It is not sent automatically or used to train the AI.',
      );
      if (kind === 'not-for-me') onDismiss();
      if(send){
        if(!catalogApi)throw Error('Saved locally, but shared feedback is not configured.');
        const chosen=library.find(x=>x.id===target);
        const payload={itemId:item.id,title:item.title.slice(0,300),type:item.type,kind,reason:reason.trim(),seedId:kind==='suggest-similar'?target:seed?.id||'',seedTitle:kind==='suggest-similar'?chosen?.title||'':seed?.title||''};
        const fingerprint=JSON.stringify(payload);if(submission.current?.payload!==fingerprint)submission.current={payload:fingerprint,id:crypto.randomUUID()};
        const response=await fetch(catalogApi+'/feedback',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify({...payload,submissionId:submission.current.id}),signal:AbortSignal.timeout(15000)});
        const result=await response.json() as {error?:string};if(!response.ok)throw Error('Saved locally. Not sent: '+(result.error||'Please retry.'));
        setMessage('Sent to the Mosaic project owner’s private inbox. This does not train the AI or automatically change catalog tags.');
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save feedback.');
    } finally {setBusy(false);}
  }
  return (
    <details className="feedback-panel">
      <summary>Share feedback</summary>
      <p>
        Your feedback helps identify ways to improve recommendations. “Not for me” hides this title; other reports are saved locally for review and do not change your star rating.
      </p>
      <label>
        Feedback{' '}
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="good-match">Good match</option>
          <option value="not-for-me">Not for me</option>
          <option value="incorrect-tag">Report incorrect tag or genre</option>
          <option value="incorrect-content-rating">
            Report incorrect content rating
          </option>
          <option value="incorrect-details">
            Report incorrect title or other details
          </option>
          <option value="suggest-similar">Suggest a similar saved title</option>
        </select>
      </label>
      {kind === 'suggest-similar' && (
        <label>
          Similar title{' '}
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">Choose a title</option>
            {library
              .filter((x) => x.id !== item.id && x.id.includes(':'))
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title}
                </option>
              ))}
          </select>
        </label>
      )}
      <label>
        Tell us more (optional, up to 280 characters)
        <textarea rows={3} placeholder="What feels right or needs correcting?"
          value={reason}
          maxLength={280}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <label className="feedback-consent"><input type="checkbox" disabled={!sharedReady||busy} checked={send} onChange={e=>setSend(e.target.checked)}/>Send this feedback to the Mosaic project owner</label>{!sharedReady&&<p>Shared submissions are not available yet. You can save feedback in this browser.</p>}<p>When checked, the title, starting/suggested title, feedback type and your explanation are stored privately on Cloudflare for project review. Your library, star ratings and personal tags are not sent. Do not include names, contact details or other personal information. Feedback is not used for AI training automatically.</p>
      <button disabled={busy} onClick={save}>{busy?'Saving…':send?'Send feedback':'Save in this browser'}</button>
      {reviewer && <button
        onClick={() => {
          try {
            const raw = localStorage.getItem('mosaic-feedback-v1') || '[]';
            const blob = new Blob([raw], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mosaic-feedback.json';
            a.click();
            URL.revokeObjectURL(url);
          } catch {
            setMessage('Could not export feedback.');
          }
        }}
      >
        Download feedback for review
      </button>}
      <p role="status">{message}</p>
    </details>
  );
}

