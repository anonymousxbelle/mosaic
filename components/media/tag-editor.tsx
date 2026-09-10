'use client';
import { detailedTags, featureGroups, detailedFeatures } from '@/lib/features';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { normalizeTag, type TagEdits } from '@/lib/tags';
import type { Media } from '@/lib/recommendations';
export function TagEditor({
  item,
  edit,
  known,
  onChange,
}: {
  item: Media;
  edit: TagEdits[string];
  known: string[];
  onChange: (edit: TagEdits[string]) => void;
}) {
  item = {
    ...item,
    tags: [
      ...new Set([
        ...item.tags,
        ...detailedFeatures(item.description, item.genres || []),
      ]),
    ],
  };
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  function add(raw: string) {
    try {
      const tag = normalizeTag(raw);
      if (
        edit.added.includes(tag) ||
        (item.tags.includes(tag) && !edit.hidden.includes(tag))
      )
        throw new Error('This tag is already on the title.');
      if (edit.added.length >= 12)
        throw new Error('Use at most 12 personal tags per title.');
      onChange({
        added: item.tags.includes(tag) ? edit.added : [...edit.added, tag],
        hidden: edit.hidden.filter((t) => t !== tag),
      });
      setQuery('');
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const available = [...new Set([...known, ...detailedTags])]
    .filter(
      (t) =>
        !edit.added.includes(t) &&
        (!item.tags.includes(t) || edit.hidden.includes(t)) &&
        t.includes(query.trim().toLowerCase().replace(/\s+/g, '-')),
    )
    .slice(0, 12);
  return (
    <Dialog>
      <DialogTrigger
        className="edit-tags"
        aria-label={'Edit tags for ' + item.title}
      >
        Edit tags
      </DialogTrigger>
      <DialogContent className="add-media-dialog">
        <DialogTitle>Tags for {item.title}</DialogTitle>
        <DialogDescription>
          Reuse a tag on similar titles to connect your taste across media.
          Changes save immediately in this browser and update recommendations.
        </DialogDescription>
        <h3>{item.id.includes(':') ? 'Automatic tags' : 'Demo tags'}</h3>
        <p className="muted">
          Automatic tags come from catalog genres and description keywords. Hide
          any that do not fit.
        </p>
        <div className="tag-options">
          {item.tags.map((t) => (
            <button
              key={t}
              aria-pressed={!edit.hidden.includes(t)}
              onClick={() =>
                onChange({
                  ...edit,
                  hidden: edit.hidden.includes(t)
                    ? edit.hidden.filter((x) => x !== t)
                    : [...edit.hidden, t],
                })
              }
            >
              {t}
              {edit.hidden.includes(t) ? ' · hidden' : ' ✓'}
            </button>
          ))}
          {!item.tags.length && (
            <p>No automatic tags found. Add your own below.</p>
          )}
        </div>
        <details>
          <summary>Explore subgenres and themes</summary>
          {Object.entries(featureGroups).map(([parent, children]) => (
            <div key={parent}>
              <h4>{parent}</h4>
              <div className="tag-options">
                {children.map((t) => (
                  <button key={t} onClick={() => add(t)}>
                    + {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </details>
        <h3>Your tags · {edit.added.length}/12</h3>
        <div className="tag-options">
          {edit.added.map((t) => (
            <button
              key={t}
              aria-label={'Remove tag ' + t}
              onClick={() =>
                onChange({ ...edit, added: edit.added.filter((x) => x !== t) })
              }
            >
              {t} ×
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add(query);
          }}
        >
          <label className="field-label" htmlFor={'tag-' + item.id}>
            Create or reuse a tag
          </label>
          <div className="tag-input">
            <input
              id={'tag-' + item.id}
              value={query}
              maxLength={64}
              onChange={(e) => {
                setQuery(e.target.value);
                setError('');
              }}
              placeholder="e.g. found family"
            />
            <button type="submit" disabled={!query.trim()}>
              Add tag
            </button>
          </div>
        </form>
        <p className="muted">
          2–32 characters. Letters, numbers and spaces; spaces become hyphens.
          Add the same tag to two or more titles to create a connection.
        </p>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="tag-options" aria-label="Reusable tags">
          {available.map((t) => (
            <button key={t} onClick={() => add(t)}>
              + {t}
            </button>
          ))}
        </div>
        <button
          className="remove-added"
          onClick={() => {
            onChange({ added: [], hidden: [] });
            setError('');
          }}
        >
          Reset this title’s tags
        </button>
      </DialogContent>
    </Dialog>
  );
}
