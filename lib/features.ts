export type FeatureKind = 'genre' | 'subgenre' | 'theme' | 'tone' | 'audience' | 'format';
export const featureLabels: Record<FeatureKind, string> = {genre:'Genres',subgenre:'Subgenres',theme:'Themes',tone:'Mood',audience:'Audience',format:'Style / format'};
export const featureGroups: Record<string, string[]> = {
  sports: [
    'basketball',
    'football',
    'baseball',
    'sports-drama',
    'sports-anime',
  ],
  animation: ['anime'],
  fantasy: [
    'epic-fantasy',
    'urban-fantasy',
    'dark-fantasy',
    'mythic-fantasy',
    'fairy-tales',
    'magical-realism',
  ],
  'science-fiction': [
    'space-opera',
    'cyberpunk',
    'time-travel',
    'dystopian',
    'post-apocalyptic',
    'first-contact',
  ],
  mystery: ['cozy-mystery', 'detective-fiction', 'police-procedural'],
  thriller: ['psychological-thriller', 'crime-thriller', 'spy-thriller'],
  horror: ['gothic-horror', 'supernatural-horror', 'cosmic-horror'],
  romance: ['historical-romance', 'contemporary-romance', 'paranormal-romance'],
  history: ['historical-fiction'],
  'non-fiction': [
    'biography',
    'memoir',
    'popular-science',
    'self-help',
    'true-crime',
  ],
  humor: ['satire', 'romantic-comedy'],
  drama: ['family-drama', 'coming-of-age'],
  adventure: ['quest', 'survival', 'exploration'],
  action: ['superheroes', 'martial-arts'],
  strategy: ['turn-based-strategy', 'real-time-strategy'],
};
const terms: Record<string, string> = {
  sports: 'sports?|basketball|football|baseball|volleyball|soccer',
  basketball: 'basketball',
  football: 'football|soccer',
  baseball: 'baseball',
  anime: 'anime',
  'sports-drama': 'sports drama',
  'sports-anime': 'sports anime',
  animation: 'animation|animated',
  'epic-fantasy': 'epic fantasy|high fantasy',
  'urban-fantasy': 'urban fantasy',
  'dark-fantasy': 'dark fantasy',
  'mythic-fantasy': 'mythology|mythological|demigods?',
  'fairy-tales': 'fairy tales?|folktales?',
  'magical-realism': 'magical realism',
  'space-opera': 'space opera',
  cyberpunk: 'cyberpunk',
  'time-travel': 'time travel',
  dystopian: 'dystopi\\w*',
  'post-apocalyptic': 'post.apocalyptic',
  'first-contact': 'first contact|alien contact',
  'cozy-mystery': 'cozy myster\\w*|cosy myster\\w*',
  'detective-fiction': 'detective fiction|detectives?',
  'police-procedural': 'police procedural',
  'psychological-thriller': 'psychological thriller',
  'crime-thriller': 'crime thriller',
  'spy-thriller': 'espionage|spy thriller',
  'gothic-horror': 'gothic horror|gothic fiction',
  'supernatural-horror': 'supernatural horror',
  'cosmic-horror': 'cosmic horror|lovecraftian',
  'historical-romance': 'historical romance',
  'contemporary-romance': 'contemporary romance',
  'paranormal-romance': 'paranormal romance',
  'historical-fiction': 'historical fiction',
  biography: 'biograph\\w*',
  memoir: 'memoirs?',
  'popular-science': 'popular science',
  'self-help': 'self.help',
  'true-crime': 'true crime',
  satire: 'satire|satirical',
  'romantic-comedy': 'romantic comedy',
  'family-drama': 'family drama|family saga',
  'coming-of-age': 'coming.of.age|adolescence',
  quest: 'quests?',
  survival: 'survival',
  exploration: 'exploration',
  superheroes: 'superhero\\w*',
  'martial-arts': 'martial arts',
  'turn-based-strategy': 'turn.based strategy',
  'real-time-strategy': 'real.time strategy',
  magic: 'magic|magical|witchcraft|sorcery|wizards?|witches?',
  'magical-school': 'school of magic|wizarding school|magic school',
  'hidden-world': 'hidden world|secret world',
  'found-family': 'found family',
  friendship: 'friendship|friends',
  'good-versus-evil': 'good (?:versus|vs\\.?|and|against) evil',
  'chosen-one': 'chosen one',
  'political-intrigue': 'political intrigue|court intrigue',
  revenge: 'revenge|vengeance',
  grief: 'grief|bereavement',
  'self-discovery': 'self.discovery',
  lighthearted: 'lighthearted|light.hearted',
  heartwarming: 'heartwarming|heart.warming',
  suspenseful: 'suspenseful|suspense',
  'middle-grade': 'middle.grade|juvenile fiction|children.s fiction',
  'young-adult': 'young adult|teen fiction',
};
export const detailedPatterns = Object.fromEntries(
  Object.entries(terms).map(([k, v]) => [
    k,
    new RegExp('\\b(?:' + v + ')\\b', 'i'),
  ]),
);
export const detailedTags = Object.keys(terms);
export const subgenres = [...new Set(Object.values(featureGroups).flat())];
const anchorGenres = ['fantasy','science-fiction','mystery','thriller','horror','romance','sports','non-fiction','strategy'];
export function seedTopic(item?: {tags:string[]}):string|undefined {
  return item?.tags.find(t=>['basketball','football','baseball'].includes(t));
}
export function primaryGenre(item?: {genres?:string[];tags:string[]}):string|undefined {
  if(!item) return undefined;
  const labels=[...(item.genres || []),...item.tags];
  // Prefer provider genres; themes such as friendship must not define the pool.
  return labels.find(t=>anchorGenres.includes(t)) ||
    anchorGenres.find(parent=>featureGroups[parent]?.some(t=>labels.includes(t))) ||
    labels.find(t=>['adventure','action','drama','humor','history'].includes(t));
}
export function matchesGenre(item:{genres?:string[];tags:string[]},genre:string):boolean {
  const labels=[...(item.genres || []),...item.tags];
  return labels.includes(genre) || (featureGroups[genre] || []).some(t=>labels.includes(t));
}
export function featureKind(tag: string): FeatureKind {
  if (['anime','animation'].includes(tag)) return 'format';
  if (['middle-grade', 'young-adult'].includes(tag)) return 'audience';
  if (['lighthearted', 'heartwarming', 'suspenseful','emotional','reflective','hope'].includes(tag))
    return 'tone';
  if (['quest','survival','exploration','coming-of-age','superheroes','martial-arts','basketball','football','baseball'].includes(tag)) return 'theme';
  if (Object.hasOwn(featureGroups, tag) || ['fiction','non-fiction'].includes(tag)) return 'genre';
  if (subgenres.includes(tag)) return 'subgenre';
  return 'theme';
}
export function specificity(tag: string): number {
  if (['fiction', 'non-fiction'].includes(tag)) return 0.15;
  if (['middle-grade', 'young-adult', 'animation', 'anime'].includes(tag))
    return 0.35;
  if (featureKind(tag) === 'tone') return 0.65;
  if (Object.hasOwn(featureGroups, tag)) return 0.55;
  return detailedTags.includes(tag) ? 1.6 : 1;
}
export function detailedFeatures(description: string, subjects: string[]) {
  const text = [description, ...subjects].join(' ');
  return Object.entries(detailedPatterns)
    .filter(([, p]) => p.test(text))
    // Audience comes from catalog labels, never a character's age in a synopsis.
    .filter(([tag,p]) => featureKind(tag) !== 'audience' || subjects.some(s=>p.test(s)))
    // An incidental mention of "sports" (e.g. Quidditch) is not a sports genre.
    .filter(([tag]) => tag !== 'sports' || subjects.some(s=>detailedPatterns.sports.test(s)) || /\b(basketball|football|baseball|volleyball|soccer)\b/i.test(description))
    .map(([tag]) => tag);
}
// Controlled subject queries only. Personal collection names never become catalog queries.
export const bookSubjects: Record<string, string> = {
  sports: 'sports',
  basketball: 'basketball',
  anime: 'manga',
  fantasy: 'fantasy',
  magic: 'magic',
  'magical-school': 'magic',
  'mythic-fantasy': 'mythology',
  'epic-fantasy': 'fantasy',
  'urban-fantasy': 'urban fantasy',
  'dark-fantasy': 'dark fantasy',
  'fairy-tales': 'fairy tales',
  'magical-realism': 'magical realism',
  'science-fiction': 'science fiction',
  'space-opera': 'space opera',
  cyberpunk: 'cyberpunk',
  'time-travel': 'time travel',
  dystopian: 'dystopias',
  'post-apocalyptic': 'survival',
  mystery: 'mystery',
  'detective-fiction': 'detective and mystery stories',
  'cozy-mystery': 'cozy mysteries',
  thriller: 'thrillers',
  horror: 'horror',
  romance: 'romance',
  adventure: 'adventure',
  quest: 'quests',
  friendship: 'friendship',
  'coming-of-age': 'coming of age',
  'young-adult': 'young adult fiction',
  'middle-grade': 'juvenile fiction',
  'historical-fiction': 'historical fiction',
  biography: 'biography',
  memoir: 'memoirs',
  'popular-science': 'science',
  'self-help': 'self-help',
  'true-crime': 'true crime',
  humor: 'humor',
  survival: 'survival',
  rebellion: 'rebellion',
};
