'use client';
import {rankForPages,appendRankedBatch} from '@/lib/result-order';
import {discoveryStatus} from '@/lib/discovery-status';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {FeedbackInbox} from '@/components/media/feedback-inbox';
import {libraryShelf,matchesShelf,libraryOrder,notDismissed} from '@/lib/library-view';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import { hybridRank, type RankingEvidence, type SemanticScores } from '@/lib/hybrid-ranking';
import { compareDescriptions } from '@/lib/semantic';
import {vocabulary} from '@/lib/media-api';
import {unifiedRank} from '@/lib/unified-ranking';
import {cosineDiscovery,vocabularyFor,tasteVector} from '@/lib/cosine-discovery';
import {sameSeries, groupSeries, seriesGroupKey} from '@/lib/story-profile';
import {genreDescription} from '@/lib/genre-descriptions';
import { TitleTags } from '@/components/media/title-tags';
import { AutoSynopsis } from '@/components/media/auto-synopsis';
import { TagChoice } from '@/components/media/tag-choice';
import { taxonomy } from '@/lib/taxonomy';
import { flushSync } from 'react-dom';
import {
  BookOpen,
  Disc3,
  Gamepad2,
  Film,
  Tv,
  ArrowUpRight,
  Sparkles,
  Layers3,
  Star,
  Search,
  Settings,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { detailedFeatures, specificity, detailedTags, primaryGenre, seedTopic } from '@/lib/features';
import { GenreGuide } from '@/components/media/genre-guide';

import { inContentSection, contentLabel } from '@/lib/content-rating';
import { genrePreferences, genreAllowed } from '@/lib/genres';
import { TagEditor } from '@/components/media/tag-editor';
import { effectiveTags, normalizeTag, type TagEdits } from '@/lib/tags';
import { TasteCollections } from '@/components/media/taste-collections';
import {
  connectionEvidence,
  recommendationEligible,
} from '@/lib/discovery-feedback';
import { Account } from '@/components/media/account';
import { AddMedia } from '@/components/media/add-media';
import {
  findDuplicate,
  verifyMedia,
  discoverMedia,
  catalogApi,
  igdbEnabled,
  type CatalogMedia,
} from '@/lib/media-api';
import { restoreLibrary, STORAGE_KEY } from '@/lib/library-storage';
import {
  discoveryCategories,
  profile,
  vector,
  recommend,
  diversify,
  preferMatches,
  type Category,
  type Ratings,
  type Media,
} from '@/lib/recommendations';
const icons = {
  Book: BookOpen,
  Music: Disc3,
  Game: Gamepad2,
  Movie: Film,
  TV: Tv,
};
function MediaMark({ item }: { item: Media }) {
  const Icon = icons[item.type];
  const [failed, setFailed] = useState(false);
  return (
    <div className={'media-mark ' + item.type.toLowerCase()}>
      <>
        {item.artworkUrl && !failed ? (
          <img
            src={item.artworkUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
        ) : (
          <Icon size={24} />
        )}
      </>
    </div>
  );
}
export default function MosaicApp({reviewer=false}:{reviewer?:boolean}) {
  const [view, setView] = useState(reviewer?'library':'discover');
  const [preferencesOpen,setPreferencesOpen]=useState(false);
  const [openCollection,setOpenCollection]=useState<string|null>(null);
  const [preservedResults,setPreservedResults]=useState<{key:string;items:any[]}|null>(null);
  const [removeTarget,setRemoveTarget]=useState<Media|null>(null);
  const [rateTarget,setRateTarget]=useState<Media|null>(null);
  const [shelf, setShelf] = useState('all');
  const [actionBusy, setActionBusy] = useState(false);
  const [undo, setUndo] = useState<{
    id: string;
    previous?: CatalogMedia;
    previousRating?: number;
  } | null>(null);
  const [adultSection, setAdultSection] = useState(true);
  const [added, setAdded] = useState<CatalogMedia[]>([]);
  const [avoided, setAvoided] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<CatalogMedia[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [continuation,setContinuation]=useState<Record<string,import('@/lib/retrieval').RetrievalCursor>>({});
  const [hasMore,setHasMore]=useState(false);
  const [moreNotice,setMoreNotice]=useState('');
  const [morePrefix,setMorePrefix]=useState<{key:string;items:any[]}|null>(null);
  const [resultLimit,setResultLimit]=useState(30);
  const [resultPage,setResultPage]=useState(1);
  const [earlierMatches,setEarlierMatches]=useState<{key:string;items:Media[]}>({key:'',items:[]});
  const [discoveryNotice, setDiscoveryNotice] = useState('');
  const [discoveryFailure, setDiscoveryFailure] = useState(false);
  const [partialDiscovery, setPartialDiscovery] = useState(false);
  const [completedDiscoveryKey,setCompletedDiscoveryKey]=useState('');
  const discoveryRequest = useRef<AbortController | null>(null);
  useEffect(() => () => discoveryRequest.current?.abort(), []);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [notice, setNotice] = useState('');
  const [tagEdits, setTagEdits] = useState<TagEdits>({});
  const originals = added;
  const catalog = useMemo(
    () =>
      originals.map((item) => ({
        ...item,
        tags: effectiveTags(item, tagEdits[item.id]),
      })),
    [originals, tagEdits],
  );
  const libraryCatalog = useMemo(()=>catalog.filter(i=>i.type!=="Music" && i.type!=="Game"),[catalog]);
  const sectionCatalog = useMemo(
    () => catalog.filter((i) => i.type !== 'Music' && i.type !== 'Game' && inContentSection(i, adultSection)),
    [catalog, adultSection],
  );
  const discoveryCatalog = useMemo(
    () => sectionCatalog.filter((i) => i.type !== 'Music' && i.type !== 'Game' && notDismissed(i,sectionCatalog)),
    [sectionCatalog],
  );
  const knownTags = useMemo(
    () => [...new Set(sectionCatalog.flatMap((i) => i.tags))].sort(),
    [sectionCatalog],
  );
  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;
  const [ratings, setRatings] = useState<Ratings>({});
  const [mode, setMode] = useState('for-you');
  const [rankingMode,setRankingMode]=useState('recommended');
  const [seriesView,setSeriesView]=useState('discover');
  const [rankingEvidence,setRankingEvidence]=useState<{key:string;provider:RankingEvidence;semantic:SemanticScores}>({key:'',provider:{},semantic:{}});
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [focusTags, setFocusTags] = useState<string[]>([]);
  const [mustTags,setMustTags]=useState<string[]>([]);
  const [seed, setSeed] = useState('hunger');
  const [search, setSearch] = useState('');
  const taste = useMemo(
    () =>
      profile(
        discoveryCatalog.filter((i) => i.libraryState !== 'dismissed'),
        ratings,
      ),
    [ratings, discoveryCatalog],
  );
  const selected =
    [
      ...discoveryCatalog,
      ...candidates.filter((i) => inContentSection(i, adultSection) && notDismissed(i,catalog)),
    ].find((i) => i.id === seed) || discoveryCatalog[0];
  useEffect(() => {setFocusTags([]);setMustTags([]);setSeriesView('discover');}, [selected?.id]);
  const controlsKey=JSON.stringify([mode,mode==='based-on'?[selected?.id,selected?.description,selected?.tags,selected?.genres]:null,category,focusTags,mustTags,seriesView,adultSection,avoided,rankingMode,tagEdits]);
  const discoveryKey=JSON.stringify([mode,selected?.id,selected?.description,selected?.tags,selected?.genres,category,focusTags,mustTags,seriesView,adultSection,avoided,ratings,rankingMode,tagEdits,discoveryCatalog.map(i=>[i.id,i.libraryState,i.tags,i.genres])]);
  useEffect(()=>{
    if(preservedResults?.key===controlsKey)return;
    discoveryRequest.current?.abort();
    setDiscovering(false);
    setDiscoveryNotice('');
    setDiscoveryFailure(false);
    setPartialDiscovery(false);
    setCompletedDiscoveryKey('');
    setMorePrefix(null);setContinuation({});setHasMore(false);setResultLimit(30);setResultPage(1);setMoreNotice('');
  },[discoveryKey,rankingMode,controlsKey]);
  useEffect(() => {
    try {
      const saved = restoreLibrary(
        localStorage.getItem(STORAGE_KEY),
        [],
      );
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      setAvoided(
        Array.isArray(raw.avoided)
          ? raw.avoided.filter(
              (g: unknown) => typeof g === 'string' && !!normalizeTag(g),
            )
          : [],
      );
      try {const nav = JSON.parse(sessionStorage.getItem(reviewer?'mosaic-review-navigation':'mosaic-navigation') || '{}');
      if(['discover','library','collections'].includes(nav.view))setView(nav.view);
      if(['for-you','based-on'].includes(nav.mode))setMode(nav.mode);
      if(['all','later','experienced','dismissed'].includes(nav.shelf))setShelf(nav.shelf);
      if(['All','Book','Movie','TV'].includes(nav.category))setCategory(nav.category);
      if(typeof nav.seed==='string')setSeed(nav.seed);
      }catch{/* Navigation storage must not prevent library recovery. */}
      setAdded(saved.added);
      setRatings(saved.ratings);
      setTagEdits(saved.tagEdits);
    } catch {
      setStorageError(
        'Saved library could not be read. You can still use the app in this session.',
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, added, ratings, tagEdits, avoided }),
      );
    } catch {
      setStorageError(
        'Browser storage is unavailable or full. Changes will last for this session only.',
      );
    }
  }, [added, ratings, tagEdits, avoided, ready]);
  useEffect(()=>{if(ready)try{sessionStorage.setItem(reviewer?'mosaic-review-navigation':'mosaic-navigation',JSON.stringify({view,mode,shelf,category,seed}));}catch{/* Navigation can still work without storage. */}},[ready,reviewer,view,mode,shelf,category,seed]);
  function addItem(item: CatalogMedia, rating?:number) {
    if(selected)setSeed(selected.id);
    if(view==='discover'&&filteredResults.length)setPreservedResults({key:controlsKey,items:filteredResults});
    setUndo(null);
    if (added.length >= 200)
      throw new Error(
        'Your library has reached 200 added titles. Remove one before adding another.',
      );
    if (findDuplicate(catalog, item))
      throw new Error('This title is already in your library.');
    setAdded((old) => [item, ...old]);
    setSearch('');
    if(rating)setRatings(old=>({...old,[item.id]:rating}));
    setNotice(
      item.title + (rating ? ' added with your rating.' : ' saved in My Library for later.'),
    );
  }
  function addFavorite(item:CatalogMedia,rating?:number){addItem(item,rating);}
  async function feedback(
    item: Media,
    state: 'later' | 'experienced' | 'dismissed',
    rating?:number,
  ) {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      const previous = added.find((i) => i.id === item.id);
      const candidate = previous || candidates.find((i) => i.id === item.id);
      if (!candidate)
        throw new Error(
          'Add this title from a catalog to save feedback.',
        );
      if (!previous && added.length >= 200)
        throw new Error('Your library is full. Remove a title first.');
      const verified = previous || (await verifyMedia(candidate));
      if (!inContentSection(verified, adultSection))
        throw new Error(
          'Its content rating has changed. Search in the appropriate collection.',
        );
      if(selected)setSeed(selected.id);
      setPreservedResults({key:controlsKey,items:filteredResults});
      setAdded((old) => [
        { ...verified, libraryState: state==='later' && ratings[item.id]?'experienced':state },
        ...old.filter((i) => i.id !== item.id),
      ]);
      setUndo({ id: item.id, previous, previousRating:ratings[item.id] });
      if(rating)setRatings(old=>({...old,[item.id]:rating}));
      setNotice(
        state === 'later'
          ? 'Saved for later in My Library.'
          : state === 'experienced'
            ? 'Marked as already experienced. Rate it in My Library to refine your taste.'
            : 'Hidden from recommendations. No genre has been blocked.',
      );
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setActionBusy(false);
    }
  }
  function removeItem(id: string) {
    setUndo(null);
    setTagEdits((old) => {
      const next = { ...old };
      delete next[id];
      return next;
    });
    setAdded((old) => old.filter((i) => i.id !== id));
    setRatings((old) => {
      const next = { ...old };
      delete next[id];
      return next;
    });
    if (seed === id) setSeed('hunger');
  }
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context) return;
    const lifecycle = new AbortController();
    const tool = {
      name: 'set_media_ratings',
      description:
        'Set ratings for library titles and show For You recommendations. Ratings are saved in this browser when storage is available.',
      inputSchema: {
        type: 'object',
        properties: {
          ratings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                rating: { type: 'integer', minimum: 1, maximum: 5 },
              },
              required: ['id', 'rating'],
              additionalProperties: false,
            },
          },
        },
        required: ['ratings'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const values = (input as { ratings?: unknown })?.ratings;
        if (!Array.isArray(values) || !values.length)
          throw new Error('Provide a nonempty ratings array.');
        const update: Ratings = {};
        for (const entry of values) {
          if (
            !entry ||
            !catalogRef.current.some((i) => i.id === entry.id) ||
            !Number.isInteger(entry.rating) ||
            entry.rating < 1 ||
            entry.rating > 5
          )
            throw new Error(
              'Every rating needs a valid catalog id and integer from 1 to 5.',
            );
          update[entry.id] = entry.rating;
        }
        flushSync(() => {
          setRatings((old) => ({ ...old, ...update }));
          setMode('for-you');
        });
        return { updated: update };
      },
    };
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {
      /* Optional browser feature. */
    }
    return () => lifecycle.abort();
  }, []);
  function checkMatureCollection() {
    discoveryRequest.current?.abort();
    setDiscovering(false);
    setCandidates([]);
    setDiscoveryNotice('');
    setDiscoveryFailure(false);
    setPartialDiscovery(false);
    setNotice('');
    setAdultSection(current=>!current);
  }
  async function findConnections(more=false) {
    if(discovering)return;
    const repeat=!more && completedDiscoveryKey===discoveryKey;
    const prior=earlierMatches.key===discoveryKey?earlierMatches.items:[];
    const omit=repeat?[...prior,...filteredResults.filter(item=>!findDuplicate(prior,item))]:more?prior:[];
    if(more && hasBufferedResults){
      setMorePrefix({key:controlsKey,items:filteredResults});setPreservedResults(null);setResultLimit(n=>n+30);setCompletedDiscoveryKey(discoveryKey);
      setMoreNotice('Showing more matches from the titles already retrieved.');return;
    }
    setMoreNotice('');
    if(more){setMorePrefix({key:controlsKey,items:filteredResults});setResultLimit(n=>n+30);}
    else {setMorePrefix(null);if(!repeat)setContinuation({});setHasMore(false);setResultLimit(30);setResultPage(1);}
    setEarlierMatches({key:discoveryKey,items:omit});
    setPreservedResults(null);
    discoveryRequest.current?.abort();
    const controller = new AbortController();
    discoveryRequest.current = controller;
    setDiscovering(true);
    if(!more)setCompletedDiscoveryKey('');
    setDiscoveryNotice('');
    setDiscoveryFailure(false);
    setPartialDiscovery(false);
    const signedVocabulary=vocabularyFor(catalog);
    const signedValues=tasteVector(catalog,ratings,signedVocabulary);
    const signedQuery=Object.fromEntries(signedVocabulary.map((t,i)=>[t,signedValues[i]]));
    const query =
      mode === 'based-on'
          ? vector(
              selected?.tags || [],
            )
          : rankingMode==='cosine'?signedQuery:taste;
    const tags = Object.keys(query)
      .filter(
        (t) =>
          (query[t] > 0 &&
            originals.some((i) =>
              [
                ...i.tags,
                ...detailedFeatures(i.description, i.genres || []),
              ].includes(t),
            )),
      )
      .sort((a, b) => query[b] * specificity(b) - query[a] * specificity(a))
      .slice(0, 9);
    try {
      const found = await discoverMedia(
        category === 'All' ? [...discoveryCategories] : [category],
        mode === 'based-on' && primaryGenre(selected)
          ? [...new Set([...(seedTopic(selected) ? [seedTopic(selected)!] : []), primaryGenre(selected)!, ...tags])]
          : tags,
        controller.signal,
        adultSection,
        {seed:mode === 'based-on'?selected:undefined,cursor:more||repeat?continuation:undefined,
          accept:(item)=>(mode!=='based-on' || mustTags.every(t=>item.tags.includes(t))) && inContentSection(item,adultSection) && genreAllowed(item,[],avoided) &&
            recommendationEligible(item,ratings) && !findDuplicate(catalog,item) && !findDuplicate(omit,item) && (!more || !findDuplicate(candidates,item))},
      );
      if (controller.signal.aborted) return;
      setCandidates(previous=>more?[...previous,...found.items.filter(i=>!findDuplicate(previous,i)&&!findDuplicate(catalog,i))]:found.items.filter(i=>!findDuplicate(catalog,i)));
      setContinuation(found.cursor);setHasMore(found.hasMore);
      if(repeat)setMoreNotice(found.items.length ? 'Explored further catalog candidates; earlier result batches are omitted from this search.' : 'No fresh candidates found within this search budget. Change your filters or starting title to explore further.');
      if(more)setMoreNotice(found.items.length ? 'New matches are ranked within this batch and added after your earlier results. Earlier results stay in place.' : found.hasMore ? 'No new matches on those pages. You can try the next pages without changing your filters.' : 'No new matches found within this search budget. Try different filters to explore further.');
      setRankingEvidence(previous=>({key:discoveryKey,provider:more?{...previous.provider,...found.evidence}:found.evidence,semantic:more?previous.semantic:{}}));
      let aiNotice='';
      if(['recommended','semantic'].includes(rankingMode) && mode==='based-on' && selected){
        setDiscoveryNotice('Catalogs checked. Comparing descriptions…');
        try{
          const base=recommend(found.items,query,category,[],primaryGenre(selected),selected);
          const shortlist=(rankingMode==='recommended'?unifiedRank(base,selected,found.evidence):base).slice(0,24);
          const semantic=await compareDescriptions(catalogApi,selected,shortlist,controller.signal);
          if(controller.signal.aborted)return;
          setRankingEvidence(previous=>({key:discoveryKey,provider:more?{...previous.provider,...found.evidence}:found.evidence,semantic:more?{...previous.semantic,...semantic}:semantic}));
          aiNotice=` AI compared ${Object.keys(semantic).length} descriptions; titles without a comparison retain other ranking signals.`;
        }catch{
          if(controller.signal.aborted)return;
          aiNotice=' AI comparison was unavailable or descriptions were missing; using provider and tag matching.';
        }
      }
      setCompletedDiscoveryKey(discoveryKey);
      setPartialDiscovery(found.failures.length > 0);
      setDiscoveryFailure(found.items.length === 0 && found.failures.length > 0);
      setDiscoveryNotice(
        `Checked ${found.stats.examined} unique titles across ${found.stats.pages} catalog pages; filtered out ${found.stats.rejected}. ${found.items.length} eligible candidates (${found.stats.cached} from recent searches).${found.failures.length ? ' Some sources were unavailable: ' + found.failures.join(', ') + '.' : ''}${aiNotice} Results below are ranked within this pool, not the entire catalog.`,
      );
    } catch {
      if (!controller.signal.aborted) {
        setDiscoveryFailure(true);
        setDiscoveryNotice('Discovery could not finish. Please retry.');
      }
    } finally {
      if (!controller.signal.aborted) setDiscovering(false);
    }
  }
  const preferences = genrePreferences(discoveryCatalog, ratings);
  function downloadComparison(){
    const publicSeed=originals.find(x=>x.id===selected?.id) || candidates.find(x=>x.id===selected?.id);
    if(!publicSeed || rankingEvidence.key!==discoveryKey)return;
    const snapshot={label:'Unjudged Mosaic external-candidate snapshot',capturedAt:new Date().toISOString(),cases:[{
      id:publicSeed.id,seed:{id:publicSeed.id,title:publicSeed.title,creator:publicSeed.creator,type:publicSeed.type,
        description:publicSeed.description,tags:publicSeed.tags.filter(t=>Object.hasOwn(vocabulary,t)),genres:publicSeed.genres,seriesKey:publicSeed.seriesKey,seriesPosition:publicSeed.seriesPosition},category,requiredGenre:primaryGenre(publicSeed),
      focusTags:focusTags.length?focusTags.filter(t=>detailedTags.includes(t)):undefined,
      seriesView, candidates:candidates.filter(i=>mustTags.every(t=>i.tags.includes(t))),evidence:rankingEvidence.provider,semanticScores:rankingEvidence.semantic,judgments:{},
    }]};
    const url=URL.createObjectURL(new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='mosaic-comparison.json';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const results = recommend(
    [...catalog, ...candidates.filter((i) => !findDuplicate(catalog, i))].filter(i=>mode!=='based-on' || mustTags.every(t=>i.tags.includes(t))),
    mode === 'based-on'
          ? vector(
              selected?.tags || [],
            )
          : taste,
    category,
    mode === 'based-on'
        ? [selected?.id || seed]
        : Object.keys(ratings),
    mode === 'based-on' ? primaryGenre(selected) : undefined,
    mode === 'based-on' ? selected : undefined,
    rankingMode==='story',
  ).filter(i=>mode!=='based-on' || !selected || (seriesView==='series'?!!seriesGroupKey(selected) && seriesGroupKey(selected)===seriesGroupKey(i):!sameSeries(selected,i)));
  const rankedResults=rankingMode==='recommended' && mode==='based-on' && selected
    ?unifiedRank(results,selected,rankingEvidence.key===discoveryKey?rankingEvidence.provider:{},rankingEvidence.key===discoveryKey?rankingEvidence.semantic:{})
    :['provider','semantic'].includes(rankingMode) && mode==='based-on' && rankingEvidence.key===discoveryKey
    ?hybridRank(results,rankingEvidence.provider,rankingMode==='semantic'?rankingEvidence.semantic:{}) : results;
  const legacyResults = completedDiscoveryKey===discoveryKey && !discovering ? (
    rankForPages(groupSeries(preferMatches(rankedResults, mode==='based-on' ? focusTags : [])
      .filter((i) => i.type !== 'Music' && i.type !== 'Game')
      .filter((i) => earlierMatches.key!==discoveryKey || !findDuplicate(earlierMatches.items,i))
      .filter((i) =>
        recommendationEligible(i, ratings),
      )
      .filter((i) => inContentSection(i, adultSection))
      .filter((i) => genreAllowed(i, preferences.blocked, avoided))
      .map((i) => ({
        ...i,
        score:
          i.score *
          (1 -
            Math.max(
              0,
              ...(i.genres || []).map(
                (g) => preferences.penalties[i.type + ':' + g] || 0,
              ),
            )),
      }))
      .sort((a, b) => (a.priority || 0)-(b.priority || 0) || b.score - a.score)))

  ) : [];
  const cosineRun=cosineDiscovery([...catalog,...candidates],{mode:mode==='based-on'?'based-on':'for-you',ratings,library:catalog,seed:mode==='based-on'?selected:undefined,category});
  const calculatedResults=rankingMode==='cosine'
    ?completedDiscoveryKey===discoveryKey&&!discovering?cosineRun.results
      .filter(i=>i.type!=='Music'&&i.type!=='Game'&&inContentSection(i,adultSection)&&genreAllowed(i,[],avoided))
      .filter(i=>mode!=='based-on'||mustTags.every(t=>i.tags.includes(t)))
      .filter(i=>earlierMatches.key!==discoveryKey || !findDuplicate(earlierMatches.items,i))
      .map(i=>({...i,storyReasons:[] as string[],seriesEntries:[i]})):[]
    :morePrefix?.key===controlsKey?legacyResults:legacyResults.slice(0,resultLimit);
  const hasBufferedResults=rankingMode!=='cosine' && legacyResults.length>resultLimit;
  const batchResults=morePrefix?.key===controlsKey ? appendRankedBatch(morePrefix.items,calculatedResults,resultLimit) : calculatedResults;
  const filteredResults=(preservedResults?.key===controlsKey?preservedResults.items:batchResults).filter(item=>notDismissed(item,catalog));
  const pageCount=Math.max(1,Math.ceil(filteredResults.length/12));
  const currentPage=Math.min(resultPage,pageCount);
  const pageResults=filteredResults.slice((currentPage-1)*12,currentPage*12);
  function changeResultPage(page:number) { setResultPage(page); requestAnimationFrame(()=>document.getElementById("recommendation-results")?.scrollIntoView({block:"start"})); }
  const visible = libraryOrder(libraryCatalog,ratings)
    .filter(i=>matchesShelf(i,ratings,shelf))
    .filter((i) =>
      (i.title + ' ' + i.creator + ' ' + i.type + ' ' + i.tags.join(' '))
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <Layers3 size={30} />
          mosaic<span className="brand-dot">●</span>
        </Link>
        <span className="project-label">Your next good story starts here.</span>
        <span className="prototype">Books · Movies · TV</span>
      </header>
      <main>
        {reviewer && <aside className="reviewer-banner"><h2>Reviewer workspace</h2><p>Review AI tags and compare matching methods using your saved library. Changes remain in this browser. The AI endpoint still requires your reviewer key.</p><nav aria-label="Reviewer tools"><Link href="/">Back to Mosaic</Link><Link href="/taxonomy/">Taxonomy editor</Link><Link href="/project/">Project checklist</Link><Link href="/milestones/">Weeks 4 &amp; 6 evidence</Link><Link href="/week8/">Week 8 evidence</Link></nav></aside>}
        <div className="page-intro">
          <div>
            <p className="eyebrow">CROSS-MEDIA DISCOVERY</p>
            <h1>Find your next favorite.</h1>
          </div>
          <p>Stories that feel like your kind of thing.</p>
        </div>
        <nav className="primary-nav" aria-label="Main navigation">
          {[
            ['discover', 'Discover'],
            ['library', 'My Library'],
            ['collections', 'Collections'],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-current={view === id ? 'page' : undefined}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        {notice && (
          <div className="library-notice" role="status">
            {notice}{' '}
            {undo && (
              <button
                disabled={actionBusy}
                onClick={() => {
                  setAdded((old) =>
                    undo.previous
                      ? old.map((i) => (i.id === undo.id ? undo.previous! : i))
                      : old.filter((i) => i.id !== undo.id),
                  );
                  setRatings(old=>{const next={...old};if(undo.previousRating)next[undo.id]=undo.previousRating;else delete next[undo.id];return next;});
                  setUndo(null);
                  setNotice('Last library change undone.');
                }}
              >
                Undo library change
              </button>
            )}
          </div>
        )}
        {storageError && (
          <p className="form-error" role="alert">
            {storageError}
          </p>
        )}
        {view === 'discover' &&
          discoveryCatalog.filter(
            (i) => (ratings[i.id] || 0) >= 3 && i.libraryState !== 'dismissed',
          ).length < 3 && (
            <section className="onboarding">
              <p className="eyebrow">MAKE THIS YOURS · NO ACCOUNT NEEDED</p>
              <h2>Start with one favorite.</h2>
              <p>
                Pick a book, movie or show. Rate it when adding it, or choose “Not yet” to save it for later.
              </p>
              <ol>
                <li>
                  <strong>
                    {
                      discoveryCatalog.filter(
                        (i) =>
                          (ratings[i.id] || 0) >= 3 &&
                          i.libraryState !== 'dismissed',
                      ).length
                    }{' '}
                    favorites in your library
                  </strong>
                </li>
                <li>Ratings shape your recommendations; saved-for-later titles are bookmarks.</li>
                <li>
                  Choose “Find my next favorite” when you’re ready—one favorite can get
                  you started.
                </li>
              </ol>
              <AddMedia
                
                favorite
                items={catalog}
                adult={adultSection} onCheckMature={checkMatureCollection}
                onAdd={addFavorite}
              />

            </section>
          )}
        {view==='discover'&&<div className="discover-actions"><AddMedia inlineSearch items={catalog} adult={adultSection} onCheckMature={checkMatureCollection} onAdd={addItem} label="Add & rate a title"/><button className="preferences-button" aria-label="Open taste and preferences" onClick={()=>setPreferencesOpen(true)}><Settings size={20}/></button></div>}
        <div className="workspace focused-workspace">
          <aside className="library" hidden={view !== 'library'}>
            <div className="section-heading">
              <h2>My Library</h2><div className="library-header-meta"><button className="preferences-button" aria-label="Open taste and preferences" title="Taste and preferences" onClick={()=>setPreferencesOpen(true)}><Settings size={20}/></button>
              <span>{libraryCatalog.length} titles · {libraryCatalog.filter((i) => ratings[i.id]).length} rated</span></div>
            </div>
            <p className="muted">
              Add media from live catalogs, then rate your favorites. Your
              library and ratings are saved in this browser. All saved titles appear here, including 18+ titles.
            </p>
            <AddMedia
              
              items={catalog}
              adult={adultSection} onCheckMature={checkMatureCollection}
              onAdd={addItem}
            />
            <div className="shelf-tabs" role="group" aria-label="Library shelf">
              {[
                ['all', 'All titles'],
                ['later', 'Saved for later'],
                ['experienced', 'Already experienced'],
                ['dismissed', 'Not interested'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  aria-pressed={shelf === id}
                  onClick={() => setShelf(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            {!Object.values(tagEdits).some(edit=>edit.added.length>0)&&<p className="collection-prompt">Connect your favorites with a personal collection. <button onClick={()=>setView('collections')}>Create a collection</button></p>}
            <label className="search">
              <Search size={18} />
              <input
                aria-label="Search your library"
                placeholder="Filter by title, creator or tag"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="library-list">
              {visible.map((item,index) => (
                <article className="library-item" key={item.id}>
                  {shelf==='all' && libraryShelf(item,ratings)==='dismissed' && (index===0||libraryShelf(visible[index-1],ratings)!=='dismissed') && <h3 className="dismissed-heading">Not interested</h3>}
                  <MediaMark item={item} />
                  <div>
                    <span className="type-label">{item.type}</span>
                    <p className="muted">{contentLabel(item)}</p>
                    <h3>{item.title}</h3>
                    <p className="library-creator">{item.creator}</p><AutoSynopsis item={item} previewLength={180}/><TitleTags item={item}/>
                    <p className="muted">{libraryShelf(item,ratings)==='later'?'Saved for later':libraryShelf(item,ratings)==='experienced'?'Already experienced':'Not interested'}</p>
                    {libraryShelf(item,ratings)==='dismissed'&&<button className="edit-tags" onClick={()=>setAdded(old=>old.map(x=>x.id===item.id?{...x,libraryState:ratings[item.id]?'experienced':'later'}:x))}>Restore to library</button>}
                    <button
                      className="edit-tags"
                      disabled={!notDismissed(item,catalog)}
                      onClick={() => {
                        if (item.type === 'Music') return;
                        setSeed(item.id);
                        setMode('based-on');
                        setView('discover');
                      }}
                    >
                      {item.type === 'Music'
                        ? 'Music discovery paused'
                        : 'More like this'}
                    </button>
                    {added.some((x) => x.id === item.id) && (
                      <button
                        className="remove-added"
                        aria-label={'Remove ' + item.title + ' from library'}
                        onClick={() => setRemoveTarget(item)}
                      >
                        Remove title
                      </button>
                    )}
                    {added.some((x) => x.id === item.id) &&
                      ['Book', 'Movie', 'TV'].includes(item.type) &&
                      !item.adult && (
                        <button
                          className="edit-tags"
                          onClick={() =>
                            setAdded((old) =>
                              old.map((x) =>
                                x.id === item.id
                                  ? { ...x, adultMarked: !x.adultMarked }
                                  : x,
                              ),
                            )
                          }
                        >
                          {item.adultMarked
                            ? 'Undo my 18+ mark'
                            : 'Mark as 18+'}
                        </button>
                      )}
                    <TagEditor
                      reviewer={reviewer}
                      item={originals.find((x) => x.id === item.id)!}
                      edit={tagEdits[item.id] || { added: [], hidden: [] }}
                      known={knownTags}
                      onChange={(edit) =>
                        setTagEdits((old) => ({ ...old, [item.id]: edit }))
                      }
                    />
                    <div
                      className="rating"
                      role="group"
                      aria-label={'Rate ' + item.title}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          aria-label={n + ' stars for ' + item.title}
                          aria-pressed={ratings[item.id] === n}
                          onClick={() =>
                            {setRatings((old) => ({ ...old, [item.id]: n }));setAdded(old=>old.map(x=>x.id===item.id?{...x,libraryState:'experienced'}:x));setNotice(`${item.title} rated ${n} stars. It is now in Already experienced, not Saved for later.`);}
                          }
                        >
                          <Star
                            size={17}
                            fill={
                              (ratings[item.id] || 0) >= n
                                ? 'currentColor'
                                : 'none'
                            }
                          />
                        </button>
                      ))}
                      {ratings[item.id] && (
                        <button
                          className="remove"
                          aria-label={'Remove rating for ' + item.title}
                          onClick={() =>
                            setRatings((old) => {
                              const next = { ...old };
                              delete next[item.id];
                              return next;
                            })
                          }
                        >
                          ×
                        </button>
                      )}
                    </div>  
                    {added.some((x) => x.id === item.id) && (
                      <button
                        type="button"
                        className="edit-tags refresh-catalog-button"
                        disabled={actionBusy}
                        onClick={async () => {
                          const original = added.find((x) => x.id === item.id);
                          if (!original) return;
                    
                          setActionBusy(true);
                    
                          try {
                            const fresh = await verifyMedia(original);
                    
                            setAdded((old) =>
                              old.map((x) =>
                                x.id === fresh.id
                                  ? {
                                      ...fresh,
                                      libraryState: x.libraryState,
                                      adultMarked: x.adultMarked,
                                    }
                                  : x
                              )
                            );
                    
                            setNotice(
                              'Catalog details refreshed. Your rating and personal tags are preserved.'
                            );
                          } catch (error) {
                            setNotice(
                              error instanceof Error
                                ? error.message
                                : 'Could not refresh details.'
                            );
                          } finally {
                            setActionBusy(false);
                          }
                        }}
                      >
                        Refresh catalog details
                      </button>
                    )}

                  </div>
                </article>
              ))}
              {!visible.length && (
                <p className="muted">
                  {search ? 'No titles match your search. Try another title, creator or tag.' : shelf==='later' ? 'Nothing saved for later yet. Save a discovery to My Library to find it here.' : shelf==='experienced' ? 'No rated or experienced titles here yet. Add and rate something you have read or watched.' : shelf==='dismissed' ? 'No titles marked Not interested. Titles you hide from recommendations appear here.' : 'Your library is empty. Add a title you know, or save a discovery for later.'}
                </p>
              )}
            </div>

          </aside>
          <section className="discovery" hidden={view !== 'discover'}>
            <Tabs value={mode} onValueChange={(v) => setMode(String(v))}>
              <div className="discovery-toolbar">
                <TabsList className="mode-tabs">
                  <TabsTrigger value="for-you">
                    <Sparkles size={16} />
                    For You
                  </TabsTrigger>
                  <TabsTrigger value="based-on">
                    <Layers3 size={16} />
                    Based On
                  </TabsTrigger>
                </TabsList>
                <Select
                  value={category}
                  onValueChange={(v) => {
                    if (v) setCategory(v as Category | 'All');
                  }}
                >
                  <SelectTrigger
                    aria-label="Recommendation media type"
                    className="category-select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['All', ...discoveryCategories].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c === 'All' ? 'All media' : c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <TabsContent value="for-you">
                <div className="context">
                  <p className="eyebrow">FOR YOU · YOUR COMBINED TASTE</p>
                  <h2>Your taste. New possibilities.</h2>
                  <p>
                    {rankingMode==='cosine'?'Your complete signed profile: high ratings add features, low ratings subtract them, and 3 stars are neutral.':'Recommendations combine the books, movies and shows you rate 3 stars or higher.'}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="based-on">
                <div className="context">
                  <p className="eyebrow">BASED ON · ONE TITLE YOU CHOOSE</p>
                  <h2>{selected ? `Find stories like ${selected.title}` : 'Choose a title to find similar stories'}</h2><p>Recommendations will be based on this title’s genre, setting and story details.</p>
                  <Select
                    value={seed}
                    onValueChange={(v) => {
                      if (v) setSeed(v);
                    }}
                  >
                    <SelectTrigger
                      aria-label="Starting media item"
                      className="seed-select"
                    >
                      <SelectValue>
                        {selected
                          ? selected.title + ' · ' + selected.type
                          : 'Add a title to begin'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {discoveryCatalog.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.title} · {i.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selected && (
                  <details className="refine-panel">
                    <summary>Refine your matches <span>{mustTags.length + focusTags.length ? `${mustTags.length + focusTags.length} selected` : 'Optional'}</span></summary>
                  <fieldset className="match-requirements" disabled={discovering}>
                    <legend>What would you like to keep?</legend>
                    <p>Mosaic already compares the genre, setting and story. Use these choices to tell us which details matter most to you.</p>
                    <div className="matching-baseline">
                      {primaryGenre(selected) && <p><strong>Genre:</strong> staying within {primaryGenre(selected)!.replaceAll('-', ' ')}.</p>}
                      {seedTopic(selected) && <p><strong>Topic:</strong> keeping {seedTopic(selected)}.</p>}
                      {category === 'All' && <p>Your starting title’s media type{selected.tags.includes('anime') ? ' and anime matches' : ''} comes first. Use the media filter above to explore books, movies or TV specifically.</p>}
                    </div>
                    {selected.seriesKey && <fieldset className="series-choice">
                      <legend>Stay in this series or discover another story?</legend>
                      <p>The catalog identifies this title as part of a series or collection.</p>
                      <label><input type="radio" name="series-view" value="discover" checked={seriesView==='discover'} onChange={()=>setSeriesView('discover')} /><span><strong>Discover other stories</strong><small>Find similar works outside this known series or collection.</small></span></label>
                      <label><input type="radio" name="series-view" value="series" checked={seriesView==='series'} onChange={()=>setSeriesView('series')} /><span><strong>Volumes & sequels in this series</strong><small>Show catalog-linked volumes or sequels in the same medium and format. Adaptations are separate works. This does not browse TV seasons or episodes.</small></span></label>
                      <p>Series details can be incomplete: other stories may include entries whose series is unknown, and same-series results may be empty.</p>
                    </fieldset>}
                    <div className="requirement-help" id="requirement-help">
                      <p><strong>Automatic:</strong> let Mosaic weigh this detail normally.</p>
                      <p><strong>Prefer:</strong> move matching titles higher without excluding other candidates.</p>
                      <p><strong>Require:</strong> only show titles tagged with this detail. Every requirement must match, so missing tags can hide otherwise good choices.</p>
                    </div>
                    <div className="requirement-heading"><p>{focusTags.length}/5 preferred · {mustTags.length}/5 required</p><button type="button" disabled={!focusTags.length && !mustTags.length} onClick={()=>{setFocusTags([]);setMustTags([]);}}>Reset tag choices</button></div>
                    <TagChoice label="Include · required for this search" selected={mustTags} onChange={setMustTags} limit={5} suggestions={[...selected.tags,...Object.keys(taxonomy).filter(t=>!taxonomy[t].retired)]}/>
                    <div className="requirement-list">
                      {[...new Set([...selected.tags,...mustTags,...focusTags])].filter(t=>t!==primaryGenre(selected) && t!==seedTopic(selected)).map(t=><label className="requirement-row" key={t}>
                        <span><strong>{t.replaceAll('-', ' ')}</strong><small>{genreDescription(t)}</small></span>
                        <select aria-label={'Matching preference for '+t.replaceAll('-', ' ')} aria-describedby="requirement-help" value={mustTags.includes(t)?'require':focusTags.includes(t)?'prefer':'auto'} onChange={e=>{
                          const value=e.target.value;
                          setFocusTags(v=>value==='prefer'?[...v.filter(x=>x!==t),t]:v.filter(x=>x!==t));
                          setMustTags(v=>value==='require'?[...v.filter(x=>x!==t),t]:v.filter(x=>x!==t));
                        }}>
                          <option value="auto">Automatic</option>
                          <option value="prefer" disabled={focusTags.length>=5 && !focusTags.includes(t)}>Prefer</option>
                          <option value="require" disabled={mustTags.length>=5 && !mustTags.includes(t)}>Require</option>
                        </select>
                      </label>)}
                    </div>
                    <p>Choose up to five preferences and five requirements. Then select “Find my next favorite” to search with your choices. If there are too few results, change a requirement to Prefer.</p>
                  </fieldset>
                  </details>
                )}
              </TabsContent>
            </Tabs>
            {reviewer && <details className="advanced-panel"><summary>Compare recommendation methods</summary><label>
              Recommendation method{' '}
              <select value={rankingMode} onChange={e=>setRankingMode(e.target.value)} disabled={discovering}>
                <option value="recommended">Recommended: core story match + AI + providers</option>
                <option value="cosine">Week 8: signed taste profile + pure cosine</option>
                <option value="story">Story characteristics + tags (experimental)</option>
                <option value="standard">Standard tag matching</option>
                <option value="provider">Provider + tags (experimental)</option>
                <option value="semantic">AI descriptions + provider + tags (experimental)</option>
              </select>
              {['recommended','semantic'].includes(rankingMode) && <p>Show discoveries compares up to 24 candidate descriptions with Cloudflare AI. Ratings and personal tags are not sent. Genre and topic filters stay in place.</p>}
              {rankingMode==='cosine'&&<p>5/4/3/2/1 stars contribute +2/+1/0/−1/−2. Scores alone determine order; AI, Prefer boosts, series grouping and variety do not reorder results. Already saved titles are excluded. Catalog retrieval and explicit content/category requirements still limit the candidate pool.</p>}
              {rankingMode==='cosine'&&<p><Link href="/week8/">Open the Week 8 course demonstration and vector evidence</Link></p>}
            </label></details>}
            <button
              className="add-media-button"
              disabled={
                discovering ||
                !(mode === 'based-on'
                    ? selected?.tags.length || 0
                    : rankingMode==='cosine'?cosineRun.hasPositiveSignal:Object.values(taste).some((v) => v > 0))
              }
              onClick={()=>findConnections()}
            >
              {discovering
                ? 'Searching catalogs…'
                : 'Find my next favorite'}
            </button>
            {rankingMode==='cosine'&&mode!=='based-on'&&!cosineRun.hasPositiveSignal&&<p role="status">Rate a title 4 or 5 stars to build a positive taste profile. Neutral, negative or cancelling ratings alone do not generate personalized results.</p>}
            {discoveryNotice && (
              <div className="search-status"><p role="status">{discoveryStatus({loading:discovering,failed:discoveryFailure,partial:partialDiscovery,count:filteredResults.length})}</p>{reviewer && <details><summary>Search details</summary><p>{discoveryNotice}</p></details>}</div>
            )}
            {reviewer && mode==='based-on' && candidates.length>0 && completedDiscoveryKey===discoveryKey && rankingEvidence.key===discoveryKey && !discovering &&
              <details className="advanced-panel"><summary>Evaluate these recommendations</summary><p>Export this result set to compare recommendation methods.</p><button onClick={downloadComparison}>Download comparison snapshot</button></details>}
            <div className="results-heading">
              <h2>
                {mode === 'based-on'
                  ? 'Connected discoveries'
                  : 'Your discoveries'}
              </h2>
              <span aria-live="polite">
                {filteredResults.length} connections
              </span>
            </div>
            {!filteredResults.length ? (
              <div className={"empty-state"+(discovering?" is-discovering":"")}>
                <Sparkles className="connection-spark" size={32} />
                <h3>
                  {discovering
                    ? 'Looking for connections…'
                    : discoveryFailure ? 'We could not finish this search.'
                    : completedDiscoveryKey!==discoveryKey && selected ? 'Ready for a fresh search.' : 'Your next favorite is waiting.'}
                </h3>
                <p>
                  {discovering ? 'Finding recommendations for your current choices.' : discoveryFailure ? 'Your library is safe. Retry using Find my next favorite above, or come back shortly.' : selected && completedDiscoveryKey!==discoveryKey
                    ? 'Select “Find my next favorite” to get recommendations for these choices. Previous results are hidden when you change your starting title or matching settings.'
                    : selected ? 'No matches found with these choices. Try changing a requirement to Prefer, or choose a different starting title.' : 'Add something you love to your library, then find more like it.'}
                </p>

                <button
                  className="edit-tags"
                  onClick={() => setView('library')}
                >
                  Add or rate titles in My Library
                </button>
              </div>
            ) : (
              <div className="results" id="recommendation-results">
                {pageResults.map((item, index) => (
                  <article className="result-card" data-media-type={item.type} key={item.id}>
                    <div className="card-top">
                      <span className="rank">
                        {String((currentPage-1)*12 + index + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={'category-badge ' + item.type.toLowerCase()}
                      >
                        {item.type}
                      </span>
                      <span className="match">
                        {item.sharedTags.length} shared{' '}
                        {item.sharedTags.length === 1 ? 'tag' : 'tags'}
                      </span>
                    </div>
                    <p className="muted">{contentLabel(item)}</p>
                    {reviewer && rankingMode==='cosine'&&<p>Cosine similarity: {item.score.toFixed(6)} · sorted highest first</p>}
                    <MediaMark item={item} />
                    <h3>{item.title}</h3>

                    <p className="creator">{item.creator}</p>


                    {[...added, ...candidates].find((x) => x.id === item.id)
                      ?.imdbUrl && (
                      <a
                        className="source-link"
                        href={
                          [...added, ...candidates].find(
                            (x) => x.id === item.id,
                          )!.imdbUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        View on IMDb
                      </a>
                    )}
                    {'compatibilityNote' in item && typeof item.compatibilityNote==='string' && <p className="match-context">{item.compatibilityNote}</p>}
                    {item.seriesPosition && <p>Volume / book {item.seriesPosition} · earliest available matching entry shown</p>}
                    {item.tags.includes('donghua') && <p>Chinese animation (donghua){selected?.tags.includes('anime') ? ' · broader animation match, not Japanese anime' : ''}</p>}
                    {item.seriesKey && item.seriesEntries.some((entry:any)=>entry.id!==item.id) && <details className="series-entries"><summary>Other volumes & sequels</summary>
                      <p>Other entries found in this series:</p>
                      <ul>{item.seriesEntries.filter((entry:any)=>entry.id!==item.id).map((entry:any)=><li key={entry.id}><a href={entry.sourceUrl} target="_blank" rel="noreferrer">{entry.seriesPosition ? `#${entry.seriesPosition} · ` : ''}{entry.title}</a><button disabled={actionBusy} onClick={()=>setRateTarget(entry)}>Rate this entry</button><button disabled={actionBusy} onClick={()=>feedback(entry,'later')}>Save to library · for later</button></li>)}</ul>
                    </details>}
                    {'storyReasons' in item && Array.isArray(item.storyReasons) && item.storyReasons.length>0 && <p>Story connections: {item.storyReasons.join('; ')}</p>}
                    {'metadataSourceUrl' in item && typeof item.metadataSourceUrl==='string' && <a href={item.metadataSourceUrl} target="_blank" rel="noreferrer">Additional book metadata: Hardcover</a>}
                    <AutoSynopsis item={item} /><TitleTags item={item}/>
                    {added.some(x=>x.id===item.id)&&<p className="saved-result-status">{added.find(x=>x.id===item.id)?.libraryState==='dismissed'?'Marked Not interested':ratings[item.id]?`In My Library · ${ratings[item.id]} stars`:'Saved in My Library'}</p>}
                    <div className="result-actions">
                      {[...added, ...candidates].some(
                        (x) => x.id === item.id,
                      ) && (
                        <>
                          <button
                            disabled={actionBusy}
                            onClick={() => feedback(item, 'later')}
                          >
                            Save to library · for later
                          </button>
                          <button
                            disabled={actionBusy}
                            onClick={() => setRateTarget(item)}
                          >
                            Read or watched? Rate it
                          </button>
                          <button
                            disabled={actionBusy}
                            onClick={() => feedback(item, 'dismissed')}
                          >
                            Not interested
                          </button>
                        </>
                      )}
                      <button
                        disabled={actionBusy}
                        onClick={() => {
                          setSeed(item.id);
                          setMode('based-on');
                        }}
                      >
                        {item.type === 'Music'
                          ? 'Music discovery paused'
                          : 'More like this'}
                      </button>
                    </div>
                    {undo?.id===item.id && <p className="form-message" role="status">{notice}</p>}
                    <details className="connection"><summary>Why this matches</summary>
                      <p>{mode==='based-on'&&selected?`Similar to “${selected.title}” in: `:'Shares these details with your rated favorites: '}{item.sharedTags.map((t:string)=>t.replaceAll('-',' ')).join(', ') || 'No shared tags are confirmed yet.'}</p>
                      {reviewer && <details><summary>Scoring evidence · {item.sharedTags.length} shared tags</summary>
                        <p>All shared tags: {item.sharedTags.join(' · ')}. {rankingMode==='cosine'?'These features have positive contributions to the cosine dot product. Profile weights and vector lengths determine the score.':'This count is not the ranking score: specific story matches carry more weight than broad labels.'}</p>
                        {rankingMode==='cosine'&&<p>Negative feature contributions: {cosineRun.results.find(x=>x.id===item.id)?.contributions.filter(x=>x.contribution<0).map(x=>x.feature).join(' · ')||'None'}.</p>}
                        {mode==='based-on' && <p>Core era, setting, subgenre and premise compatibility comes first in Recommended mode. Prefer choices and variety among similar results can also change the order.</p>}
                        {'rankingDetails' in item && <p>Missing story details reduce the evidence for a close match. AI and provider scores, when available, have only a small influence.</p>}
                      </details>}
                      {reviewer && rankingMode!=='cosine'&&connectionEvidence(
                        item,
                        mode === 'based-on'
                          ? selected
                            ? [selected]
                            : []
                          : discoveryCatalog.filter(
                                (i) =>
                                  (ratings[i.id] || 0) >= 3 &&
                                  i.libraryState !== 'dismissed',
                              ),
                      ).map((e) => (
                        <p key={e.title}>
                          Connected to “{e.title}” through{' '}
                          {e.tags.slice(0, 3).join(', ')}.
                        </p>
                      ))}

                    </details>
                    <details className="card-details"><summary>Details & feedback</summary>
                    {reviewer && !!item.sourceGenreLabels?.length && <div><p><strong>Original catalog labels:</strong> {item.sourceGenreLabels.join(' · ')}</p><p>Combined shelves such as “Action & Adventure” or “Mystery / Thriller” do not establish each tag individually. Mosaic uses more specific labels or synopsis evidence; without that evidence, the genre stays unconfirmed.</p></div>}
                    {[...added, ...candidates].find(
                      (x) => x.id === item.id,
                    ) && (
                      <a
                        className="source-link"
                        href={
                          [...added, ...candidates].find(
                            (x) => x.id === item.id,
                          )!.sourceUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        Source:{' '}
                        {
                          [...added, ...candidates].find(
                            (x) => x.id === item.id,
                          )!.provider
                        }
                      </a>
                    )}
                    </details>
                  </article>
                ))}
              </div>
            )}
            {filteredResults.length>0 && <nav className="result-pagination" aria-label="Recommendation pages"><button type="button" className="result-page-button" aria-label="Previous page" disabled={currentPage===1} onClick={()=>changeResultPage(currentPage-1)}>‹</button>{Array.from({length:pageCount},(_,i)=>i+1).map(page=><button type="button" className="result-page-button" key={page} aria-label={`Page ${page}`} aria-current={page===currentPage?"page":undefined} onClick={()=>changeResultPage(page)}>{page}</button>)}<button type="button" className="result-page-button" aria-label="Next page" disabled={currentPage===pageCount} onClick={()=>changeResultPage(currentPage+1)}>›</button></nav>}
            <div className="more-discoveries" aria-live="polite">{moreNotice && <p>{moreNotice}</p>}{currentPage===pageCount && (completedDiscoveryKey===discoveryKey || preservedResults?.key===controlsKey) && (hasMore || hasBufferedResults ? <button type="button" className="add-media-button" disabled={discovering} onClick={()=>findConnections(true)}>{discovering ? 'Finding more…' : 'Find more recommendations'}</button> : !discovering && <p>You have reached the end of this search batch. Try different filters or a starting title to explore more. This is not the entire catalog.</p>)}</div>
            <details className="advanced-panel"><summary>About your recommendations</summary><p className="data-note">
              You have {sectionCatalog.length} titles in this content section{added.length!==sectionCatalog.length ? ` (${added.length} stored in total, including other content sections or unsupported media)` : ''}. Mosaic searches live catalogs for candidates and compares their story details with your favorites. It does not compare every title in every catalog. Match explanations describe similarities—not a guarantee that you will enjoy a title. You can correct tags from My Library.
            </p></details>
          </section>
        </div>
        <section className="collections-screen" hidden={view!=='collections'}><h2>My taste collections</h2><p>Group titles around a connection you care about, across books, movies and TV.</p>
            <TasteCollections
              items={libraryCatalog.filter((i) =>
                added.some((x) => x.id === i.id),
              )}
              edits={tagEdits}
              onChange={setTagEdits}
              onExplore={(tag) => {
                setOpenCollection(tag);
              }}
            />
        </section>
        <Dialog open={!!openCollection} onOpenChange={open=>{if(!open)setOpenCollection(null);}}><DialogContent className="add-media-dialog collection-dialog"><DialogTitle>{openCollection?.replaceAll('-',' ')}</DialogTitle><DialogDescription>Your saved titles in this collection. Ratings and changes are shared with My Library.</DialogDescription><div className="collection-cards">{libraryOrder(libraryCatalog,ratings).filter(item=>openCollection && tagEdits[item.id]?.added.includes(openCollection)).map(item=><article className="result-card" data-media-type={item.type} key={item.id}>
          <span className={'category-badge '+item.type.toLowerCase()}>{item.type}</span><MediaMark item={item}/><h3>{item.title}</h3><p className="library-creator">{item.creator}</p><AutoSynopsis item={item} previewLength={180}/><TitleTags item={item}/><p className="muted">{contentLabel(item)}</p><p>{ratings[item.id]?`${ratings[item.id]} stars · `:''}{libraryShelf(item,ratings)==='dismissed'?'Not interested':libraryShelf(item,ratings)==='later'?'Saved for later':'Already experienced'}</p><div className="result-actions"><button onClick={()=>setRateTarget(item)}>Rate title</button><button disabled={!notDismissed(item,catalog)} onClick={()=>{setSeed(item.id);setMode('based-on');setView('discover');setOpenCollection(null);}}>Find similar titles</button></div>
        </article>)}</div></DialogContent></Dialog>
        <Dialog open={!!removeTarget} onOpenChange={open=>{if(!open)setRemoveTarget(null);}}><DialogContent className="add-media-dialog"><DialogTitle>Remove {removeTarget?.title}?</DialogTitle><DialogDescription>This removes the title, its star rating, personal tags and AI review history from this browser’s library. It may appear in recommendations again. This does not change the catalog.</DialogDescription><div className="result-actions"><button onClick={()=>setRemoveTarget(null)}>Keep title</button><button className="destructive" onClick={()=>{if(removeTarget)removeItem(removeTarget.id);setRemoveTarget(null);}}>Remove from library</button></div></DialogContent></Dialog>
        <Dialog open={!!rateTarget} onOpenChange={open=>{if(!open)setRateTarget(null);}}><DialogContent className="add-media-dialog"><DialogTitle>Rate {rateTarget?.title}</DialogTitle><DialogDescription>Your rating shapes your taste profile. If you haven’t read or watched it, save it for later instead.</DialogDescription><div className="rating-choices">{[1,2,3,4,5].map(n=><button disabled={actionBusy} key={n} onClick={()=>{if(rateTarget)void feedback(rateTarget,'experienced',n);setRateTarget(null);}}>{n} ★</button>)}<button disabled={actionBusy} onClick={()=>{if(rateTarget)void feedback(rateTarget,'later');setRateTarget(null);}}>Save to library · for later</button></div></DialogContent></Dialog>
<Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}><DialogContent className="add-media-dialog preferences-screen"><DialogTitle>Your taste & preferences</DialogTitle><DialogDescription>Manage exclusions and your browser-saved library.</DialogDescription>
          <Account
            library={{ version: 1, added, ratings, tagEdits, avoided }}
            onLoad={(value) => {
              const restored = restoreLibrary(
                JSON.stringify(value),
                [],
              );
              const merged = [...added];
              for (const item of restored.added) {
                if (merged.length < 200 && !findDuplicate(merged, item))
                  merged.push(item);
              }
              setAdded(merged);
              setRatings((old) => ({ ...restored.ratings, ...old }));
              setTagEdits((old) => ({ ...restored.tagEdits, ...old }));
              const raw = value as { avoided?: unknown };
              if (Array.isArray(raw?.avoided))
                setAvoided((old) =>
                  [...new Set([...old, ...(raw.avoided as string[])])].filter(
                    (g) => typeof g === 'string' && !!normalizeTag(g),
                  ),
                );
            }}
          />
          <details className="genre-preferences">
            <summary>Exclude from recommendations</summary>
            <p>These exclusions apply to every search and stay saved in this browser. Ratings shape your taste without hiding an entire genre. To include something for just one search, use Based On → Refine your matches.</p>
            <TagChoice label="Exclude" selected={avoided} onChange={setAvoided} suggestions={Object.keys(taxonomy).filter(t=>!taxonomy[t].retired && (!taxonomy[t].media?.length || taxonomy[t].media!.some(m=>['Book','Movie','TV'].includes(m))))}/>
          </details>
        </DialogContent></Dialog>
        <section className="taste-section" hidden={view !== 'library'}>
          <div>
            <p className="eyebrow">YOUR TASTE, TAKING SHAPE</p>
            <h2>The threads that connect your favorites.</h2>
          </div>
          <div className="taste-tags">
            {Object.entries(taste)
              .filter(([, v]) => v > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([tag, v]) => (
                <span key={tag}>
                  {tag}
                  {reviewer && <b>{Math.round(v * 100)}%</b>}
                </span>
              ))}
            {!Object.values(taste).some((v) => v > 0) && (
              <p className="muted">
                Your strongest themes will appear as you rate titles.
              </p>
            )}
          </div>
        </section>
        {reviewer&&<FeedbackInbox/>}
        <GenreGuide reviewer={reviewer} />
        <footer>
          <span>{reviewer?'mosaic / CSCI 310 Junior Seminar':'mosaic · stories connected'}</span>
          {catalogApi && (
            <span>
              <a
                href="https://www.themoviedb.org"
                aria-label="Movie and TV data from TMDB"
              >
                <img
                  src="https://www.themoviedb.org/assets/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
                  alt="TMDB"
                  width="90"
                  style={{
                    display: 'inline-block',
                    height: 'auto',
                    marginRight: 12,
                  }}
                />
              </a>
              {igdbEnabled && (
                <>
                  <a href="https://www.igdb.com">IGDB</a>.{' '}
                </>
              )}
              This product uses the TMDB API but is not endorsed or certified by
              TMDB.
            </span>
          )}
          <span>
            Catalog data: <a href="https://hardcover.app">Hardcover</a> ·{' '}
            <a href="https://openlibrary.org">Open Library</a> ·{' '}
            <a
              href="https://www.apple.com/itunes/"
              target="_blank"
              rel="noreferrer"
            >
              Apple
            </a>{' '}
            ·{' '}
            <a
              href="https://www.tvmaze.com/api"
              target="_blank"
              rel="noreferrer"
            >
              TVmaze (CC BY-SA)
            </a>{' '}
            ·{' '}
            <a
              href="https://www.wikidata.org/wiki/Wikidata:Licensing"
              target="_blank"
              rel="noreferrer"
            >
              Wikidata (CC0)
            </a>
          </span>
        </footer>
      </main>
    </div>
  );
}


