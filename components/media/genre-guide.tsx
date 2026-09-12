'use client';
import { useState } from 'react';
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
      <label>
        Find a genre or tag{' '}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. historical romance, sports anime"
        />
      </label>
      <dl>
        {glossaryTags.filter(t=>!pausedMediaTags.has(t))
          .filter((t) =>
            t
              .replaceAll('-', ' ')
              .includes(q.toLowerCase().replaceAll('-', ' ')),
          )
          .map((t) => (
            <div key={t}>
              <dt>
                <strong>{t.replaceAll('-', ' ')}</strong>
                {parentGenre(t) ? ' · ' + parentGenre(t) : ''}
              </dt>
              <dd>{genreDescription(t)}</dd>
            </div>
          ))}
      </dl>
    </details>
  );
}
