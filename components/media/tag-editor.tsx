'use client';
import { acceptedAnalysisTags } from '@/lib/ai-tagging';
import { AiTagReview } from './ai-tag-review';
import { detailedTags, detailedFeatures, featureKind, featureLabels } from '@/lib/features';
import { useState } from 'react';
import {taxonomy,tagApplicable,suggestedFacets,contentClass} from '@/lib/taxonomy';
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
  reviewer=false,
  edit,
  known,
  onChange,
}: {
  reviewer?: boolean;
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
      if(!tag)throw new Error('Use 2–32 letters, numbers or spaces.');
      if(!tagApplicable(tag,item))throw new Error('This tag does not fit the title’s content class or media type.');
      if (
        edit.added.includes(tag) ||
        (item.tags.includes(tag) && !edit.hidden.includes(tag))
      )
        throw new Error('This tag is already on the title.');
      if (edit.added.length >= 12)
        throw new Error('Use at most 12 personal tags per title.');
      onChange({
        ...edit,
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
        tagApplicable(t,item) && !edit.added.includes(t) &&
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
      <DialogContent className="add-media-dialog tag-editor-dialog">
        <DialogTitle>Tags for {item.title}</DialogTitle>
        <DialogDescription>
          Tags describe what a title is about. Keep the ones that fit, hide mistakes, or add a detail the catalog missed. Changes save in this browser and are used the next time you search.
        </DialogDescription>
        {reviewer && <AiTagReview item={item} edit={edit} onChange={onChange} />}
        {!!acceptedAnalysisTags(edit.analyses || [],item).length && <section className="accepted-tags"><h3>Reviewed tags</h3><p>Accepted suggestions are active for matching unless you hide them below.</p><div className="tag-options">{acceptedAnalysisTags(edit.analyses || [],item).map(t=><button key={t} aria-pressed={!edit.hidden.includes(t)} onClick={()=>onChange({...edit,hidden:edit.hidden.includes(t)?edit.hidden.filter(x=>x!==t):[...edit.hidden,t]})}>{t.replaceAll('-',' ')}{edit.hidden.includes(t)?' · hidden':' · active ✓'}</button>)}</div></section>}
        <h3>Automatic tags</h3>
        <p className="muted">
          Automatic tags come from catalog genres and description keywords. Hide
          any that do not fit.
        </p>
        <div className="tag-options">
          {Object.entries(featureLabels).filter(([kind])=>item.tags.some(t=>featureKind(t)===kind)).map(([kind,label]) => <section key={kind}>
          {item.tags.some(t=>featureKind(t)===kind) && <h4>{label}</h4>}
          {item.tags.filter(t=>featureKind(t)===kind).map((t) => (
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
          ))}</section>)}
          {!item.tags.length && (
            <p>No automatic tags found. Add your own below.</p>
          )}
        </div>
        <details>
          <summary>Find more tags for this title</summary>
          <p>These are possible labels, not confirmed facts about this title. Choose only ones that describe the story. Suggestions use the genres and media type we know; you can also create your own tag below.</p>
          {Object.entries(featureLabels).map(([kind,label]) => {
            const suggestions=suggestedFacets(item).filter(t=>taxonomy[t].kind===kind && kind!=='class' && !item.tags.includes(t) && !edit.added.includes(t));
            return suggestions.length?<section key={kind}><h4>{label}</h4><div className="tag-options">{suggestions.map(t=><button key={t} onClick={()=>add(t)}>+ {t.replaceAll('-',' ')}</button>)}</div></section>:null;
          })}
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
        <p className="tag-explanation">For example, add “palace intrigue” to two stories with court politics. Reusing that exact tag helps Mosaic recognize their connection. A new tag applies only to this title until you add it to others; it does not automatically find or label other stories.</p>
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
            onChange({ ...edit, added: [], hidden: [] });
            setError('');
          }}
        >
          Reset manual additions and hidden tags
        </button>
      </DialogContent>
    </Dialog>
  );
}

