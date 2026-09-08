'use client';
import { useState } from 'react';
import type { Media } from '@/lib/recommendations';
import { normalizeTag, type TagEdits } from '@/lib/tags';
export function TasteCollections({
  items,
  edits,
  onChange,
  onExplore,
}: {
  items: Media[];
  edits: TagEdits;
  onChange: (value: TagEdits) => void;
  onExplore: (tag: string) => void;
}) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const names = [
    ...new Set(items.flatMap((i) => edits[i.id]?.added || [])),
  ].sort();
  return (
    <details className="taste-collections">
      <summary>My taste collections</summary>
      <p>
        Give a connection a name, then group titles across media. These personal
        tags also shape recommendations.
      </p>
      <div className="collection-list">
        {names.map((tag) => (
          <button key={tag} onClick={() => onExplore(tag)}>
            {tag.replace(/-/g, ' ')} ·{' '}
            {items.filter((i) => edits[i.id]?.added.includes(tag)).length}
          </button>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          try {
            const tag = normalizeTag(name);
            const ids = selected.filter((id) => items.some((i) => i.id === id));
            if (!ids.length) throw new Error('Choose at least one title.');
            const next = { ...edits };
            for (const id of ids) {
              const old = next[id] || { added: [], hidden: [] };
              if (!old.added.includes(tag) && old.added.length >= 12)
                throw new Error(
                  'A selected title has 12 personal tags. Remove a tag first.',
                );
              next[id] = { ...old, added: [...new Set([...old.added, tag])] };
            }
            onChange(next);
            setName('');
            setSelected([]);
            setMessage(
              'Collection saved. Open it above to explore its connections.',
            );
          } catch (error) {
            setMessage((error as Error).message);
          }
        }}
      >
        <label>
          Connection name
          <input
            value={name}
            maxLength={64}
            placeholder="Beautiful but unsettling"
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <fieldset>
          <legend>Choose saved titles</legend>
          {items.map((item) => (
            <label key={item.id}>
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={(e) =>
                  setSelected((old) =>
                    e.target.checked
                      ? [...old, item.id]
                      : old.filter((id) => id !== item.id),
                  )
                }
              />
              {item.title} · {item.type}
            </label>
          ))}
        </fieldset>
        <button type="submit" disabled={!items.length}>
          Save collection
        </button>
      </form>
      <p role="status">{message}</p>
      <p className="muted">
        Manage membership with Edit tags on each title. Collections and tags are
        private to your saved library.
      </p>
    </details>
  );
}
