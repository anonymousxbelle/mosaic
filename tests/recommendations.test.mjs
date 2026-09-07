import test from 'node:test';
import assert from 'node:assert/strict';
import { cosine, vector, profile, recommend } from '../lib/recommendations.ts';
const item = (id, tags, type = 'Book') => ({
  id,
  title: id,
  type,
  tags,
  creator: 'Test',
  description: 'Test fixture',
});
test('cosine handles identical, disjoint, empty and unequal-scale vectors', () => {
  assert.ok(Math.abs(cosine({ a: 1, b: 1 }, { a: 4, b: 4 }) - 1) < 1e-12);
  assert.equal(cosine({ a: 1 }, { b: 1 }), 0);
  assert.equal(cosine({}, { a: 1 }), 0);
  assert.equal(cosine({}, {}), 0);
});
test('profile uses normalized rating weights and ignores invalid ratings', () => {
  const c = [
    item('a', ['hope']),
    item('b', ['mystery']),
    item('c', ['romance']),
  ];
  assert.deepEqual(profile(c, { a: 5, b: 3, c: 1 }), {
    hope: 0.75,
    mystery: 0.25,
    romance: 0,
  });
  assert.deepEqual(profile(c, { a: NaN, b: 7, c: -1 }), {});
});
test('low ratings do not create positive recommendations', () => {
  const c = [item('a', ['hope']), item('b', ['hope'])];
  assert.deepEqual(recommend(c, profile(c, { a: 1 }), 'All', ['a']), []);
});
test('Based On filters category, excludes seed, and ranks by similarity', () => {
  const c = [
    item('seed', ['hope', 'adventure']),
    item('match', ['hope', 'adventure'], 'Music'),
    item('partial', ['hope', 'mystery'], 'Music'),
    item('unrelated', ['romance'], 'Music'),
    item('other', ['hope', 'adventure'], 'Game'),
  ];
  const r = recommend(c, vector(c[0].tags), 'Music', ['seed']);
  assert.deepEqual(
    r.map((i) => i.id),
    ['match', 'partial'],
  );
  assert.deepEqual(r[0].reasons, ['hope', 'adventure']);
  assert.ok(r[0].score > r[1].score);
});
test('rated titles are excluded and ties are deterministic', () => {
  const c = [item('z', ['hope']), item('a', ['hope']), item('rated', ['hope'])];
  assert.deepEqual(
    recommend(c, { hope: 1 }, 'All', ['rated']).map((i) => i.id),
    ['a', 'z'],
  );
});
test('duplicate tags do not amplify profile or vectors', () => {
  assert.deepEqual(vector(['hope', 'hope']), { hope: 1 });
  assert.deepEqual(profile([item('a', ['hope', 'hope'])], { a: 5 }), {
    hope: 1,
  });
});
