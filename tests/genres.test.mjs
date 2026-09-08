import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeGenres,
  genrePreferences,
  genreAllowed,
} from '../lib/genres.ts';
import { bookSynopsis, rankSearch } from '../lib/catalog-text.ts';
test('nonfiction is a genre, not fiction, and metadata aliases normalize', () => {
  assert.deepEqual(normalizeGenres(['Nonfiction']), ['non-fiction']);
  assert.ok(normalizeGenres(['Biography & Memoir']).includes('non-fiction'));
  assert.ok(normalizeGenres(['Sci-Fi & Fantasy']).includes('science-fiction'));
});
test('inferred dislikes lower ranking without blocking an entire genre', () => {
  const items = [
    { id: 'a', type: 'Book', genres: ['non-fiction'] },
    { id: 'b', type: 'Book', genres: ['non-fiction'] },
  ];
  const p = genrePreferences(items, { a: 1, b: 2 });
  assert.equal(
    genreAllowed({ type: 'Book', genres: ['non-fiction'] }, p.blocked, []),
    true,
  );
  assert.equal(
    genreAllowed({ type: 'Movie', genres: ['non-fiction'] }, p.blocked, []),
    true,
  );
  assert.equal(p.penalties['Book:non-fiction'], 0.3);
  assert.equal(p.penalties['Movie:non-fiction'], undefined);
  assert.deepEqual(genrePreferences(items, { a: 1, b: 4 }).blocked, []);
  assert.equal(
    genrePreferences(items, { a: 2 }).penalties['Book:non-fiction'],
    0.15,
  );
});
test('explicit avoidance works without ratings', () =>
  assert.equal(
    genreAllowed(
      { type: 'Book', genres: ['non-fiction'] },
      [],
      ['non-fiction'],
    ),
    false,
  ));
test('book descriptions strip separate promotional blurbs and preserve synopsis', () => {
  assert.equal(
    bookSynopsis(
      '<p>#1 New York Times bestseller</p><p>A young person travels across the ocean.</p><p>“Incredible!” — A Reviewer</p>',
    ),
    'A young person travels across the ocean.',
  );
});
test('exact title relevance beats a popular companion and counts break equivalent matches', () => {
  const rows = [
    { title: 'Dune study guide', creator: 'X', ratingCount: 9999 },
    { title: 'Dune', creator: 'Frank Herbert', ratingCount: 10 },
    { title: 'Dune', creator: 'Frank Herbert', ratingCount: 100 },
  ];
  assert.deepEqual(
    rankSearch(rows, 'Dune').map((i) => i.ratingCount),
    [100, 10, 9999],
  );
});
