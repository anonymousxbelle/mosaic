'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  BookOpen,
  Disc3,
  Gamepad2,
  Film,
  Tv,
  ArrowUpRight,
  Sparkles,
  Layers3,
  Star,
  Search,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { detailedFeatures, specificity, detailedTags, primaryGenre, seedTopic } from '@/lib/features';
import { GenreGuide } from '@/components/media/genre-guide';
import { DiscoveryFeedback } from '@/components/media/discovery-feedback';
import { inContentSection, contentLabel } from '@/lib/content-rating';
import { genreChoices, genrePreferences, genreAllowed } from '@/lib/genres';
import { catalog as sampleCatalog } from '@/lib/catalog';
import { TagEditor } from '@/components/media/tag-editor';
import { effectiveTags, type TagEdits } from '@/lib/tags';
import { TasteCollections } from '@/components/media/taste-collections';
import {
  connectionEvidence,
  recommendationEligible,
} from '@/lib/discovery-feedback';
import { Account } from '@/components/media/account';
import { AddMedia } from '@/components/media/add-media';
import {
  findDuplicate,
  verifyMedia,
  discoverMedia,
  catalogApi,
  igdbEnabled,
  type CatalogMedia,
} from '@/lib/media-api';
import { restoreLibrary, STORAGE_KEY } from '@/lib/library-storage';
import {
  discoveryCategories,
  profile,
  vector,
  recommend,
  diversify,
  type Category,
  type Ratings,
  type Media,
} from '@/lib/recommendations';
const icons = {
  Book: BookOpen,
  Music: Disc3,
  Game: Gamepad2,
  Movie: Film,
  TV: Tv,
};
function MediaMark({ item }: { item: Media }) {
  const Icon = icons[item.type];
  const [failed, setFailed] = useState(false);
  return (
    <div className={'media-mark ' + item.type.toLowerCase()}>
      <>
        {item.artworkUrl && !failed ? (
          <img
            src={item.artworkUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
        ) : (
          <Icon size={24} />
        )}
      </>
    </div>
  );
}
export default function Home() {
  const [view, setView] = useState('discover');
  const [shelf, setShelf] = useState('all');
  const [collection, setCollection] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [undo, setUndo] = useState<{
    id: string;
    previous?: CatalogMedia;
  } | null>(null);
  const [adultSection, setAdultSection] = useState(false);
  const [added, setAdded] = useState<CatalogMedia[]>([]);
  const [genre, setGenre] = useState('fantasy');
  const [avoided, setAvoided] = useState<string[]>([]);
  const [showDemo, setShowDemo] = useState(false);
  const [candidates, setCandidates] = useState<CatalogMedia[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [discoveryNotice, setDiscoveryNotice] = useState('');
  const discoveryRequest = useRef<AbortController | null>(null);
  useEffect(() => () => discoveryRequest.current?.abort(), []);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [notice, setNotice] = useState('');
  const [tagEdits, setTagEdits] = useState<TagEdits>({});
  const originals = useMemo(
    () => [
      ...added,
      ...(showDemo
        ? sampleCatalog.filter((i) => !findDuplicate(added, i))
        : []),
    ],
    [added, showDemo],
  );
  const catalog = useMemo(
    () =>
      originals.map((item) => ({
        ...item,
        tags: effectiveTags(item, tagEdits[item.id]),
      })),
    [originals, tagEdits],
  );
  const sectionCatalog = useMemo(
    () => catalog.filter((i) => inContentSection(i, adultSection)),
    [catalog, adultSection],
  );
  const discoveryCatalog = useMemo(
    () => sectionCatalog.filter((i) => i.type !== 'Music'),
    [sectionCatalog],
  );
  const knownTags = useMemo(
    () => [...new Set(sectionCatalog.flatMap((i) => i.tags))].sort(),
    [sectionCatalog],
  );
  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;
  const [ratings, setRatings] = useState<Ratings>({});
  const [mode, setMode] = useState('for-you');
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [focusTags, setFocusTags] = useState<string[]>([]);
  const [seed, setSeed] = useState('hunger');
  const [search, setSearch] = useState('');
  const taste = useMemo(
    () =>
      profile(
        discoveryCatalog.filter((i) => i.libraryState !== 'dismissed'),
        ratings,
      ),
    [ratings, discoveryCatalog],
  );
  const selected =
    [
      ...discoveryCatalog,
      ...candidates.filter((i) => inContentSection(i, adultSection)),
    ].find((i) => i.id === seed) || discoveryCatalog[0];
  useEffect(() => setFocusTags([]), [seed]);
  useEffect(() => {
    try {
      const saved = restoreLibrary(
        localStorage.getItem(STORAGE_KEY),
        sampleCatalog,
      );
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      setAvoided(
        Array.isArray(raw.avoided)
          ? raw.avoided.filter(
              (g: unknown) => typeof g === 'string' && genreChoices.includes(g),
            )
          : [],
      );
      setAdded(saved.added);
      setRatings(saved.ratings);
      setTagEdits(saved.tagEdits);
    } catch {
      setStorageError(
        'Saved library could not be read. You can still use the app in this session.',
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, added, ratings, tagEdits, avoided }),
      );
    } catch {
      setStorageError(
        'Browser storage is unavailable or full. Changes will last for this session only.',
      );
    }
  }, [added, ratings, tagEdits, avoided, ready]);
  function addItem(item: CatalogMedia) {
    setUndo(null);
    if (added.length >= 200)
      throw new Error(
        'Your library has reached 200 added titles. Remove one before adding another.',
      );
    if (findDuplicate(catalog, item))
      throw new Error('This title is already in your library.');
    setAdded((old) => [item, ...old]);
    setSearch('');
    setNotice(
      item.title + ' added. Rate it below to update your taste profile.',
    );
  }
  function addFavorite(item: CatalogMedia) {
    addItem({ ...item, libraryState: 'experienced' });
    setRatings((old) => ({ ...old, [item.id]: 5 }));
    setNotice(
      item.title +
        ' added as a favorite. You can change its rating in My Library.',
    );
  }
  async function feedback(
    item: Media,
    state: 'later' | 'experienced' | 'dismissed',
  ) {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      const previous = added.find((i) => i.id === item.id);
      const candidate = previous || candidates.find((i) => i.id === item.id);
      if (!candidate)
        throw new Error(
          'This is a demo title. Add the real catalog record to save feedback.',
        );
      if (!previous && added.length >= 200)
        throw new Error('Your library is full. Remove a title first.');
      const verified = previous || (await verifyMedia(candidate));
      if (!inContentSection(verified, adultSection))
        throw new Error(
          'Its content rating has changed. Search in the appropriate collection.',
        );
      setAdded((old) => [
        { ...verified, libraryState: state },
        ...old.filter((i) => i.id !== item.id),
      ]);
      setUndo({ id: item.id, previous });
      setNotice(
        state === 'later'
          ? 'Saved for later in My Library.'
          : state === 'experienced'
            ? 'Marked as already experienced. Rate it in My Library to refine your taste.'
            : 'Hidden from recommendations. No genre has been blocked.',
      );
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setActionBusy(false);
    }
  }
  function removeItem(id: string) {
    setUndo(null);
    setTagEdits((old) => {
      const next = { ...old };
      delete next[id];
      return next;
    });
    setAdded((old) => old.filter((i) => i.id !== id));
    setRatings((old) => {
      const next = { ...old };
      delete next[id];
      return next;
    });
    if (seed === id) setSeed('hunger');
  }
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context) return;
    const lifecycle = new AbortController();
    const tool = {
      name: 'set_media_ratings',
      description:
        'Set ratings for library titles and show For You recommendations. Ratings are saved in this browser when storage is available.',
      inputSchema: {
        type: 'object',
        properties: {
          ratings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                rating: { type: 'integer', minimum: 1, maximum: 5 },
              },
              required: ['id', 'rating'],
              additionalProperties: false,
            },
          },
        },
        required: ['ratings'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const values = (input as { ratings?: unknown })?.ratings;
        if (!Array.isArray(values) || !values.length)
          throw new Error('Provide a nonempty ratings array.');
        const update: Ratings = {};
        for (const entry of values) {
          if (
            !entry ||
            !catalogRef.current.some((i) => i.id === entry.id) ||
            !Number.isInteger(entry.rating) ||
            entry.rating < 1 ||
            entry.rating > 5
          )
            throw new Error(
              'Every rating needs a valid catalog id and integer from 1 to 5.',
            );
          update[entry.id] = entry.rating;
        }
        flushSync(() => {
          setRatings((old) => ({ ...old, ...update }));
          setMode('for-you');
        });
        return { updated: update };
      },
    };
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {
      /* Optional browser feature. */
    }
    return () => lifecycle.abort();
  }, []);
  async function findConnections() {
    if (mode === 'collection') {
      setDiscoveryNotice(
        'Your personal collection matches saved titles below. Its private name is not sent to external catalogs.',
      );
      return;
    }
    discoveryRequest.current?.abort();
    const controller = new AbortController();
    discoveryRequest.current = controller;
    setDiscovering(true);
    setDiscoveryNotice('');
    const query =
      mode === 'genres'
        ? vector([genre])
        : mode === 'based-on'
          ? vector(
              focusTags.length
                ? focusTags.filter((t) => selected?.tags.includes(t))
                : selected?.tags || [],
            )
          : taste;
    const tags = Object.keys(query)
      .filter(
        (t) =>
          (query[t] > 0 &&
            originals.some((i) =>
              [
                ...i.tags,
                ...detailedFeatures(i.description, i.genres || []),
              ].includes(t),
            )) ||
          (mode === 'genres' && t === genre),
      )
      .sort((a, b) => query[b] * specificity(b) - query[a] * specificity(a))
      .slice(0, 9);
    try {
      const found = await discoverMedia(
        category === 'All' ? [...discoveryCategories] : [category],
        mode === 'based-on' && primaryGenre(selected)
          ? [...new Set([...(seedTopic(selected) ? [seedTopic(selected)!] : []), primaryGenre(selected)!, ...tags])]
          : tags,
        controller.signal,
        adultSection,
        {seed:mode === 'based-on'?selected:undefined,
          accept:(item)=>inContentSection(item,adultSection) && genreAllowed(item,[],avoided) &&
            recommendationEligible(item,ratings) && !findDuplicate(catalog,item)},
      );
      if (controller.signal.aborted) return;
      setCandidates(found.items.filter((i) => !findDuplicate(catalog, i)));
      setDiscoveryNotice(
        `Checked ${found.stats.examined} unique titles across ${found.stats.pages} catalog pages; filtered out ${found.stats.rejected}. ${found.items.length} eligible candidates (${found.stats.cached} from recent searches).${found.failures.length ? ' Some sources were unavailable: ' + found.failures.join(', ') + '.' : ''} Results below are ranked within this pool, not the entire catalog.`,
      );
    } catch {
      if (!controller.signal.aborted)
        setDiscoveryNotice('Discovery could not finish. Please retry.');
    } finally {
      if (!controller.signal.aborted) setDiscovering(false);
    }
  }
  const preferences = genrePreferences(discoveryCatalog, ratings);
  const results = recommend(
    [...catalog, ...candidates.filter((i) => !findDuplicate(catalog, i))],
    mode === 'collection'
      ? vector([collection])
      : mode === 'genres'
        ? vector([genre])
        : mode === 'based-on'
          ? vector(
              focusTags.length
                ? focusTags.filter((t) => selected?.tags.includes(t))
                : selected?.tags || [],
            )
          : taste,
    category,
    mode === 'collection'
      ? []
      : mode === 'based-on'
        ? [selected?.id || seed]
        : Object.keys(ratings),
    mode === 'based-on' ? primaryGenre(selected) : undefined,
    mode === 'based-on' ? selected : undefined,
  );
  const filteredResults = diversify(
    results
      .filter((i) => i.type !== 'Music')
      .filter((i) =>
        mode === 'collection'
          ? i.libraryState !== 'dismissed'
          : recommendationEligible(i, ratings),
      )
      .filter((i) => inContentSection(i, adultSection))
      .filter((i) => genreAllowed(i, preferences.blocked, avoided))
      .map((i) => ({
        ...i,
        score:
          i.score *
          (1 -
            Math.max(
              0,
              ...(i.genres || []).map(
                (g) => preferences.penalties[i.type + ':' + g] || 0,
              ),
            )),
      }))
      .sort((a, b) => b.score - a.score),
  );
  const visible = sectionCatalog
    .filter(
      (i) =>
        shelf === 'all' ||
        i.libraryState === shelf ||
        (shelf === 'experienced' && !!ratings[i.id]),
    )
    .filter((i) =>
      (i.title + ' ' + i.creator + ' ' + i.type + ' ' + i.tags.join(' '))
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  return (
    <div className="app-shell">
      <header className="topbar">
        <a href="./" className="brand">
          <Layers3 size={30} />
          mosaic<span className="brand-dot">●</span>
        </a>
        <span className="project-label">A CROSS-MEDIA EXPLORATION</span>
        <span className="prototype">Seminar prototype · 02</span>
      </header>
      <main>
        <div className="page-intro">
          <div>
            <p className="eyebrow">CROSS-MEDIA DISCOVERY</p>
            <h1>Find your next connection.</h1>
          </div>
          <p>Start with your favorites. Follow what connects them.</p>
        </div>
        <nav className="primary-nav" aria-label="Main navigation">
          {[
            ['discover', 'Discover'],
            ['library', 'My Library'],
            ['preferences', 'Preferences'],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-current={view === id ? 'page' : undefined}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        {notice && (
          <div className="library-notice" role="status">
            {notice}{' '}
            {undo && (
              <button
                disabled={actionBusy}
                onClick={() => {
                  setAdded((old) =>
                    undo.previous
                      ? old.map((i) => (i.id === undo.id ? undo.previous! : i))
                      : old.filter((i) => i.id !== undo.id),
                  );
                  setUndo(null);
                  setNotice('Feedback undone.');
                }}
              >
                Undo last feedback
              </button>
            )}
          </div>
        )}
        {storageError && (
          <p className="form-error" role="alert">
            {storageError}
          </p>
        )}
        {view === 'discover' &&
          discoveryCatalog.filter(
            (i) => (ratings[i.id] || 0) >= 3 && i.libraryState !== 'dismissed',
          ).length < 3 && (
            <section className="onboarding">
              <p className="eyebrow">MAKE THIS YOURS · NO ACCOUNT NEEDED</p>
              <h2>Start with 3–5 favorites.</h2>
              <p>
                Pick books, movies, shows or games you already love. A favorite
                starts at 5 stars; change it anytime in My Library.
              </p>
              <ol>
                <li>
                  <strong>
                    {
                      discoveryCatalog.filter(
                        (i) =>
                          (ratings[i.id] || 0) >= 3 &&
                          i.libraryState !== 'dismissed',
                      ).length
                    }{' '}
                    of 3 favorites added
                  </strong>
                </li>
                <li>Optionally choose genres to avoid in Preferences.</li>
                <li>
                  Show discoveries when you’re ready—even one favorite can get
                  you started.
                </li>
              </ol>
              <AddMedia
                key={'favorite-' + adultSection}
                favorite
                items={catalog}
                adult={adultSection}
                onAdd={addFavorite}
              />
              <button
                className="edit-tags"
                onClick={() => setView('preferences')}
              >
                Choose preferences (optional)
              </button>
            </section>
          )}
        <div
          className="content-section"
          role="group"
          aria-label="Content section"
        >
          <button
            className="demo-button"
            aria-pressed={!adultSection}
            disabled={actionBusy}
            onClick={() => {
              discoveryRequest.current?.abort();
              setDiscovering(false);
              setCandidates([]);
              setDiscoveryNotice('');
              setNotice('');
              setAdultSection(false);
            }}
          >
            Main collection
          </button>
          <button
            className="demo-button"
            aria-pressed={adultSection}
            disabled={actionBusy}
            onClick={() => {
              discoveryRequest.current?.abort();
              setDiscovering(false);
              setCandidates([]);
              setDiscoveryNotice('');
              setNotice('');
              setAdultSection(true);
            }}
          >
            18+ · Enter mature collection
          </button>
          <p className="muted">
            {adultSection
              ? '18+ movies, TV and books. Includes explicit flags and mature ratings such as R, NC-17 and TV-MA. This is a browsing preference, not age verification.'
              : 'Flagged mature movies, TV and books are kept in 18+. Missing ratings are labeled unknown; this collection is not a child-safe filter.'}
          </p>
        </div>
        <div className="workspace focused-workspace">
          <aside className="library" hidden={view !== 'library'}>
            <div className="section-heading">
              <h2>My Library</h2>
              <span>{catalog.filter((i) => ratings[i.id]).length} rated</span>
            </div>
            <p className="muted">
              Add media from live catalogs, then rate your favorites. Your
              library and ratings are saved in this browser.
            </p>
            <AddMedia
              key={String(adultSection)}
              items={catalog}
              adult={adultSection}
              onAdd={addItem}
            />
            <p className="muted">
              Music discovery is paused. Saved songs, albums, ratings and tags
              are preserved here.
            </p>
            <div className="shelf-tabs" role="group" aria-label="Library shelf">
              {[
                ['all', 'All titles'],
                ['later', 'Saved for later'],
                ['experienced', 'Already experienced'],
                ['dismissed', 'Not interested'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  aria-pressed={shelf === id}
                  onClick={() => setShelf(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <TasteCollections
              items={sectionCatalog.filter((i) =>
                added.some((x) => x.id === i.id),
              )}
              edits={tagEdits}
              onChange={setTagEdits}
              onExplore={(tag) => {
                setCollection(tag);
                setMode('collection');
                setView('discover');
              }}
            />
            <label className="search">
              <Search size={18} />
              <input
                aria-label="Search your library"
                placeholder="Filter by title, creator or tag"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="library-list">
              {visible.map((item) => (
                <article className="library-item" key={item.id}>
                  <MediaMark item={item} />
                  <div>
                    <span className="type-label">{item.type}</span>
                    <p className="muted">{contentLabel(item)}</p>
                    <h3>{item.title}</h3>
                    <p className="library-creator">{item.creator}</p>
                    {item.libraryState && (
                      <p className="muted">
                        {item.libraryState === 'later'
                          ? 'Saved for later'
                          : item.libraryState === 'experienced'
                            ? 'Already experienced'
                            : 'Not interested'}
                      </p>
                    )}
                    {item.libraryState && (
                      <button
                        className="edit-tags"
                        onClick={() => {
                          setAdded((old) =>
                            old.map((i) =>
                              i.id === item.id
                                ? { ...i, libraryState: undefined }
                                : i,
                            ),
                          );
                          setNotice(
                            'Shelf status cleared. Existing ratings still apply.',
                          );
                        }}
                      >
                        Clear shelf status
                      </button>
                    )}
                    <button
                      className="edit-tags"
                      onClick={() => {
                        if (item.type === 'Music') return;
                        setSeed(item.id);
                        setMode('based-on');
                        setView('discover');
                      }}
                    >
                      {item.type === 'Music'
                        ? 'Music discovery paused'
                        : 'More like this'}
                    </button>
                    {added.some((x) => x.id === item.id) && (
                      <button
                        className="remove-added"
                        aria-label={'Remove ' + item.title + ' from library'}
                        onClick={() => removeItem(item.id)}
                      >
                        Remove title
                      </button>
                    )}
                    {added.some((x) => x.id === item.id) &&
                      ['Book', 'Movie', 'TV'].includes(item.type) &&
                      !item.adult && (
                        <button
                          className="edit-tags"
                          onClick={() =>
                            setAdded((old) =>
                              old.map((x) =>
                                x.id === item.id
                                  ? { ...x, adultMarked: !x.adultMarked }
                                  : x,
                              ),
                            )
                          }
                        >
                          {item.adultMarked
                            ? 'Undo my 18+ mark'
                            : 'Mark as 18+'}
                        </button>
                      )}
                    <DiscoveryFeedback
                      item={item}
                      library={catalog}
                      onDismiss={() => feedback(item, 'dismissed')}
                    />
                    {added.some((x) => x.id === item.id) && (
                      <button
                        disabled={actionBusy}
                        onClick={async () => {
                          const original = added.find((x) => x.id === item.id);
                          if (!original) return;
                          setActionBusy(true);
                          try {
                            const fresh = await verifyMedia(original);
                            setAdded((old) =>
                              old.map((x) =>
                                x.id === fresh.id
                                  ? {
                                      ...fresh,
                                      libraryState: x.libraryState,
                                      adultMarked: x.adultMarked,
                                    }
                                  : x,
                              ),
                            );
                            setNotice(
                              'Catalog details refreshed. Your rating and personal tags are preserved.',
                            );
                          } catch (e) {
                            setNotice(
                              e instanceof Error
                                ? e.message
                                : 'Could not refresh details.',
                            );
                          } finally {
                            setActionBusy(false);
                          }
                        }}
                      >
                        Refresh catalog details
                      </button>
                    )}
                    <TagEditor
                      item={originals.find((x) => x.id === item.id)!}
                      edit={tagEdits[item.id] || { added: [], hidden: [] }}
                      known={knownTags}
                      onChange={(edit) =>
                        setTagEdits((old) => ({ ...old, [item.id]: edit }))
                      }
                    />
                    <div
                      className="rating"
                      role="group"
                      aria-label={'Rate ' + item.title}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          aria-label={n + ' stars for ' + item.title}
                          aria-pressed={ratings[item.id] === n}
                          onClick={() =>
                            setRatings((old) => ({ ...old, [item.id]: n }))
                          }
                        >
                          <Star
                            size={17}
                            fill={
                              (ratings[item.id] || 0) >= n
                                ? 'currentColor'
                                : 'none'
                            }
                          />
                        </button>
                      ))}
                      {ratings[item.id] && (
                        <button
                          className="remove"
                          aria-label={'Remove rating for ' + item.title}
                          onClick={() =>
                            setRatings((old) => {
                              const next = { ...old };
                              delete next[item.id];
                              return next;
                            })
                          }
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
              {!visible.length && (
                <p className="muted">
                  No titles on this shelf yet. Add media or save a discovery, or
                  try All titles.
                </p>
              )}
            </div>
            <button
              className="demo-button"
              onClick={() => {
                setShowDemo((v) => !v);
                setCandidates([]);
              }}
            >
              {showDemo ? 'Hide demo titles' : 'Explore optional demo titles'}{' '}
              <ArrowUpRight size={16} />
            </button>
          </aside>
          <section className="discovery" hidden={view !== 'discover'}>
            <Tabs value={mode} onValueChange={(v) => setMode(String(v))}>
              <div className="discovery-toolbar">
                <TabsList className="mode-tabs">
                  {collection && (
                    <TabsTrigger value="collection">My collection</TabsTrigger>
                  )}
                  <TabsTrigger value="for-you">
                    <Sparkles size={16} />
                    For You
                  </TabsTrigger>
                  <TabsTrigger value="genres">Genres</TabsTrigger>
                  <TabsTrigger value="based-on">
                    <Layers3 size={16} />
                    Based On
                  </TabsTrigger>
                </TabsList>
                <Select
                  value={category}
                  onValueChange={(v) => {
                    if (v) setCategory(v as Category | 'All');
                  }}
                >
                  <SelectTrigger
                    aria-label="Recommendation category"
                    className="category-select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['All', ...discoveryCategories].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c === 'All' ? 'All media' : c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <TabsContent value="collection">
                <div className="context">
                  <h2>{collection.replace(/-/g, ' ')}</h2>
                  <p>
                    Connections sharing your personal tag. Add it to more titles
                    in My Library to build this collection.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="for-you">
                <div className="context">
                  <p className="eyebrow">THE BIG PICTURE</p>
                  <h2>A little of everything you love.</h2>
                  <p>
                    Connections drawn from the titles you rate 3 stars or
                    higher.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="genres">
                <div className="context">
                  <h2>One genre. Different media.</h2>
                  <p>
                    Explore a genre across books, movies, TV and games where the
                    catalog supplies matching metadata.
                  </p>
                  <Select
                    value={genre}
                    onValueChange={(v) => {
                      if (v) setGenre(v);
                    }}
                  >
                    <SelectTrigger aria-label="Discovery genre">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...new Set([...genreChoices, ...detailedTags])].map(
                        (g) => (
                          <SelectItem key={g} value={g}>
                            {g.replace(/-/g, ' ')}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              <TabsContent value="based-on">
                <div className="context">
                  <p className="eyebrow">FOLLOW A SINGLE THREAD</p>
                  <h2>More of what you enjoyed.</h2>
                  <Select
                    value={seed}
                    onValueChange={(v) => {
                      if (v) setSeed(v);
                    }}
                  >
                    <SelectTrigger
                      aria-label="Starting media item"
                      className="seed-select"
                    >
                      <SelectValue>
                        {selected
                          ? selected.title + ' · ' + selected.type
                          : 'Add a title to begin'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {discoveryCatalog.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.title} · {i.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selected && (
                  <fieldset>
                    <legend>What did you enjoy? (optional)</legend>
                    <p>Choose up to five aspects to focus this discovery.</p>
                    {primaryGenre(selected) && <p>Staying within {primaryGenre(selected)!.replaceAll('-', ' ')}. Shared themes rank the matches within this genre.</p>}
                    {seedTopic(selected) && <p>Keeping {seedTopic(selected)} as the topic.</p>}
                    {category === 'All' && <p>Showing {selected.tags.includes('anime') ? 'anime in the same media type' : 'the same media type'} first. Choose another media category to explore it directly.</p>}
                    <div className="tag-options">
                      {selected.tags.map((t) => (
                        <button
                          key={t}
                          aria-pressed={focusTags.includes(t)}
                          onClick={() =>
                            setFocusTags((v) =>
                              v.includes(t)
                                ? v.filter((x) => x !== t)
                                : v.length < 5
                                  ? [...v, t]
                                  : v,
                            )
                          }
                        >
                          {t.replaceAll('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}
              </TabsContent>
            </Tabs>
            <button
              className="add-media-button"
              disabled={
                discovering ||
                !(mode === 'genres' || mode === 'collection'
                  ? true
                  : mode === 'based-on'
                    ? selected?.tags.length || 0
                    : Object.values(taste).some((v) => v > 0))
              }
              onClick={findConnections}
            >
              {discovering
                ? 'Searching catalogs…'
                : mode === 'collection'
                  ? 'Explore saved collection'
                  : 'Show discoveries'}
            </button>
            {discoveryNotice && (
              <p role="status" className="library-notice">
                {discoveryNotice}
              </p>
            )}
            <div className="results-heading">
              <h2>
                {mode === 'based-on'
                  ? adultSection
                    ? '18+ connections'
                    : 'Connected discoveries'
                  : adultSection
                    ? '18+ discoveries'
                    : 'Your discoveries'}
              </h2>
              <span aria-live="polite">
                {filteredResults.length} connections
              </span>
            </div>
            {!filteredResults.length ? (
              <div className="empty-state">
                <Sparkles size={32} />
                <h3>
                  {discovering
                    ? 'Looking for connections…'
                    : 'Let’s find another way in.'}
                </h3>
                <p>
                  Add a favorite, try a broader genre, or adjust your
                  preferences. Some catalogs may have limited matching metadata.
                </p>
                <button
                  className="edit-tags"
                  onClick={() => {
                    setCategory('All');
                    setMode('genres');
                  }}
                >
                  Explore a genre across all media
                </button>
                <button
                  className="edit-tags"
                  onClick={() => setView('library')}
                >
                  Add or rate titles in My Library
                </button>
              </div>
            ) : (
              <div className="results">
                {filteredResults.map((item, index) => (
                  <article className="result-card" key={item.id}>
                    <div className="card-top">
                      <span className="rank">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={'category-badge ' + item.type.toLowerCase()}
                      >
                        {item.type}
                      </span>
                      <span className="match">
                        {item.reasons.length} shared{' '}
                        {item.reasons.length === 1 ? 'tag' : 'tags'}
                      </span>
                    </div>
                    <p className="muted">{contentLabel(item)}</p>
                    <MediaMark item={item} />
                    <h3>{item.title}</h3>

                    <p className="creator">{item.creator}</p>
                    {[...added, ...candidates].find(
                      (x) => x.id === item.id,
                    ) && (
                      <a
                        className="source-link"
                        href={
                          [...added, ...candidates].find(
                            (x) => x.id === item.id,
                          )!.sourceUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        Source:{' '}
                        {
                          [...added, ...candidates].find(
                            (x) => x.id === item.id,
                          )!.provider
                        }
                      </a>
                    )}
                    <DiscoveryFeedback
                      item={item}
                      seed={selected}
                      library={catalog}
                      onDismiss={() => feedback(item, 'dismissed')}
                    />
                    <div className="result-actions">
                      {[...added, ...candidates].some(
                        (x) => x.id === item.id,
                      ) && (
                        <>
                          <button
                            disabled={actionBusy}
                            onClick={() => feedback(item, 'later')}
                          >
                            Save for later
                          </button>
                          <button
                            disabled={actionBusy}
                            onClick={() => feedback(item, 'experienced')}
                          >
                            Already experienced
                          </button>
                          <button
                            disabled={actionBusy}
                            onClick={() => feedback(item, 'dismissed')}
                          >
                            Not interested
                          </button>
                        </>
                      )}
                      <button
                        disabled={actionBusy}
                        onClick={() => {
                          setSeed(item.id);
                          setMode('based-on');
                        }}
                      >
                        {item.type === 'Music'
                          ? 'Music discovery paused'
                          : 'More like this'}
                      </button>
                    </div>
                    {[...added, ...candidates].find((x) => x.id === item.id)
                      ?.imdbUrl && (
                      <a
                        className="source-link"
                        href={
                          [...added, ...candidates].find(
                            (x) => x.id === item.id,
                          )!.imdbUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        View on IMDb
                      </a>
                    )}
                    <p className="description">
                      {item.description.length > 420
                        ? item.description
                            .slice(0, 420)
                            .replace(/\s+\S*$/, '') + '…'
                        : item.description}
                    </p>
                    {item.description.length > 420 && (
                      <details className="full-description">
                        <summary>Read full description</summary>
                        <p>{item.description}</p>
                      </details>
                    )}
                    <div className="connection">
                      <span>THE CONNECTION</span>
                      <p>Shared tags: {item.reasons.join(' · ')}</p>
                      {connectionEvidence(
                        item,
                        mode === 'based-on'
                          ? selected
                            ? [selected]
                            : []
                          : mode === 'collection'
                            ? discoveryCatalog.filter(
                                (i) =>
                                  i.tags.includes(collection) &&
                                  i.libraryState !== 'dismissed',
                              )
                            : discoveryCatalog.filter(
                                (i) =>
                                  (ratings[i.id] || 0) >= 3 &&
                                  i.libraryState !== 'dismissed',
                              ),
                      ).map((e) => (
                        <p key={e.title}>
                          Connected to “{e.title}” through{' '}
                          {e.tags.slice(0, 3).join(', ')}.
                        </p>
                      ))}
                      <small>
                        Based on catalog keyword tags and your edits, not a
                        prediction of how much you’ll like it.
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <p className="data-note">
              {added.length} saved catalog titles.{' '}
              {showDemo ? 'Demo titles are enabled.' : 'Demo titles are off.'}{' '}
              Live discovery fetches a bounded set of candidates, then ranks
              shared tags. Catalog keywords supply automatic tags. Edit tags to
              correct automatic tags and create your own connections. Similarity
              measures shared tags, not the probability you will like a title.
            </p>
          </section>
        </div>
        <section className="preferences-screen" hidden={view !== 'preferences'}>
          <h2>Your preferences</h2>{' '}
          <Account
            library={{ version: 1, added, ratings, tagEdits, avoided }}
            onLoad={(value) => {
              const restored = restoreLibrary(
                JSON.stringify(value),
                sampleCatalog,
              );
              const merged = [...added];
              for (const item of restored.added) {
                if (merged.length < 200 && !findDuplicate(merged, item))
                  merged.push(item);
              }
              setAdded(merged);
              setRatings((old) => ({ ...restored.ratings, ...old }));
              setTagEdits((old) => ({ ...restored.tagEdits, ...old }));
              const raw = value as { avoided?: unknown };
              if (Array.isArray(raw?.avoided))
                setAvoided((old) =>
                  [...new Set([...old, ...(raw.avoided as string[])])].filter(
                    (g) => genreChoices.includes(g),
                  ),
                );
            }}
          />
          <details open className="genre-preferences">
            <summary>Genre preferences</summary>
            <p>
              Low ratings gently lower a genre’s rank; they never hide a whole
              genre. Only the genres you explicitly avoid below are excluded
              when metadata is available.
            </p>
            <div className="tag-options">
              {genreChoices.map((g) => (
                <button
                  key={g}
                  aria-pressed={avoided.includes(g)}
                  onClick={() =>
                    setAvoided((old) =>
                      old.includes(g)
                        ? old.filter((x) => x !== g)
                        : [...old, g],
                    )
                  }
                >
                  {avoided.includes(g) ? 'Avoiding: ' : 'Avoid '}
                  {g}
                </button>
              ))}
            </div>
            {preferences.blocked.length > 0 && (
              <p>
                Hidden from ratings: {preferences.blocked.join(', ')}. Change
                the underlying ratings to revise these preferences.
              </p>
            )}
          </details>
        </section>
        <section className="taste-section" hidden={view !== 'preferences'}>
          <div>
            <p className="eyebrow">YOUR TASTE, TAKING SHAPE</p>
            <h2>The threads that connect your favorites.</h2>
          </div>
          <div className="taste-tags">
            {Object.entries(taste)
              .filter(([, v]) => v > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([tag, v]) => (
                <span key={tag}>
                  {tag}
                  <b>{Math.round(v * 100)}%</b>
                </span>
              ))}
            {!Object.values(taste).some((v) => v > 0) && (
              <p className="muted">
                Your strongest themes will appear as you rate titles.
              </p>
            )}
          </div>
        </section>
        <GenreGuide />
        <footer>
          <span>mosaic / CSCI 310 Junior Seminar</span>
          {catalogApi && (
            <span>
              <a
                href="https://www.themoviedb.org"
                aria-label="Movie and TV data from TMDB"
              >
                <img
                  src="https://www.themoviedb.org/assets/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
                  alt="TMDB"
                  width="90"
                  style={{
                    display: 'inline-block',
                    height: 'auto',
                    marginRight: 12,
                  }}
                />
              </a>
              {igdbEnabled && (
                <>
                  <a href="https://www.igdb.com">IGDB</a>.{' '}
                </>
              )}
              This product uses the TMDB API but is not endorsed or certified by
              TMDB.
            </span>
          )}
          <span>
            Catalog data: <a href="https://hardcover.app">Hardcover</a> ·{' '}
            <a href="https://openlibrary.org">Open Library</a> ·{' '}
            <a
              href="https://www.apple.com/itunes/"
              target="_blank"
              rel="noreferrer"
            >
              Apple
            </a>{' '}
            ·{' '}
            <a
              href="https://www.tvmaze.com/api"
              target="_blank"
              rel="noreferrer"
            >
              TVmaze (CC BY-SA)
            </a>{' '}
            ·{' '}
            <a
              href="https://www.wikidata.org/wiki/Wikidata:Licensing"
              target="_blank"
              rel="noreferrer"
            >
              Wikidata (CC0)
            </a>
          </span>
        </footer>
      </main>
    </div>
  );
}
