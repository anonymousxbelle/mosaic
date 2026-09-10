import test from 'node:test';
import assert from 'node:assert/strict';
import { extractTags, validStoredItem } from '../lib/media-api.ts';
import { normalizeGenres } from '../lib/genres.ts';
import { openLibraryRecord, discoverBooks } from '../lib/book-api.ts';
import { recommend, vector, diversify } from '../lib/recommendations.ts';
import { tmdbRecord } from '../backend/worker.ts';
import { genreDescription, glossaryTags } from '../lib/genre-descriptions.ts';
import { effectiveTags, restoreTagEdits } from '../lib/tags.ts';
const book = (id, title, subjects) =>
  openLibraryRecord({
    key: '/works/' + id,
    title,
    subject: subjects,
    author_name: [title + ' author'],
  });
test('specific fantasy evidence ranks a related book over broad fiction', () => {
  const seed = book('OL1W', 'Seed', [
    'Fantasy fiction',
    'Magic',
    'Friendship',
    'Juvenile fiction',
  ]);
  const related = book('OL2W', 'Related', [
    'Fantasy fiction',
    'Magic',
    'Friendship',
    'Greek mythology',
    'Juvenile fiction',
  ]);
  const broad = book('OL3W', 'Broad', ['Fiction']);
  const ranked = recommend([broad, related], vector(seed.tags), 'Book');
  assert.equal(ranked[0].id, related.id);
  assert.ok(ranked[0].score > ranked[1].score);
  assert.ok(validStoredItem(related));
  assert.equal(
    validStoredItem({ ...related, sourceUrl: 'https://evil.test' }),
    false,
  );
});
test('sports anime uses metadata and does not infer tags from title alone', () => {
  const x = tmdbRecord(
    {
      id: 1,
      name: 'Example',
      overview: 'A basketball team competes.',
      genres: [{ name: 'Animation' }, { name: 'Drama' }],
      origin_country: ['JP'],
    },
    'TV',
  );
  for (const t of [
    'sports',
    'basketball',
    'anime',
    'sports-anime',
    'sports-drama',
  ])
    assert.ok(x.tags.includes(t), t);
  const missing = tmdbRecord(
    { id: 2, name: 'Basketball Anime', genres: [] },
    'TV',
  );
  assert.deepEqual(missing.tags, []);
});
test('historical fiction stays fiction and unknown descriptions stay untagged', () => {
  assert.equal(
    normalizeGenres(['Historical fiction']).includes('non-fiction'),
    false,
  );
  assert.deepEqual(extractTags('', []), []);
});
test('new automatic tags can be hidden and survive restoration', () => {
  const item = {
    ...book('OL8W', 'Saved', []),
    description: 'Magic and friendship.',
    tags: [],
  };
  const edits = restoreTagEdits(
    { [item.id]: { added: [], hidden: ['magic'] } },
    [item],
  );
  assert.equal(effectiveTags(item, edits[item.id]).includes('magic'), false);
});
test('subject retrieval is bounded, cached, and never searches a title for a tag', async () => {
  const old = fetch;
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    return new Response(
      JSON.stringify({
        docs: [
          {
            key: '/works/OL9W',
            title: 'Result',
            subject: ['Fantasy fiction', 'Magic'],
            author_name: ['Author'],
          },
        ],
      }),
    );
  };
  try {
    const x = await discoverBooks(['magic', 'fantasy']);
    assert.equal(x.length, 1);
    assert.equal(urls.length, 2);
    assert.ok(
      urls.every((u) => new URL(u).searchParams.get('q').includes('subject:')),
    );
    await discoverBooks(['magic', 'fantasy']);
    assert.equal(urls.length, 2);
    assert.deepEqual(await discoverBooks(['my-private-taste']), []);
  } finally {
    globalThis.fetch = old;
  }
});
test('glossary explains all supported choices and diversification preserves candidates', () => {
  assert.ok(glossaryTags.every((t) => genreDescription(t).length > 15));
  const a = { ...book('OL10W', 'One', ['Magic']), score: 1 },
    b = { ...book('OL11W', 'Two', ['Magic']), creator: a.creator, score: 0.95 },
    c = { ...book('OL12W', 'Three', ['Magic']), score: 0.94 };
  assert.equal(diversify([a, b, c])[1].id, c.id);
});
