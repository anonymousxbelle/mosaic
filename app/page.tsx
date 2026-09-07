'use client';
import { useEffect, useMemo, useState } from 'react';
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
import { catalog } from '@/lib/catalog';
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
  const [ratings, setRatings] = useState<Ratings>({});
  const [mode, setMode] = useState('for-you');
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [seed, setSeed] = useState('hunger');
  const [search, setSearch] = useState('');
  const taste = useMemo(() => profile(catalog, ratings), [ratings]);
  const selected = catalog.find((i) => i.id === seed)!;
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
        'Set ratings for sample media titles and show For You recommendations. Ratings apply to the current page session.',
      inputSchema: {
        type: 'object',
        properties: {
          ratings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', enum: catalog.map((i) => i.id) },
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
            !catalog.some((i) => i.id === entry.id) ||
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
  const results = recommend(
    catalog,
    mode === 'based-on' ? vector(selected.tags) : taste,
    category,
    mode === 'based-on' ? [seed] : Object.keys(ratings),
  );
  const visible = catalog.filter((i) =>
    (i.title + ' ' + i.creator + ' ' + i.type)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div className="app-shell">
      <header className="topbar">
        <a href="/" className="brand">
          <Layers3 size={30} />
          mosaic<span className="brand-dot">●</span>
        </a>
        <span className="project-label">A CROSS-MEDIA EXPLORATION</span>
        <span className="prototype">Seminar prototype · 01</span>
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
              <span>{Object.keys(ratings).length} rated</span>
            </div>
            <p className="muted">
              Rate a few titles to shape your recommendations. Ratings stay in
              this session.
            </p>
            <label className="search">
              <Search size={18} />
              <input
                aria-label="Search sample catalog"
                placeholder="Search the sample catalog"
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
              onClick={() => setRatings({ hunger: 5, life: 5, arrival: 4 })}
            >
              Try an example taste profile <ArrowUpRight size={16} />
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
                        {selected.title} · {selected.type}
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
            <div className="results-heading">
              <h2>
                {mode === 'based-on'
                  ? 'Connected discoveries'
                  : 'Your discoveries'}
              </h2>
              <span aria-live="polite">{results.length} connections</span>
            </div>
            {!results.length ? (
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
                {results.map((item, index) => (
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
                        {Math.round(item.score * 100)}% similarity
                      </span>
                    </div>
                    <h3>{item.title}</h3>
                    <p className="creator">{item.creator}</p>
                    <p className="description">{item.description}</p>
                    <div className="connection">
                      <span>THE CONNECTION</span>
                      <p>{item.reasons.join(' · ')}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <p className="data-note">
              25-title sample catalog · Illustrative, hand-authored tags ·
              Similarity measures shared tags, not a probability that you will
              like a title.
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
          <span>Content-based discovery · Built to be explored</span>
        </footer>
      </main>
    </div>
  );
}
