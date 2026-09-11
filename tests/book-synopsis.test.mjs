import test from 'node:test';
import assert from 'node:assert/strict';
import {openLibraryRecord,enrichBook} from '../lib/book-api.ts';
import {discoverMedia} from '../lib/media-api.ts';
import {rememberCatalog} from '../lib/retrieval.ts';
import {semanticText,compareDescriptions} from '../lib/semantic.ts';
import {hasSynopsis} from '../lib/catalog-text.ts';
import worker from '../backend/worker.ts';
const placeholder='No synopsis supplied. Subject information is available from the source.';
const text='Young wizards study magic together and discover a hidden world while forming lasting friendships.';
test('placeholder text is not a synopsis or an AI input',async()=>{
 for(const description of ['',placeholder,'No synopsis supplied by this catalog.','No description supplied by this catalog.']){
  assert.equal(hasSynopsis(description),false);assert.equal(semanticText({description}),'');
 }
 await assert.rejects(compareDescriptions('https://api.test',{id:'s',description:placeholder},[{id:'c',description:text}]));
 const response=await worker.fetch(new Request('https://api.test/semantic',{method:'POST',body:JSON.stringify({seed:{id:'s',text:placeholder},items:[{id:'c',text}]})}),{ALLOWED_ORIGIN:'https://anonymousxbelle.github.io'});
 assert.equal(response.status,400);
});
test('fresh work details replace a cached blank discovery record',async()=>{
 const old=fetch;
 const row={key:'/works/OL9898999W',title:'Test fantasy work',author_name:['Example author'],subject:['Fantasy','Magic']};
 const blank=openLibraryRecord(row);assert.equal(blank.synopsisStatus,'pending');assert.equal(blank.description,'');
 rememberCatalog([{...blank,description:placeholder}]);
 globalThis.fetch=async url=>Response.json(String(url).includes('/search.json')?{docs:[row]}:{description:{value:text},subjects:['Fantasy','Magic','Friendship']});
 try{
  const result=await discoverMedia(['Book'],['fantasy','magic']);
  const found=result.items.find(x=>x.id===blank.id);
  assert.equal(found.description,text);assert.equal(found.synopsisStatus,'available');assert.ok(found.tags.includes('friendship'));
 }finally{globalThis.fetch=old;}
});
test('missing or failed full records remain honest and retryable',async()=>{
 const old=fetch;const blank=openLibraryRecord({key:'/works/OL9898998W',title:'Missing work',subject:['Fantasy'],author_name:['Writer']});
 try{
  globalThis.fetch=async()=>Response.json({subjects:['Fantasy']});
  const result=await enrichBook(blank);assert.equal(result.synopsisStatus,'unavailable');assert.equal(result.description,'');
  globalThis.fetch=async()=>new Response('',{status:503});
  await assert.rejects(enrichBook({...blank,externalId:'OL9898997W'}));
  assert.equal(blank.synopsisStatus,'pending');
 }finally{globalThis.fetch=old;}
});

test('Hardcover verification retains the full synopsis when its search index has none',async()=>{
 const {hardcoverBooks}=await import('../backend/hardcover.ts');const old=fetch;
 globalThis.fetch=async(_url,init)=>{
  const body=JSON.parse(init.body);
  return Response.json({data:body.query.includes('query Verify')?
   {books:[{id:123,title:'Example',slug:'example',description:text}]}:
   {search:{results:{hits:[{document:{id:123,title:'Example',slug:'example',genres:['Fantasy']}}]}}}});
 };
 try{const [book]=await hardcoverBooks({HARDCOVER_TOKEN:'test-only'},'/verify','','123',[]);assert.equal(book.description,text);assert.ok(book.tags.includes('magic'));}
 finally{globalThis.fetch=old;}
});

