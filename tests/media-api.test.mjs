import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeResults,
  gameRecord,
  extractTags,
  plainText,
  findDuplicate,
  queryError,
  verifyMedia,
  validStoredItem,
  searchMedia,
} from '../lib/media-api.ts';
import { restoreLibrary } from '../lib/library-storage.ts';
const apple = {
  kind: 'ebook',
  trackId: 123,
  trackName: 'Example',
  artistName: 'A. Writer',
  genres: ['Fantasy'],
  description: '<b>A friendship</b> and a quest.',
  releaseDate: '2020-01-01',
};
test('Apple results validate media type and stable identifiers', () => {
  const [book] = normalizeResults('Book', {
    results: [
      apple,
      { ...apple, trackId: 0 },
      { ...apple, kind: 'feature-movie', trackId: 234 },
    ],
  });
  assert.equal(book.id, 'apple:Book:123');
  assert.deepEqual(book.tags, ['fantasy', 'adventure', 'friendship']);
  assert.ok(validStoredItem(book));
  assert.equal(normalizeResults('Movie', { results: [apple] }).length, 0);
});
test('TV metadata strips HTML and missing metadata remains usable', () => {
  const [show] = normalizeResults('TV', [
    {
      show: {
        id: 42,
        name: 'Example',
        summary: '<p>Mystery &amp; friendship</p>',
        genres: [],
      },
    },
  ]);
  assert.equal(show.description, 'Mystery & friendship');
  assert.equal(show.creator, 'Network unavailable');
  assert.deepEqual(show.tags, ['friendship', 'mystery']);
});
test('same-name games are rejected unless classified as video games', () => {
  const entity = {
    id: 'Q123',
    labels: { en: { value: 'Hades' } },
    claims: { P31: [{ mainsnak: { datavalue: { value: { id: 'Q5' } } } }] },
  };
  assert.equal(gameRecord(entity), null);
  entity.claims.P31[0].mainsnak.datavalue.value.id = 'Q7889';
  assert.equal(gameRecord(entity).type, 'Game');
});
test('tagging does not infer themes from unrelated words or media type', () => {
  assert.deepEqual(extractTags('A popular album about a rocket', []), []);
  assert.deepEqual(extractTags('', ['Pop']), ['pop']);
  assert.equal(plainText('<b>Hello</b>&nbsp;world'), 'Hello world');
});
test('input length is bounded and invalid selections never call provider', async () => {
  assert.ok(queryError(' '));
  assert.ok(queryError('a'.repeat(101)));
  assert.equal(queryError('Arrival'), null);
  await assert.rejects(
    () =>
      verifyMedia({
        provider: 'Apple catalog',
        type: 'Game',
        externalId: '123',
      }),
    /could not be verified/,
  );
});
test('library restore rejects unsafe URLs, invalid ratings, and duplicates', () => {
  const book = normalizeResults('Book', { results: [apple] })[0];
  const result = restoreLibrary(
    JSON.stringify({
      version: 1,
      added: [
        book,
        book,
        { ...book, id: 'bad', sourceUrl: 'javascript:alert(1)' },
      ],
      ratings: { [book.id]: 5, unknown: 4 },
    }),
    [],
  );
  assert.equal(result.added.length, 1);
  assert.deepEqual(result.ratings, { [book.id]: 5 });
  assert.throws(() => restoreLibrary('{', []));
  assert.ok(
    findDuplicate([book], {
      ...book,
      id: 'different',
      title: 'Example (Special Edition)',
    }),
  );
  assert.equal(validStoredItem({ ...book, year: { bad: true } }), false);
});
test('catalog failures surface as errors instead of fake matches', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response('{}', { status: 429 });
  try {
    await assert.rejects(
      () => searchMedia('Movie', 'unique-rate-limit-test'),
      /catalog is busy/,
    );
  } finally {
    globalThis.fetch = original;
  }
});
test('verification re-fetches the provider record and rejects wrong categories', async () => {
  const original = globalThis.fetch;
  const book = normalizeResults('Book', { results: [apple] })[0];
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response(
      JSON.stringify({ results: [{ ...apple, kind: 'feature-movie' }] }),
    );
  };
  try {
    await assert.rejects(() => verifyMedia(book), /could not be verified/);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = original;
  }
});
