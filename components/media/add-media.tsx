'use client';
import { useEffect, useRef, useState } from 'react';
import { Plus, CheckCircle2, LoaderCircle, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from '@/components/ui/combobox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { inContentSection, contentLabel } from '@/lib/content-rating';
import { discoveryCategories, type Category, type Media } from '@/lib/recommendations';
import {
  searchMedia,
  verifyMedia,
  providerFor,
  findDuplicate,
  queryError,
  type CatalogMedia,
} from '@/lib/media-api';
export function AddMedia({
  items,
  adult = false,
  favorite = false,
  onAdd,
}: {
  items: Media[];
  adult?: boolean;
  favorite?: boolean;
  onAdd: (item: CatalogMedia, rating?: number) => void;
}) {
  const [rating,setRating]=useState<number | null>(null);
  const [highlight,setHighlight]=useState(0);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<Category>('Book');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<CatalogMedia[]>([]);
  const [selection, setSelection] = useState<CatalogMedia | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const verification = useRef<AbortController | null>(null);
  const lastSearch = useRef(0);
  useEffect(() => {
    if (!open) {
      generation.current++;
      verification.current?.abort();
      setVerifying(false);
      return;
    }
    if (selection && query === selection.title) return;
    const invalid = queryError(query);
    const current = ++generation.current;
    const controller = new AbortController();
    setMatches([]);
    setError('');
    setLoading(!invalid);
    if (invalid) return () => controller.abort();
    // Debounce and pace catalog requests, with an abortable stale-response guard.
    const wait = Math.max(600, 3000 - (Date.now() - lastSearch.current));
    const timer = setTimeout(async () => {
      lastSearch.current = Date.now();
      try {
        const found = await searchMedia(type, query, controller.signal, adult);
        if (generation.current === current)
          setMatches(
            found.filter((item) =>
              inContentSection(findDuplicate(items, item) || item, adult),
            ),
          );
      } catch (e) {
        if (!controller.signal.aborted && generation.current === current)
          setError(
            e instanceof Error ? e.message : 'Search failed. Please retry.',
          );
      } finally {
        if (generation.current === current && !controller.signal.aborted)
          setLoading(false);
      }
    }, wait);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, type, open, retry, selection, adult]);
  function reset() {
    setRating(null);
    generation.current++;
    verification.current?.abort();
    setMatches([]);
    setSelection(null);
    setError('');
    setVerifying(false);
  }
  async function add() {
    if (!selection || verifying) return;
    setVerifying(true);
    setError('');
    const controller = new AbortController();
    verification.current = controller;
    try {
      const verified = await verifyMedia(selection, controller.signal);
      if (controller.signal.aborted) return;
      if (findDuplicate(items, verified))
        throw new Error(
          'This title is already in your library. Find it in My Library to rate it.',
        );
      if (!inContentSection(verified, adult))
        throw new Error(
          'This title belongs in the other content section. Switch sections and search again.',
        );
      onAdd({...verified,libraryState:rating?'experienced':'later'},rating || undefined);
      setOpen(false);
      setQuery('');
      reset();
    } catch (e) {
      if (!controller.signal.aborted)
        setError(
          e instanceof Error
            ? e.message
            : 'Verification failed. Please try again.',
        );
    } finally {
      if (!controller.signal.aborted) setVerifying(false);
    }
  }
  const duplicate = selection && findDuplicate(items, selection);
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if(value)setRating(null);
        if (!value) reset();
      }}
    >
      <DialogTrigger className="add-media-button">
        <Plus size={17} />
        {favorite ? 'Add a favorite' : 'Add media'}
      </DialogTrigger>
      <DialogContent className="add-media-dialog">
        <DialogTitle className="add-title">Add something you love</DialogTitle>
        <p>
          {adult
            ? '18+ catalog matches only.'
            : 'Flagged 18+ titles are hidden. Unrated titles may still contain mature content.'}
        </p>
        <DialogDescription>
          Search a live catalog and select the correct title. Exact title
          matches rank first; available rating counts break ties. We check the
          record again before adding it.
        </DialogDescription>
        <label className="field-label" id="media-type-label">
          Media type
        </label>
        <Select
          value={type}
          onValueChange={(value) => {
            if (value) {
              reset();
              setQuery('');
              setType(value as Category);
            }
          }}
        >
          <SelectTrigger
            aria-labelledby="media-type-label"
            className="add-type-select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {discoveryCategories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="field-label" htmlFor="live-media-search">
          Title or creator
        </label>
        <div className="catalog-search-box">
          <input id="live-media-search" role="combobox" aria-autocomplete="list" aria-expanded={!selection && matches.length>0} aria-controls="catalog-options" aria-activedescendant={!selection && matches.length?`catalog-option-${Math.min(highlight,matches.length-1)}`:undefined} aria-describedby="search-help" placeholder="Start typing a title…" value={query} disabled={verifying}
            onChange={e=>{reset();setQuery(e.target.value);setHighlight(0);}}
            onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();const item=matches[Math.min(highlight,matches.length-1)];if(!selection&&item){setSelection(item);setQuery(item.title);setLoading(false);generation.current++;}}else if(e.key==='ArrowDown'){e.preventDefault();setHighlight(n=>Math.min(n+1,matches.length-1));}else if(e.key==='ArrowUp'){e.preventDefault();setHighlight(n=>Math.max(n-1,0));}}}/>
          {!selection && matches.length>0 && <div id="catalog-options" role="listbox" className="catalog-options">{matches.map((item,index)=><button type="button" role="option" id={`catalog-option-${index}`} aria-selected={index===highlight} key={item.id} onClick={()=>{setSelection(item);setQuery(item.title);setLoading(false);generation.current++;}}><strong>{item.title}</strong><span>{item.creator}{item.year?' · '+item.year:''}</span><small>{item.provider}</small></button>)}</div>}
        </div>
        <p id="search-help" className="search-help" role="status">
          {loading
            ? 'Searching ' + providerFor(type) + '…'
            : queryError(query) ||
              (!selection && !matches.length && !error
                ? 'No matching titles found. Check the spelling or try a different title.'
                : !selection
                  ? 'Choose one of the suggestions to continue.'
                  : 'Selected catalog record. Ready to verify.')}
        </p>
        {selection && (
          <div className="selected-media">
            <div className="selected-label">
              <CheckCircle2 size={16} />
              Catalog match · {selection.provider}
            </div>
            <p>{contentLabel(selection)}</p>
            <h3>{selection.title}</h3>
            <p>
              {selection.creator}
              {selection.format ? ' · ' + selection.format : ''}
              {selection.year ? ' · ' + selection.year : ''}
            </p>
            <p className="selected-description">
              {selection.description.length > 500
                ? selection.description.slice(0, 500).replace(/\s+\S*$/, '') +
                  '…'
                : selection.description}
            </p>
            <div className="selected-tags">
              {selection.tags.length ? (
                selection.tags.map((tag) => <span key={tag}>{tag}</span>)
              ) : (
                <p>
                  No automatic tags found. Save this title, then use Edit tags
                  to add your own.
                </p>
              )}
            </div>
            <a href={selection.sourceUrl} target="_blank" rel="noreferrer">
              {selection.type === 'Book'
                ? 'Full publisher description'
                : 'Check source'}{' '}
              <ExternalLink size={13} />
            </a>
          </div>
        )}
        {duplicate && (
          <p className="form-message">
            Already in your library. Search for it in My Library to
            rate it.
          </p>
        )}
        {error && (
          <div className="form-error" role="alert">
            {error}{' '}
            {!selection && (
              <button onClick={() => setRetry((n) => n + 1)}>
                Retry search
              </button>
            )}
          </div>
        )}
        {selection && !duplicate && <fieldset className="add-rating"><legend>Have you read or watched this?</legend><p>Rate it now to shape your recommendations, or save it unrated for later.</p><div className="rating-choices">{[1,2,3,4,5].map(n=><button type="button" key={n} aria-pressed={rating===n} onClick={()=>setRating(n)}>{n} ★</button>)}<button type="button" aria-pressed={rating===0} onClick={()=>setRating(0)}>Not yet · save for later</button></div></fieldset>}
        <button
          type="button"
          className="confirm-add"
          disabled={!selection || !!duplicate || verifying || rating===null}
          onClick={add}
        >
          {verifying ? (
            <>
              <LoaderCircle className="spin" size={17} />
              Verifying…
            </>
          ) : (
            <>
              <Plus size={17} />
              {rating ? `Add to library · ${rating} stars` : 'Save to library for later'}
            </>
          )}
        </button>
        <p className="storage-note">
          Your library is saved in this browser, not shared with other visitors.
          Search text is sent to {providerFor(type)}.{' '}
          {type === 'Music'
            ? 'Music search finds songs and albums.'
            : type === 'Game'
              ? 'Only records classified as video games are offered.'
              : ''}
        </p>
      </DialogContent>
    </Dialog>
  );
}

