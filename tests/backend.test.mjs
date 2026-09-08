import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { tmdbRecord, igdbRecord } from '../backend/worker.ts';
import { validStoredItem } from '../lib/media-api.ts';
const env = {
  ALLOWED_ORIGIN: 'https://anonymousxbelle.github.io',
  CATALOG_LIMITER: { limit: async () => ({ success: true }) },
};
test('TMDB normalization preserves verified IDs, keywords, directors and IMDb links', () => {
  const item = tmdbRecord(
    {
      id: 329865,
      title: 'Arrival',
      overview: 'Visitors arrive.',
      genres: [{ name: 'Science Fiction' }],
      keywords: { keywords: [{ name: 'mystery' }] },
      credits: { crew: [{ job: 'Director', name: 'Denis Villeneuve' }] },
      imdb_id: 'tt2543164',
    },
    'Movie',
  );
  assert.ok(validStoredItem(item));
  assert.equal(item.creator, 'Denis Villeneuve');
  assert.ok(item.tags.includes('science-fiction'));
  assert.ok(item.tags.includes('mystery'));
  assert.equal(item.imdbUrl, 'https://www.imdb.com/title/tt2543164/');
  assert.equal(tmdbRecord({ id: 3, name: 'A show' }, 'Movie'), null);
});
test('IGDB maps metadata into shared features and rejects invalid identifiers', () => {
  const item = igdbRecord({
    id: 42,
    name: 'A game',
    slug: 'a-game',
    summary: 'A journey.',
    themes: [{ name: 'Fantasy' }],
    involved_companies: [{ developer: true, company: { name: 'A studio' } }],
  });
  assert.ok(validStoredItem(item));
  assert.ok(item.tags.includes('fantasy'));
  assert.equal(item.creator, 'A studio');
  assert.equal(igdbRecord({ id: 'oops', name: 'Fake' }), null);
});
test('gateway refuses wrong origins, arbitrary routes and injection-shaped IDs', async () => {
  for (const [path, headers, status] of [
    ['/search?type=Game&q=Hades', { Origin: 'https://other.example' }, 403],
    ['/proxy?url=https://example.com', {}, 404],
    ['/verify?type=Game&id=1;delete', {}, 400],
  ]) {
    assert.equal(
      (
        await worker.fetch(
          new Request('https://api.example' + path, { headers }),
          env,
        )
      ).status,
      status,
    );
  }
});
test('missing credentials fail clearly without fabricated catalog entries', async () => {
  const r = await worker.fetch(
    new Request('https://api.example/search?type=Movie&q=Arrival'),
    env,
  );
  assert.equal(r.status, 503);
  assert.match((await r.json()).error, /not configured/);
});
test('gateway re-fetches TMDB record with server-side token and returns no token', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    calls++;
    assert.match(url, /api.themoviedb.org\/3\/movie\/42/);
    assert.equal(init.headers.Authorization, 'Bearer test-token');
    return Response.json({
      id: 42,
      title: 'Fixture',
      overview: 'A fantasy adventure.',
    });
  };
  try {
    const r = await worker.fetch(
      new Request('https://api.example/verify?type=Movie&id=42'),
      { ...env, TMDB_TOKEN: 'test-token' },
    );
    assert.equal(r.status, 200);
    const body = await r.text();
    assert.ok(!body.includes('test-token'));
    assert.equal(JSON.parse(body).items[0].id, 'tmdb:Movie:42');
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = original;
  }
});
test('gateway rate limit prevents upstream requests', async () => {
  const r = await worker.fetch(
    new Request('https://api.example/search?type=Game&q=Limited'),
    { ...env, CATALOG_LIMITER: { limit: async () => ({ success: false }) } },
  );
  assert.equal(r.status, 429);
});
