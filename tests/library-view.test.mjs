import test from 'node:test';
import assert from 'node:assert/strict';
import {libraryShelf,matchesShelf,libraryOrder} from '../lib/library-view.ts';
import {hasCloseTitle,rankSearch,titleSearchKey} from '../lib/catalog-text.ts';
test('a rated bookmark appears only on the experienced shelf',()=>{const item={id:'a',libraryState:'later'};assert.equal(libraryShelf(item,{a:5}),'experienced');assert.equal(matchesShelf(item,{a:5},'later'),false);assert.equal(matchesShelf(item,{a:5},'experienced'),true);assert.equal(matchesShelf(item,{},'later'),true);});
test('dismissed titles stay separate even if rated and sort last without mutating input',()=>{const items=[{id:'a',libraryState:'dismissed'},{id:'b',libraryState:'later'},{id:'c'}];assert.equal(libraryShelf(items[0],{a:5}),'dismissed');assert.deepEqual(libraryOrder(items,{}).map(i=>i.id),['b','c','a']);assert.equal(items[0].id,'a');});
test('title matching ignores connecting words and punctuation but preserves repeated title words',()=>{assert.equal(titleSearchKey('Tomorrow, and Tomorrow, and Tomorrow'),titleSearchKey('tomorrow tomorrow and tomorrow'));assert.notEqual(titleSearchKey('tomorrow'),titleSearchKey('tomorrow tomorrow tomorrow'));assert.equal(hasCloseTitle([{title:'Tomorrow, and Tomorrow, and Tomorrow'}],'tomorrow tomorrow and tomorrow'),true);const items=[{title:'This Time Tomorrow',creator:'A'},{title:'Tomorrow, and Tomorrow, and Tomorrow',creator:'B'}];assert.equal(rankSearch(items,'tomorrow tomorrow and tomorrow')[0].creator,'B');});

test('rated titles precede bookmarks and dismissed rated titles remain last',()=>{const items=[{id:'later',libraryState:'later'},{id:'dismissed',libraryState:'dismissed'},{id:'rated'},{id:'other'}];assert.deepEqual(libraryOrder(items,{rated:5,dismissed:5}).map(i=>i.id),['rated','later','other','dismissed']);});

test('exact short title survives a bounded enrichment shortlist',()=>{const rows=Array.from({length:20},(_,i)=>({title:i===19?'K':`K prefix ${i}`,creator:'',ratingCount:100-i}));assert.equal(rankSearch(rows,'K').slice(0,8)[0].title,'K');});

