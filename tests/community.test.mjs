import test from 'node:test';
import assert from 'node:assert/strict';
import { communityScores } from '../lib/community-recommendations.ts';
test('community evidence requires overlapping preferences and several independent readers', () => {
  const mine = { a: 5, b: 4, c: 5 };
  const peers = ['u1', 'u2', 'u3'].map((userId) => ({
    userId,
    ratings: { ...mine, d: 5 },
  }));
  assert.deepEqual(communityScores(mine, peers.slice(0, 2), 'me'), []);
  assert.equal(communityScores(mine, peers, 'me')[0].id, 'd');
  assert.deepEqual(
    communityScores(mine, [{ userId: 'me', ratings: { ...mine, d: 5 } }], 'me'),
    [],
  );
  assert.deepEqual(
    communityScores(
      mine,
      peers.map((p) => ({ ...p, ratings: { a: 1, b: 1, c: 1, d: 5 } })),
      'me',
    ),
    [],
  );
});
