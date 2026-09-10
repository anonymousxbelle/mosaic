'use client';
import { useState } from 'react';
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
}: {
  item: Media;
  seed?: Media;
  library: Media[];
  onDismiss: () => void;
}) {
  const [kind, setKind] = useState('good-match'),
    [reason, setReason] = useState(''),
    [message, setMessage] = useState(''),
    [target, setTarget] = useState('');
  function save() {
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
        'Saved in this browser. Community sharing is awaiting account setup.',
      );
      if (kind === 'not-for-me') onDismiss();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save feedback.');
    }
  }
  return (
    <details>
      <summary>Rate this match / Not accurate</summary>
      <p>
        Feedback about the recommendation or metadata is separate from your
        personal star rating.
      </p>
      <label>
        Feedback{' '}
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="good-match">Good match</option>
          <option value="not-for-me">Not for me</option>
          <option value="incorrect-tag">Not accurate: tag or genre</option>
          <option value="incorrect-content-rating">
            Not accurate: content rating
          </option>
          <option value="incorrect-details">
            Not accurate: title or other details
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
        Why? (optional, 280 characters)
        <textarea
          value={reason}
          maxLength={280}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <button onClick={save}>Save feedback</button>
      <button
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
        Export my feedback
      </button>
      <p role="status">{message}</p>
    </details>
  );
}
