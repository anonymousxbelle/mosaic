import test from 'node:test';
import assert from 'node:assert/strict';
import {taxonomy} from '../lib/taxonomy.ts';
import {validateTaxonomy,canonicalTag,previewSuggestions} from '../lib/taxonomy-editor.ts';
const doc=()=>({version:1,nodes:structuredClone(taxonomy)});
test('taxonomy drafts validate structure, aliases and graph references',()=>{
 const d=doc();assert.deepEqual(validateTaxonomy(d),[]);
 d.nodes.magic.aliases=['sorcery'];assert.equal(canonicalTag(' SORCERY ',d.nodes),'magic');
 d.nodes.fantasy.aliases=['sorcery'];assert.match(validateTaxonomy(d).join(' '),/already belongs/);
 delete d.nodes.fantasy.aliases;d.nodes.magic.parents=['missing'];assert.match(validateTaxonomy(d).join(' '),/missing related tag/);
 d.nodes.magic.parents=['fantasy'];d.nodes.fantasy.parents=['magic'];assert.match(validateTaxonomy(d).join(' '),/Circular/);
 assert.ok(validateTaxonomy({version:7,nodes:{}}).length);assert.ok(validateTaxonomy({version:1,nodes:{bad:null}}).length);
});
test('draft preview respects applicability and archive preserves IDs',()=>{
 const d=doc();d.nodes['coastal-mystery']={kind:'subgenre',description:'Mysteries set on a coast.',parents:['mystery'],classes:['fiction'],media:['Book']};
 assert.ok(previewSuggestions(d.nodes,['mystery'],'Book','fiction').includes('coastal-mystery'));
 assert.ok(!previewSuggestions(d.nodes,['fantasy'],'Book','fiction').includes('coastal-mystery'));
 assert.ok(!previewSuggestions(d.nodes,['mystery'],'TV','fiction').includes('coastal-mystery'));
 assert.ok(!previewSuggestions(d.nodes,['mystery'],'Book','non-fiction').includes('coastal-mystery'));
 d.nodes['coastal-mystery'].retired=true;assert.equal(canonicalTag('coastal-mystery',d.nodes),'coastal-mystery');assert.ok(!previewSuggestions(d.nodes,['mystery'],'Book','fiction').includes('coastal-mystery'));
 d.nodes.mystery.retired=true;assert.match(validateTaxonomy(d).join(' '),/archived/);
});
