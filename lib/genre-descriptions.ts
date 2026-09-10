import { featureGroups, featureKind, detailedTags } from './features.ts';
const descriptions: Record<string, string> = {
  fantasy: 'Stories with magic, supernatural worlds or beings.',
  'science-fiction':
    'Speculative stories about science, technology or imagined futures.',
  mystery: 'A puzzle, unexplained event or crime drives the story.',
  thriller: 'Tension, danger and suspense drive the story.',
  horror: 'Stories intended to create fear or dread.',
  romance: 'A central romantic relationship drives the story.',
  adventure: 'Journeys, quests, exploration or daring challenges.',
  history: 'Works concerned with past events; may be fiction or nonfiction.',
  'non-fiction': 'Works presented as factual, rather than invented stories.',
  fiction: 'Invented stories, even when inspired by real events.',
  humor: 'Comedy or amusement is a significant part of the work.',
  drama: 'Character conflict and emotional relationships drive the story.',
  action: 'Physical conflict, chases or combat are prominent.',
  strategy: 'Planning and tactical decisions shape gameplay.',
  roguelike:
    'Run-based games, usually with randomized challenges and loss of run progress on defeat. Roguelites often retain upgrades between runs.',
  sports: 'Athletic competition, training or teams are central.',
  animation: 'A work made using animation; it can suit any age group.',
  anime:
    'Japanese animation, or works explicitly classified as anime by the source.',
  'sports-anime': 'Anime centered on athletic competition, teams or training.',
  'sports-drama': 'A character-driven drama centered on sport.',
  basketball: 'Basketball competition, players or teams are central.',
  football: 'Football or soccer is a central sport.',
  baseball: 'Baseball competition, players or teams are central.',
  'epic-fantasy':
    'Large-scale fantasy conflicts and richly developed imagined worlds.',
  'urban-fantasy': 'Magic or supernatural beings in a modern urban setting.',
  'dark-fantasy': 'Fantasy with disturbing, bleak or horror elements.',
  'mythic-fantasy': 'Fantasy drawing on myths, gods or legendary beings.',
  'fairy-tales':
    'Traditional or reimagined tales involving enchantment and folklore.',
  'magical-realism':
    'An otherwise ordinary world presents extraordinary events as everyday life.',
  'space-opera': 'Large-scale adventures and conflicts across space.',
  cyberpunk:
    'Advanced technology alongside social inequality, often in urban settings.',
  'time-travel': 'Moving between different times is central.',
  dystopian: 'An oppressive or deeply troubled imagined society.',
  'post-apocalyptic': 'Life after a civilization-changing catastrophe.',
  'first-contact':
    'An initial encounter between humanity and extraterrestrial life.',
  'cozy-mystery':
    'A mystery emphasizing community and investigation with limited graphic violence.',
  'detective-fiction': 'A detective investigates and solves a mystery.',
  'police-procedural':
    'The methods and teamwork of police investigations are central.',
  'psychological-thriller':
    'Suspense focused on perception, motives and mental conflict.',
  'crime-thriller': 'Criminal activity creates danger and suspense.',
  'spy-thriller': 'Espionage, intelligence work and secrecy drive suspense.',
  'gothic-horror':
    'Atmospheric horror involving isolation, secrets or ominous settings.',
  'supernatural-horror': 'Fear centered on forces beyond ordinary explanation.',
  'cosmic-horror':
    'Fear of vast, incomprehensible forces and human insignificance.',
  'historical-romance': 'A central love story set in the past.',
  'contemporary-romance': 'A central love story in a contemporary setting.',
  'paranormal-romance': 'A love story involving supernatural beings or powers.',
  'historical-fiction': 'An invented story set in a recognizable past period.',
  biography: 'An account of another person’s life.',
  memoir: 'A personal account of selected life experiences.',
  'popular-science': 'Science explained for a general audience.',
  'self-help': 'Practical advice for personal improvement.',
  'true-crime': 'Factual accounts of crimes and investigations.',
  satire: 'Humor or irony used to criticize institutions or behavior.',
  'romantic-comedy': 'A romantic story with a strong comedic focus.',
  'family-drama': 'Conflict and relationships within a family.',
  'coming-of-age':
    'Growing maturity, identity and the transition toward adulthood.',
  quest: 'A journey to accomplish an important goal.',
  survival: 'Enduring dangerous conditions or threats.',
  exploration: 'Discovering unfamiliar places or environments.',
  superheroes:
    'Characters with extraordinary abilities undertaking heroic roles.',
  'martial-arts': 'Formal combat disciplines are central.',
  'turn-based-strategy': 'Players plan and act in alternating turns.',
  'real-time-strategy': 'Strategic decisions unfold continuously during play.',
  magic: 'Supernatural powers, spells or enchantment are present.',
  'magical-school': 'A school where magic is learned.',
  'hidden-world': 'A secret world exists alongside ordinary life.',
  'found-family': 'People form family-like bonds beyond biological relations.',
  friendship: 'Bonds between friends matter to the story.',
  'good-versus-evil': 'A conflict framed around opposing moral forces.',
  'chosen-one': 'A character singled out for a special destiny.',
  'political-intrigue': 'Power struggles, alliances and political maneuvering.',
  revenge: 'Seeking retaliation for a perceived wrong.',
  grief: 'Coping with loss or bereavement.',
  'self-discovery': 'Learning about one’s identity, values or desires.',
  lighthearted: 'A generally playful or low-intensity tone.',
  heartwarming: 'A tone emphasizing affection, kindness or reassurance.',
  suspenseful: 'A tone of uncertainty and anticipation.',
  'middle-grade':
    'A publishing audience category typically aimed at children around ages 8–12; not a safety rating.',
  'young-adult':
    'A publishing audience category typically aimed at teens; not a safety rating.',
  pop: 'Popular music with accessible melodic structures.',
  rock: 'Music often centered on electric guitars and a strong beat.',
  alternative:
    'A broad music category outside or alongside mainstream conventions.',
  folk: 'Music rooted in storytelling or traditional styles.',
  electronic:
    'Music built substantially with electronic instruments or production.',
  jazz: 'Music often emphasizing improvisation and rhythmic interplay.',
  'hip-hop': 'Music centered on rhythmic vocal delivery and beat production.',
  country: 'Music drawing on American country traditions.',
  classical: 'Music associated with composed classical traditions.',
  rebellion: 'Resistance against authority or an established order.',
  emotional: 'Strong emotional experiences are emphasized.',
  identity: 'Questions of who a person is or belongs with.',
  reflective: 'An introspective or contemplative tone.',
  connection: 'Relationships and interpersonal bonds.',
  hope: 'Possibility of a better future is emphasized.',
};
export const genreDescription = (tag: string) =>
  descriptions[tag] ||
  `${tag.replaceAll('-', ' ')}: a personal tag defined by the person who added it.`;
export const glossaryTags = [
  ...new Set([...Object.keys(descriptions), ...detailedTags]),
].sort();
export const parentGenre = (tag: string) =>
  Object.entries(featureGroups).find(([, children]) =>
    children.includes(tag),
  )?.[0];
export { featureKind };
