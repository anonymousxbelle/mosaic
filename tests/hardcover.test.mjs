import test from 'node:test';import assert from 'node:assert/strict';
import {hardcoverBooks,hardcoverRecord} from '../backend/hardcover.ts';
import {validStoredItem} from '../lib/media-api.ts';
test('Hardcover records survive storage validation and reject forged source links',()=>{
 const record=hardcoverRecord({id:328491,title:'Book',slug:'book',genres:['Fantasy'],tags:['Magic']});
 assert.ok(validStoredItem(record));
 assert.equal(validStoredItem({...record,sourceUrl:'https://hardcover.app.evil.example/books/book'}),false);
 assert.equal(validStoredItem({...record,type:'Movie'}),false);
});
test('Hardcover normalizes public metadata without returning private fields',()=>{const x=hardcoverRecord({id:'1',title:'Example',slug:'example',genres:['Fantasy'],tags:['Magic','Friendship'],moods:['Hopeful'],author_names:['Author'],private_note:'secret'});assert.ok(x.tags.includes('magic'));assert.ok(x.tags.includes('friendship'));assert.equal(x.private_note,undefined);assert.equal(hardcoverRecord({id:'../1',title:'Bad',slug:'bad'}),null);});
test('Hardcover uses fixed read-only queries and never searches genre words as titles',async()=>{const old=fetch;const calls=[];globalThis.fetch=async(url,init)=>{calls.push({url,body:JSON.parse(init.body),auth:init.headers.Authorization});return new Response(JSON.stringify({data:{search:{results:{hits:[{document:{id:1,title:'Book',slug:'book',genres:['Fantasy']}}]}}}}));};try{const x=await hardcoverBooks({HARDCOVER_TOKEN:'private-token'},'/search','Example','',[]);assert.equal(x.length,1);assert.equal(calls.length,1);assert.equal(calls[0].auth,'Bearer private-token');assert.equal(calls[0].body.variables.q,'Example');assert.deepEqual(await hardcoverBooks({HARDCOVER_TOKEN:'private-token'},'/discover','','',['fantasy','my-private-list']),[]);assert.equal(calls.length,1);assert.equal(JSON.stringify(x).includes('private-token'),false);assert.equal(calls[0].body.query.includes('mutation'),false);}finally{globalThis.fetch=old;}});

