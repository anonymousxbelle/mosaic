'use client';
import { useState } from 'react';
import Link from 'next/link';
import {taxonomy,taxonomyLabel} from '@/lib/taxonomy';
import {pausedMediaTags} from '@/lib/genres';
import {
  genreDescription,
  glossaryTags,
  parentGenre,
} from '@/lib/genre-descriptions';
export function GenreGuide() {
  const [q, setQ] = useState('');
  return (
    <details className="account-panel">
      <summary>What do these genres and tags mean?</summary>
      <p><Link href="/taxonomy/">Open the taxonomy editor</Link> to draft definitions and relationships.</p>
      <label>
        Find a genre or tag{' '}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. historical romance, sports anime"
        />
      </label>
      <dl>
        {glossaryTags.filter(t=>!pausedMediaTags.has(t)&&!taxonomy[t]?.retired)
          .filter((t) =>
            t
              .replaceAll('-', ' ')
              .includes(q.toLowerCase().replaceAll('-', ' ')),
          )
          .map((t) => (
            <div key={t}>
              <dt>
                <strong>{taxonomyLabel(t)}</strong>
                {parentGenre(t) ? ' · ' + parentGenre(t) : ''}
              </dt>
              <dd>{genreDescription(t)}</dd>
            </div>
          ))}
      </dl>
    </details>
  );
}
