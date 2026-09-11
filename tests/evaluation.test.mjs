import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateRanking} from '../lib/evaluation.ts';
test('evaluation distinguishes missing judgments from bad matches',()=>{
 assert.equal(evaluateRanking(['unknown'],{good:3}).ndcg,null);
 assert.equal(evaluateRanking(['bad'],{bad:0,good:3}).ndcg,0);
 assert.equal(evaluateRanking(['good'],{good:3},1).ndcg,1);
 assert.equal(evaluateRanking(['good'],{good:3,missing:3},1).judgedRecall,0.5);
 assert.equal(evaluateRanking(['good'],{good:3}).precision,0.1);
});
