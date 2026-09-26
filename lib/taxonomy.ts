// A title can have several genres and facets. Unknown content class stays unknown.
export type ContentClass='fiction'|'non-fiction'|'unknown';
export type TaxonomyKind='class'|'genre'|'subgenre'|'theme'|'trope'|'setting'|'tone'|'audience'|'format';
export type TaxonomyNode={kind:TaxonomyKind;classes?:ContentClass[];parents?:string[];media?:string[];description:string;label?:string;aliases?:string[];retired?:boolean};
export const taxonomy:Record<string,TaxonomyNode>={};
function add(kind:TaxonomyKind,ids:string[],classes?:ContentClass[],parents?:string[],media?:string[]){
 for(const id of ids)taxonomy[id]={kind,classes,parents,media,description:'A '+kind+' label for '+id.replaceAll('-',' ')+'.'};
}
add('class',['fiction','non-fiction']);
add('genre',['fantasy','science-fiction','mystery','thriller','horror','romance','drama','action'],['fiction']);
add('genre',['adventure','history','humor','sports'],['fiction','non-fiction']);
add('genre',['biography','memoir','popular-science','self-help','true-crime','nature','travel','politics','philosophy','arts','technology'],['non-fiction']);
const branches:Record<string,string[]>={
 fantasy:['epic-fantasy','urban-fantasy','dark-fantasy','mythic-fantasy','fairy-tales','magical-realism'],
 'science-fiction':['space-opera','cyberpunk','time-travel','dystopian','post-apocalyptic','first-contact'],
 mystery:['cozy-mystery','detective-fiction','police-procedural'],
 thriller:['psychological-thriller','crime-thriller','spy-thriller'],
 horror:['gothic-horror','supernatural-horror','cosmic-horror'],
 romance:['historical-romance','contemporary-romance','paranormal-romance','romantic-comedy'],
 history:['historical-fiction'],drama:['family-drama','sports-drama'],humor:['satire'],
 biography:['political-biography','scientific-biography','artist-biography'],
 memoir:['travel-memoir','family-memoir'], 'popular-science':['astronomy','psychology','natural-history'],
 'self-help':['personal-growth','productivity'],'true-crime':['investigative-true-crime'],
};
for(const [parent,children] of Object.entries(branches))add('subgenre',children,taxonomy[parent].classes,[parent]);
taxonomy['historical-fiction'].classes=['fiction'];
add('format',['animation'],undefined,undefined,['Movie','TV']);
add('subgenre',['anime','donghua'],undefined,['animation'],['Movie','TV']);
add('format',['manga','light-novel'],undefined,undefined,['Book']);
add('subgenre',['sports-anime'],['fiction'],['anime','sports'],['Movie','TV']);
add('format',['short-film'],undefined,undefined,['Movie']);
add('format',['limited-series'],undefined,undefined,['TV']);
add('format',['novella','book-series'],undefined,undefined,['Book']);
add('theme',['friendship','found-family','identity','self-discovery','grief','revenge','connection','rebellion']);
add('theme',['magic','hidden-world','good-versus-evil'],['fiction'],['fantasy']);
add('theme',['basketball','football','baseball','competition','teamwork'],undefined,['sports']);
add('theme',['political-intrigue','power-and-corruption'],undefined,['history','fantasy','thriller','politics','biography']);
add('theme',['survival','exploration','quest'],undefined,['adventure','science-fiction','fantasy','travel','nature']);
add('theme',['coming-of-age'],['fiction'],['drama','romance','fantasy']);
add('theme',['superheroes','martial-arts'],['fiction'],['action']);
add('theme',['trust-and-betrayal'],undefined,['mystery','thriller','romance','history','true-crime']);
add('theme',['discovery-and-innovation'],undefined,['science-fiction','popular-science','technology','biography']);
add('trope',['chosen-one','learning-magic'],['fiction'],['fantasy']);
add('trope',['marriage-of-convenience','forbidden-love','second-chance-romance','enemies-to-lovers','friends-to-lovers','fake-relationship','slow-burn'],['fiction'],['romance']);
add('trope',['solving-a-mystery','locked-room-mystery','amateur-sleuth'],['fiction'],['mystery']);
add('trope',['heist','unreliable-narrator','race-against-time'],['fiction'],['thriller','mystery','action']);
add('trope',['family-secrets'],undefined,['drama','mystery','romance','memoir','biography']);
add('setting',['magical-school'],['fiction'],['fantasy']);
add('setting',['school','small-town','workplace']);
add('setting',['space'],undefined,['science-fiction','popular-science']);
add('setting',['royal-court','imperial-court','regency-britain','victorian-britain','medieval','second-world-war'],undefined,['history','fantasy','romance','mystery','biography','politics']);
add('tone',['lighthearted','heartwarming','suspenseful','emotional','reflective','hope','dark','bittersweet','whimsical','melancholic','tense','uplifting']);
add('audience',['children','middle-grade','young-adult','adult-audience','all-ages']);
taxonomy['book-series'].description='A book belongs to a series; this is separate from its volume number.';
taxonomy['adult-audience'].description='Intended for adult readers or viewers; does not imply explicit content.';
taxonomy['donghua'].description='Chinese animation, distinct from Japanese anime and live-action Chinese dramas.';
taxonomy['manga'].description='Japanese comics told through sequential art; individual volumes belong to a larger work when series metadata is available.';
taxonomy['light-novel'].description='A Japanese prose publishing format, often illustrated; distinct from manga.';
taxonomy['anime'].description='A subset of animation, recorded independently from story genres such as mystery or romance.';
export type ClassifiedItem={tags:string[];genres?:string[];type?:string};
export function contentClass(item:ClassifiedItem):ContentClass{
 const labels=[...item.tags,...(item.genres||[])];
 // Explicit class and primary genres outrank incidental synopsis subjects.
 if(labels.includes('non-fiction'))return 'non-fiction';
 if(labels.includes('fiction'))return 'fiction';
 const factualForms=['biography','memoir','popular-science','self-help','true-crime'];
 if((item.genres||[]).some(t=>taxonomy[t]?.classes?.length===1 && taxonomy[t].classes![0]==='non-fiction') || labels.some(t=>factualForms.includes(t)))return 'non-fiction';
 if(labels.includes('fiction') || labels.some(t=>taxonomy[t]?.classes?.length===1 && taxonomy[t].classes![0]==='fiction'))return 'fiction';
 return 'unknown';
}
export function tagApplicable(tag:string,item:ClassifiedItem){
 const node=taxonomy[tag];if(!node)return true;
 if(node.media?.length && item.type && !node.media.includes(item.type))return false;
 const cls=contentClass(item);
 return cls==='unknown' || !node.classes?.length || node.classes.includes(cls);
}
export function compatibleClass(a:ClassifiedItem,b:ClassifiedItem){
 const x=contentClass(a),y=contentClass(b);return x==='unknown'||y==='unknown'||x===y;
}
export function suggestedFacets(item:ClassifiedItem){
 const labels=new Set([...item.tags,...(item.genres||[])]);
 // Expand known subgenres to parents for applicable themes and tropes.
 for(let depth=0;depth<Object.keys(taxonomy).length;depth++){const size=labels.size;for(const tag of [...labels])for(const parent of taxonomy[tag]?.parents||[])labels.add(parent);if(labels.size===size)break;}
 return Object.keys(taxonomy).filter(tag=>!taxonomy[tag].retired && tagApplicable(tag,item) && (!taxonomy[tag].parents?.length || taxonomy[tag].parents!.some(p=>labels.has(p))));
}

const explanations:Record<string,string>={
 'nature':'Factual works about wildlife, ecosystems and the natural world.',
 'travel':'Factual accounts or guidance about places and journeys.',
 'politics':'Factual works about government, public policy and political power.',
 'philosophy':'Works examining knowledge, ethics, existence and reasoning.',
 'arts':'Factual study or criticism of artistic practices and works.',
 'technology':'Factual works about technological systems, inventions and their effects.',
 'political-biography':'An account of a real person’s life focused on political activity.',
 'scientific-biography':'An account of a real scientist’s life and work.',
 'artist-biography':'An account of a real artist’s life and creative work.',
 'travel-memoir':'A personal recollection organized around real journeys.',
 'family-memoir':'A personal recollection focused on real family relationships and history.',
 'astronomy':'Factual study of celestial bodies and the universe.',
 'psychology':'Factual study of mind, behavior and mental processes.',
 'natural-history':'Factual observation of organisms and the natural world.',
 'personal-growth':'Practical guidance intended to support personal development.',
 'productivity':'Practical guidance about organizing time and completing work.',
 'investigative-true-crime':'Evidence-based investigation of real crimes.',
 'short-film':'A work explicitly identified as a short film; not inferred from a guessed duration.',
 'limited-series':'A television work identified as a limited or miniseries.',
 'novella':'A prose work identified by its source as a novella.',
 'teamwork':'Cooperation among people pursuing a shared goal.',
 'competition':'Rivalry or contests are central to the subject or story.',
 'power-and-corruption':'How authority is exercised, abused or resisted.',
 'trust-and-betrayal':'Trust, deception and broken loyalties are central.',
 'discovery-and-innovation':'Developing or uncovering new knowledge, tools or ideas.',
 'learning-magic':'A character studies or trains to use magical abilities.',
 'marriage-of-convenience':'A marriage begins for practical reasons rather than love.',
 'forbidden-love':'A central romance faces social or external prohibitions.',
 'second-chance-romance':'Former partners have another opportunity at romance.',
 'enemies-to-lovers':'An antagonistic relationship develops into romance.',
 'friends-to-lovers':'An established friendship develops into romance.',
 'fake-relationship':'Characters pretend to be in a relationship.',
 'slow-burn':'A romantic relationship develops gradually over the story.',
 'solving-a-mystery':'Uncovering the explanation of an unknown event drives the plot.',
 'locked-room-mystery':'A crime appears impossible because access or escape seems blocked.',
 'amateur-sleuth':'A nonprofessional investigator takes the central detective role.',
 'heist':'Planning or carrying out a significant theft drives the plot.',
 'unreliable-narrator':'The narration cannot be accepted as a dependable account.',
 'race-against-time':'A deadline creates urgency for the central goal.',
 'family-secrets':'Hidden family information shapes the story or account.',
 'school':'A school or academy is a significant setting.',
 'small-town':'A small community forms the setting.',
 'workplace':'A place of employment forms a significant setting.',
 'space':'Outer space or a spacecraft forms a significant setting or subject.',
 'royal-court':'A royal household and its surrounding society form the setting.',
 'imperial-court':'An emperor’s household and its surrounding society form the setting.',
 'regency-britain':'A setting in Regency-era Britain.',
 'victorian-britain':'A setting in Victorian-era Britain.',
 'medieval':'A setting in a medieval period.',
 'second-world-war':'A setting during the Second World War.',
 'dark':'A bleak, disturbing or grim emotional atmosphere.',
 'bittersweet':'Positive feelings are mixed with sadness or loss.',
 'whimsical':'A playful, fanciful emotional atmosphere.',
 'melancholic':'A sustained atmosphere of sadness or reflection.',
 'tense':'A sustained sense of pressure or unease.',
 'uplifting':'An encouraging or emotionally restorative atmosphere.',
 'children':'A source identifies the intended audience as children.',
 'all-ages':'A source identifies the work as intended for a broad age range; not a safety guarantee.',
};
for(const [id,description]of Object.entries(explanations))if(taxonomy[id])taxonomy[id].description=description;
// Versioned editor output is bundled at build time; browser drafts never change other users' taxonomy.
import edits from '../data/taxonomy-edits.json' with {type:'json'};
import {validateTaxonomy,canonicalTag} from './taxonomy-editor.ts';
const merged={...taxonomy,...edits.nodes};
const editErrors=validateTaxonomy({version:edits.version,nodes:merged});
if(editErrors.length)throw new Error('Invalid taxonomy edits: '+editErrors.join('; '));
Object.assign(taxonomy,edits.nodes);
export const taxonomyLabel=(id:string)=>taxonomy[id]?.label||id.replaceAll('-',' ');
export const resolveTaxonomyTag=(tag:string)=>canonicalTag(tag,taxonomy);
