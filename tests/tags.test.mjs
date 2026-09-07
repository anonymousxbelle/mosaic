import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTag, effectiveTags, restoreTagEdits } from '../lib/tags.ts';
import { profile, recommend } from '../lib/recommendations.ts';
const item = {
  id: 'a',
  title: 'A',
  creator: 'A',
  type: 'Book',
  tags: ['fantasy'],
  description: '',
};
test('personal tags normalize reuse and reject malformed or excessive labels', () => {
  assert.equal(normalizeTag(' Found Family '), 'found-family');
  for (const raw of [
    'a',
    '<script>',
    '__proto__',
    'constructor',
    'x'.repeat(33),
    '2fast',
  ])
    assert.throws(() => normalizeTag(raw));
});
test('personal tags create cross-media connections and hidden tags stop contributing', () => {
  const a = {
    ...item,
    tags: effectiveTags(item, { added: ['found-family'], hidden: ['fantasy'] }),
  };
  const b = { ...item, id: 'b', type: 'Movie', tags: ['found-family'] };
  assert.deepEqual(a.tags, ['found-family']);
  assert.equal(
    recommend([a, b], profile([a, b], { a: 5 }), 'All', ['a'])[0].id,
    'b',
  );
  assert.equal(profile([a], { a: 5 }).fantasy, undefined);
});
test('persisted personal tags are bounded, validated and attached only to known titles', () => {
  const restored = restoreTagEdits(
    {
      a: {
        added: [' Found Family ', 'found-family', '<script>'],
        hidden: ['fantasy', 'fake'],
      },
      unknown: { added: ['bad'], hidden: [] },
    },
    [item],
  );
  assert.deepEqual(restored.a, {
    added: ['found-family'],
    hidden: ['fantasy'],
  });
  assert.equal(restored.unknown, undefined);
  assert.equal(
    restoreTagEdits(
      {
        a: {
          added: Array.from({ length: 30 }, (_, i) => 'tag' + i),
          hidden: [],
        },
      },
      [item],
    ).a.added.length,
    12,
  );
});
