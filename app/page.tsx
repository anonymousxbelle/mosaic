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
import { genreChoices, genrePreferences, genreAllowed } from '@/lib/genres';
import { catalog as sampleCatalog } from '@/lib/catalog';
import { TagEditor } from '@/components/media/tag-editor';
import { effectiveTags, type TagEdits } from '@/lib/tags';
import { Account } from '@/components/media/account';
import { AddMedia } from '@/components/media/add-media';
import {
  findDuplicate,
  discoverMedia,
  catalogApi,
  type CatalogMedia,
} from '@/lib/media-api';
import { restoreLibrary, STORAGE_KEY } from '@/lib/library-storage';
import {
  categories,
  profile,
  vector,
  recommend,
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
  return (
    <div className={'media-mark ' + item.type.toLowerCase()}>
      <Icon size={24} />
    </div>
  );
}
export default function Home() {
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
  const knownTags = useMemo(
    () => [...new Set(catalog.flatMap((i) => i.tags))].sort(),
    [catalog],
  );
  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;
  const [ratings, setRatings] = useState<Ratings>({});
  const [mode, setMode] = useState('for-you');
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [seed, setSeed] = useState('hunger');
  const [search, setSearch] = useState('');
  const taste = useMemo(() => profile(catalog, ratings), [ratings, catalog]);
  const selected = catalog.find((i) => i.id === seed) || catalog[0];
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
  function removeItem(id: string) {
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
    discoveryRequest.current?.abort();
    const controller = new AbortController();
    discoveryRequest.current = controller;
    setDiscovering(true);
    setDiscoveryNotice('');
    const query =
      mode === 'genres'
        ? vector([genre])
        : mode === 'based-on'
          ? vector(selected?.tags || [])
          : taste;
    const tags = Object.keys(query)
      .filter((t) => query[t] > 0)
      .sort((a, b) => query[b] - query[a])
      .slice(0, 3);
    try {
      const found = await discoverMedia(
        category === 'All' ? [...categories] : [category],
        tags,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setCandidates(found.items.filter((i) => !findDuplicate(catalog, i)));
      setDiscoveryNotice(
        `${found.items.length} catalog candidates fetched.${found.failures.length ? ' Unavailable: ' + found.failures.join(', ') + '. Retry later.' : ''} Only candidates sharing your tags appear below.`,
      );
    } catch {
      if (!controller.signal.aborted)
        setDiscoveryNotice('Discovery could not finish. Please retry.');
    } finally {
      if (!controller.signal.aborted) setDiscovering(false);
    }
  }
  const preferences = genrePreferences(catalog, ratings);
  const results = recommend(
    [...catalog, ...candidates.filter((i) => !findDuplicate(catalog, i))],
    mode === 'genres'
      ? vector([genre])
      : mode === 'based-on'
        ? vector(selected?.tags || [])
        : taste,
    category,
    mode === 'based-on' ? [selected?.id || seed] : Object.keys(ratings),
  );
  const filteredResults = results
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
    .sort((a, b) => b.score - a.score);
  const visible = catalog.filter((i) =>
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
            <p className="eyebrow">DISCOVER YOUR NEXT CONNECTION</p>
            <h1>
              Your taste goes beyond
              <br />
              <span>one kind of story.</span>
            </h1>
          </div>
          <p>
            Start with something you love.
            <br />
            Find a book, album, game, film, or show
            <br />
            that shares what draws you in.
          </p>
        </div>
        <div className="workspace">
          <aside className="library">
            <div className="section-heading">
              <h2>Your starting points</h2>
              <span>{catalog.filter((i) => ratings[i.id]).length} rated</span>
            </div>
            <p className="muted">
              Add media from live catalogs, then rate your favorites. Your
              library and ratings are saved in this browser.
            </p>
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
            <AddMedia items={catalog} onAdd={addItem} />
            {notice && (
              <p className="library-notice" role="status">
                {notice}
              </p>
            )}
            {storageError && (
              <p className="form-error" role="alert">
                {storageError}
              </p>
            )}
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
                    <h3>{item.title}</h3>
                    <p className="library-creator">{item.creator}</p>
                    {added.some((x) => x.id === item.id) && (
                      <button
                        className="remove-added"
                        aria-label={'Remove ' + item.title + ' from library'}
                        onClick={() => removeItem(item.id)}
                      >
                        Remove title
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
                <p className="muted">No titles found. Try another name.</p>
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
          <section className="discovery">
            <Tabs value={mode} onValueChange={(v) => setMode(String(v))}>
              <div className="discovery-toolbar">
                <TabsList className="mode-tabs">
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
                    {['All', ...categories].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c === 'All' ? 'All media' : c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                    Explore a genre across books, music, movies, TV and games
                    where the catalog supplies matching metadata.
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
                      {genreChoices.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g.replace(/-/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              <TabsContent value="based-on">
                <div className="context">
                  <p className="eyebrow">FOLLOW A SINGLE THREAD</p>
                  <h2>More like this. In another medium.</h2>
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
                      {catalog.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.title} · {i.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
            <button
              className="add-media-button"
              disabled={
                discovering ||
                !(mode === 'genres'
                  ? true
                  : mode === 'based-on'
                    ? selected?.tags.length || 0
                    : Object.values(taste).some((v) => v > 0))
              }
              onClick={findConnections}
            >
              {discovering
                ? 'Searching catalogs…'
                : 'Find more from live catalogs'}
            </button>
            <details className="genre-preferences">
              <summary>Genre preferences</summary>
              <p>
                Two ratings of 1–2 stars in a genre, with no positive ratings in
                that genre and media type, hide further matches. One negative
                rating lowers their rank. You can also avoid genres explicitly:
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
            {discoveryNotice && (
              <p role="status" className="library-notice">
                {discoveryNotice}
              </p>
            )}
            <div className="results-heading">
              <h2>
                {mode === 'based-on'
                  ? 'Connected discoveries'
                  : 'Your discoveries'}
              </h2>
              <span aria-live="polite">
                {filteredResults.length} connections
              </span>
            </div>
            {!filteredResults.length ? (
              <div className="empty-state">
                <Sparkles size={32} />
                <h3>Every discovery starts somewhere.</h3>
                <p>
                  Give a title 3–5 stars, try another category, or explore Based
                  On.
                </p>
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
                        {Math.round(item.score * 100)}% match
                      </span>
                    </div>
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
                    {candidates.some((x) => x.id === item.id) &&
                      !findDuplicate(catalog, item) && (
                        <button
                          className="edit-tags"
                          onClick={() => {
                            try {
                              addItem(
                                candidates.find((x) => x.id === item.id)!,
                              );
                            } catch (e) {
                              setDiscoveryNotice((e as Error).message);
                            }
                          }}
                        >
                          Save to my library
                        </button>
                      )}
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
                    <div className="connection">
                      <span>THE CONNECTION</span>
                      <p>{item.reasons.join(' · ')}</p>
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
        <section className="taste-section">
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
        <footer>
          <span>mosaic / CSCI 310 Junior Seminar</span>
          {catalogApi && (
            <span>
              Data: <a href="https://www.themoviedb.org">TMDB</a> and{' '}
              <a href="https://www.igdb.com">IGDB</a>. This product uses the
              TMDB API but is not endorsed or certified by TMDB.
            </span>
          )}
          <span>
            Catalog data:{' '}
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
