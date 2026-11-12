import {searchMedia,verifyMedia,discoverMedia,catalogApi} from '../lib/media-api.ts';
import {recommend,vector} from '../lib/recommendations.ts';
import {primaryGenre,seedTopic,specificity} from '../lib/features.ts';
import {unifiedRank} from '../lib/unified-ranking.ts';
import {compareDescriptions} from '../lib/semantic.ts';
import {writeFile} from 'node:fs/promises';
const results=await searchMedia('TV','Haikyu');
const match=results.find(x=>/haikyu/i.test(x.title));if(!match)throw Error('No verified starting title');
const seed=await verifyMedia(match);
const tags=[...new Set([seedTopic(seed),primaryGenre(seed),...seed.tags.slice().sort((a,b)=>specificity(b)-specificity(a)).slice(0,9)].filter(Boolean))];
const found=await discoverMedia(['Book'],tags,AbortSignal.timeout(60000),false,{seed});
const base=recommend(found.items,vector(seed.tags),'Book',[],primaryGenre(seed),seed);
const baseline=unifiedRank(base,seed,found.evidence);let semantic={},aiError='';
try{semantic=await compareDescriptions(catalogApi,seed,baseline.slice(0,24));}catch(e){aiError=e.message;}
const ranked=unifiedRank(base,seed,found.evidence,semantic);
const evidence={checkedAt:new Date().toISOString(),note:'Fresh live diagnostic pool, not the participant original session or final diversified UI order',seed,tags,stats:found.stats,failures:found.failures,aiError,semantic,baseline:baseline.map(x=>({id:x.id,title:x.title,score:x.score})),ranked};
await writeFile('evidence/haikyu-book-diagnostic.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify({seed:seed.title,tags,stats:found.stats,failures:found.failures,aiError,compared:Object.keys(semantic).length,top:ranked.slice(0,5).map(x=>({title:x.title,tags:x.tags,description:x.description.slice(0,400)}))},null,2));

