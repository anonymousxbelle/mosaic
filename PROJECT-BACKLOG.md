# Mosaic project backlog

Updated: 2026-09-08. Living record of requests and decisions from this project conversation. Keep completed requests here; update their status rather than deleting them. When revisiting Mosaic, review this file and add new “we should” ideas with date, status and acceptance criteria. Proposed work is distinguished from user requests; a proposal is not a claim of approval or completion.

## User requests and decisions

| ID | Request / decision | Status | Remaining work / acceptance |
| --- | --- | --- | --- |
| U01 | Own and host the project on GitHub | Done | Public repository and GitHub Pages under anonymousxbelle/mosaic. Public supersedes the original private preference. |
| U02 | Let people add media with autocomplete and validity checks | Implemented baseline | Validate real title/category/ID; improve catalog coverage and test the complete interaction flow. “Add media” currently means catalog records, not file uploads. |
| U03 | Use real API libraries instead of demo titles | Partial | Live Apple, TVmaze and Wikidata; demos off by default. TMDB/IGDB adapters await accounts, secrets, deployment and TMDB attribution logo. |
| U04 | Automatic actual tags, user corrections and reusable personal taste tags | Implemented baseline | Current automatic tags use deterministic keyword/genre rules. Evaluate their accuracy; separate genres, themes and moods. Personal edits are not globally shared. |
| U05 | Explore Spotify and alternatives for music | Open investigation | Choose a provider based on useful genre/mood metadata, access conditions and permitted use. Apple song/album search currently works. No Spotify integration promised or active. |
| U06 | Movies/TV/games: consider IMDb; add TMDB and IGDB | Prepared, inactive | Connect TMDB and Twitch/IGDB credentials through backend; test search, detail, discovery, quotas and failures. IMDb links prepared; no IMDb API integrated. |
| U07 | Add login | Prepared, inactive | Supabase project, email delivery, database policies and deployed configuration. Test two accounts, sign-out and cloud save/merge across devices. Current persistence is browser-local. |
| U08 | Recommend by genre across books, music and other media; respect dislikes such as nonfiction | Implemented baseline | Genre discovery, explicit exclusions and rating-based penalties exist. Validate inference quality and metadata coverage; do not infer a hard dislike from absence alone. |
| U09 | Discover genres across different media | Implemented baseline | Improve cross-media candidate retrieval and measure whether people find meaningful new connections. |
| U10 | Shorten Apple book descriptions and rank relevant/popular results better | Implemented baseline | Excerpts and promotional cleanup exist; exact-title relevance then available rating counts. Evaluate a representative query set and editions; no global popularity claim. |
| U11 | Separate explicit movies, TV and books under 18+ | Implemented baseline | Opt-in section, personal marks, Apple flags/erotica metadata, prepared TMDB ratings. Unknown ratings remain unknown. R/TV-MA are grouped by Mosaic policy, not represented as universal legal 18+ ratings. |
| U12 | Implement age verification at some point | Deferred — requested 2026-09-08 | Decide audience, regions and appropriate verification approach; assess privacy/cost; enforce through backend if verified access is required. A checkbox or date of birth alone is self-declaration. Current section is not age verification. Do not collect identity documents in Mosaic as an improvised solution. |
| U13 | Explain what was implemented, how, why, and which APIs are used | Ongoing | Every milestone reports user behavior, implementation rationale, validation and remaining limitations. |
| U14 | Keep track of all “we should” requests | Active — this file | Add new requests during project work and revisit this list at milestone planning. No background monitoring or scheduled task. |
| U15 | Focus on functionality while improving UI/UX | Ongoing | Prioritize useful discoveries, understandable controls and complete flows before decorative changes. |

## Proposed prototype roadmap (assistant recommendations, not yet implemented)

### P0 — Make the core promise demonstrably work

1. **Reliable catalog access:** activate TMDB/IGDB and select a suitable music metadata source. Normalize IDs, media format, genres, themes, rating source/region and metadata provenance. Distinguish books/editions and songs/albums. Cache and pace requests; expose actionable outages without fake results.
2. **Candidate retrieval:** replace searching one leading tag as a title query with provider-supported genre/theme discovery and/or a permitted metadata index. Fetch across multiple positive seeds; deduplicate franchises/editions and already-consumed titles. Retrieval must supply relevant candidates before ranking can improve anything.
3. **Meaningful taste model:** separate genre, mood, theme and format. Treat “fantasy” across books/films differently from arbitrary music labels; only bridge dimensions supported by metadata. Add explicit dislike and “not interested” feedback with undo. Use broad genre dislikes cautiously; explicit exclusions should reliably take precedence.
4. **Cold start and discovery loop:** first-time visitor chooses 3–5 known favorites across available media, optionally dislikes/avoided genres, then receives recommendations without an unexplained extra step. Allow skipping login. Offer a clear recovery when a catalog or recommendation set is empty.
5. **Explain and act:** each result shows source title(s), real shared evidence, medium, short synopsis and source link; actions include save for later, already experienced, not interested and refine preferences. Replace uncalibrated match percentages with transparent similarity language. Balance relevance with diversity; avoid five near-identical sequels.

### P1 — Make it feel like a dependable product

6. **Accounts and ownership:** activate optional login and reliable persistence, show save/sync state, protect each user's rows, resolve cloud/local conflicts predictably, support export and deletion. Do not lose guest work during signup. Decide how shared-device sign-out handles local data.
7. **Coherent interface:** distinguish Library, Discover and Preferences; use recognizable cover/poster art where licensed, consistent medium labels, expandable summaries, visible feedback and accessible keyboard/mobile flows. Make content section status clear. Remove obsolete links/instructions to the older Sites version.
8. **Content preferences:** audit maturity metadata coverage, refresh older saved records where possible, preserve personal marks, test section isolation in search/library/recommendations. Keep age verification separately tracked as U12; do not claim the default section is child-safe.
9. **Operational reliability:** test provider timeouts, throttling, partial failures, duplicate IDs, reloads, invalid stored data and unavailable email delivery. Complete provider attribution. Confirm no server secrets ship in the static bundle.

### P2 — Prove the seminar contribution

10. **Evaluation:** compare current keyword-cosine baseline, a popularity baseline and the improved approach on the same candidate sets. Separate retrieval failures from ranking failures. Use held-out preferences where feasible and user relevance judgments; report small-sample limitations.
11. **User study:** observe 5–8 classmates completing onboarding, finding a cross-media recommendation, explaining its connection, saving it and adjusting an unwanted recommendation. Record completion, time, confusion and perceived relevance. This is formative evidence, not population-level proof.
12. **Presentation:** prepare a reproducible walkthrough, architecture/data-flow diagram, API/provenance table, honest limitations, measured results and an explicit labeled cached demo fallback for outages. Showcase one strong connection across three media rather than an unsupported claim to understand every taste.

## Proposed acceptance targets (not achieved measurements)

- At least 4 of 5 formative testers reach recommendations without help within two minutes.
- For each test profile, return at least five eligible candidates across three media where provider coverage supports it; record empty/partial sets as failures rather than hiding them.
- Most testers identify at least two relevant or intriguing items in their first five results; compare against the same-study baseline.
- Each displayed explanation traces to actual metadata or a user's personal tag; no invented themes.
- Explicit excluded genres and known 18+ flags do not leak into their excluded recommendation sections; missing metadata is reported separately.
- Core journeys work on mobile and keyboard; retry/empty states leave a clear next action.
- Account A cannot read/write account B's library; guest import, reload and cross-device restoration preserve intended data.
- Report relevance, novelty, cross-media coverage and failure rate alongside performance; passing unit tests alone does not validate recommendation quality.

## Rationale and references

These priorities are an assessment of Mosaic's current implementation, not results from a completed usability study. The biggest gap is reliable discovery and evidence of meaningful connections, followed by onboarding and trustworthy persistence.

- [NN/g recommendation UX guidance](https://www.nngroup.com/articles/recommendation-guidelines/): understandable explanations and user feedback/control.
- [ACM RecSys evaluation session](https://recsys.acm.org/recsys21/session-3/): relevance alongside diversity, novelty and serendipity.


## 2026-09-08 — Onboarding, feedback and navigation milestone

User authorized starting roadmap items 2, 3 and 5 from the conversation (onboarding, understandable/adjustable recommendations, coherent interface). Implemented: Discover/My Library/Preferences navigation; guest favorite onboarding with explicit initial five-star rating; saved/experienced/not-interested shelves with undo; real shared-tag/source-title explanations; match percentages replaced by shared-tag counts; expandable descriptions; provider artwork when available; named personal-tag collections. Inferred dislikes now only reduce rank (15 percentage points per excess low rating, capped at 45%); only explicit genre exclusions hide a genre. Existing records without artwork retain category icons. Personal collection names stay local and are not sent as search queries. Further improvement: smoother automatic retrieval, more comprehensive metadata, usability testing, actual account activation. U12 age verification remains deferred. These changes do not activate TMDB/IGDB or replace the current keyword recommendation baseline.


## 2026-09-08 — Focus scope and TMDB readiness

User approved pausing music discovery, preserving saved music and revisiting it as a future extension. Music is removed from new-title selection, recommendation categories, positive discovery profiles and results. Existing music records, ratings and tags remain in My Library. Removed tag-as-title-query discovery fallback for unconnected providers: ordinary explicit title search still works, but genre discovery reports unsupported providers instead of misleading title matches. Proper book genre retrieval remains open. TMDB account/API access is ready per user; token has not been received or configured, and backend remains inactive. Next: Cloudflare account, secure secret entry, provider attribution, deployment and live validation. IGDB remains pending.

## Cloudflare setup checkpoint (2026-09-10)
- GitHub repository connection confirmed. Worker deployment uses backend/wrangler.jsonc from main.
- TMDB_TOKEN exists as an encrypted runtime secret. First backend build and live provider verification remain pending; frontend activation follows verification.


## TMDB activation (2026-09-10)
- Cloudflare backend deployed successfully. Live movie/TV search, record verification, genre discovery and Pages-origin CORS checks passed.
- Frontend connects through CATALOG_API_URL; token stays in the encrypted Worker secret. Official TMDB logo and endorsement notice included.
- IGDB remains inactive independently of TMDB. Games retain Wikidata title search. Books retain Apple title search; genre-based external book discovery remains pending. Music stays paused.
- Validation: 35 tests, TypeScript and production Pages build passed. Browser interaction testing remains pending.


## 2026-09-10 — Book recommendation quality and community input
- User example: liking Harry Potter should retrieve plausible related works such as Percy Jackson through supported fantasy/magic/adventure evidence. Treat as a quality benchmark, not a hardcoded recommendation or guaranteed preference.
- Evaluate Open Library work/subject search as the first book discovery source, with Google Books as optional metadata enrichment. Check coverage, identity matching, descriptions and provider usage limits before adoption.
- Separate genres from themes and audience/tone; downweight broad tags; retrieve candidates before ranking; deduplicate editions and diversify franchises.
- Requested: incorporate what people with similar interests enjoyed. Proposed hybrid content plus collaborative ranking requires consent-based shared ratings, stable work IDs, sufficient overlap and confidence thresholds. No community signal exists in the current browser-local baseline.
- Requested: bounded user ratings and recommendation suggestions. Keep existing 1–5 ratings and personal tags; propose catalog-verified title-to-title suggestions with short reasons, one editable contribution per account, rate limits, reporting and review before influencing shared recommendations. Personal tags must not silently become public metadata.
- Next implementation candidate: book subject retrieval plus richer feature mapping and evaluated ranking. This entry records requested scope; it does not implement these features.

## 2026-09-10 — Recommendation quality and metadata corrections
- Implemented Open Library work-level book search, ID verification and bounded subject-based discovery. Existing Apple records remain restorable/verifiable. Requests are cached and paced per browser; service-wide quotas may still need a proxy if usage grows.
- Added a hierarchical subgenre/theme/tone/audience vocabulary with descriptions, including sports, basketball, anime and sports drama. No minimum tag count is fabricated. TMDB supplies keywords plus animation/origin evidence. Saved items can refresh metadata without changing ratings or personal edits.
- Weighted cosine similarity downweights broad tags and emphasizes specific matches. A diversity pass reduces repeated creators/media among relevant results. Optional selected aspects focus seed discovery. These weights are heuristic, not empirically optimized.
- Added local good-match/not-for-me feedback, metadata/content-rating correction reports and saved-title similarity suggestions (280-character reason, bounded local history). Export is available. Reports do not automatically modify public metadata or change subjective ratings.
- Community schema and similarity aggregation are prepared but NOT deployed or wired to a public contribution service. User confirmed Supabase project does not exist. Trusted catalog registration, moderation service/UI, live two-account RLS verification and consent-based rating collection remain blocked on account setup; no community recommendation claims are displayed.
- Provider research: Goodreads public API is deprecated; Hardcover has a token-based API worth evaluating. No supported public Crunchyroll developer metadata API was found. IMDb richer licensed data requires separate access; TMDB remains active. Anime-specific enrichment such as Jikan requires separate evaluation and matching, not a guessed title join.
- Still pending: field-level evidence/confidence for every tag, robust franchise IDs beyond work/creator diversity, broader real-user relevance evaluation, community activation, and optional additional provider enrichment. These are not completed merely by passing unit tests.

## 2026-09-10 — Audience and content-filter proposal
- User suggested age categories/filters and requested an explanation before choosing behavior.
- Proposed distinct audience preferences (children, middle grade, teen/YA, adult, unknown) and country-specific content-rating filters. Adult audience must not imply explicit/18+ content.
- Default audience preference should softly influence ranking; offer strict audience filtering explicitly. Unknown metadata must be visible, with an option to exclude it when a strict content limit is chosen.
- Do not infer a visitor's age from favorites, or label missing ratings safe. Preserve original rating and jurisdiction rather than treating PG-13, TV-14 and other systems as identical.
- Age verification remains a separate deferred requirement. No age gate or filter implementation was added in this explanatory turn.

## 2026-09-11 — Hardcover integration and music API research
- Hardcover token configured as an encrypted Cloudflare runtime secret. Book title search and ID verification passed live checks; normalized public metadata includes genres, moods/themes, synopsis and rating counts. No account/library data is requested.
- Book discovery stays on Open Library subject queries. Hardcover metadata-field searches failed live; investigate supported discovery queries before enabling them. Never substitute genre words as title queries.
- Book search uses Hardcover with Open Library/Apple fallbacks, preserving existing saved records and personal edits. Provider rating counts are not collaborative recommendation signals.
- TODO (user requested): explore Google Music and YouTube Music APIs. Establish what official APIs are currently available, including relevant YouTube Data API capabilities; assess authentication, quotas/cost, metadata/genre quality, usage terms and whether they can support meaningful cross-media recommendations. Research only; music remains paused pending a quality plan.

## 2026-09-11 — Metadata and matching refinement
- Separate genre, subgenre, theme, mood, audience and style/format in Edit tags. Anime remains supported, with TMDB Japanese animation evidence and sports-anime/sports-drama combinations.
- Audience labels require catalog subject evidence; incidental generic sports wording in a synopsis no longer creates the sports tag. Specific sport names and provider sports labels remain usable. Existing stored metadata needs Refresh catalog details to receive provider corrections.
- Mood-only/audience-only/style-only matches receive an additional ranking penalty when a seed has substantive interests. Shared themes/subgenres lead explanations. These are heuristic weights, not validated accuracy scores.
- Collapse explicitly labeled book editions with matching creators in discovery; retain subtitles and volume numbers. Reduce repeated series using supplied Hardcover series names and TMDB film collection IDs. Unknown metadata stays unknown; no title-based franchise guesses.
- Limitations: illustrator/contributor differences can still prevent cross-provider edition matching; Open Library series metadata and cross-provider franchise identity are future work. User testing and field-level tag provenance remain pending.

## 2026-09-11 - Keep seed discoveries in their primary genre
- Based-on discovery now requires the seed's primary known genre. Fantasy seeds cannot recommend non-fantasy titles solely for friendship; focused themes still rank within fantasy. Provider genre order selects the anchor, with supported subgenres as fallback. The active genre is shown in the interface.
- Retrieval includes the anchor first, and final ranking rejects missing/nonmatching genre evidence rather than relaxing the requirement. For You and collections remain broader. Regression coverage includes friendship-only focus, fantasy subgenres and unknown genres.

## 2026-09-11 - Basketball anime first
- Based-on default All media discovery leads with the seed's media type and anime style when applicable. Diversity reranking preserves that priority; related cross-media candidates follow. Explicit media selection removes the default preference.
- Known basketball/football/baseball seed topics are required for candidates and prioritized in retrieval, even if a shared theme is focused. The interface explains the topic and media preference. Genre constraints remain in force.
- Regression test: basketball anime precedes basketball live-action/books; football anime is excluded; explicit Books returns basketball books. This does not guarantee provider coverage of every relevant anime.

## 2026-09-11 - Genre navigation polish (lower priority)
- TODO: sort the genre list consistently so genres are easier to find.
- TODO: make genre tags such as Drama clickable, opening discovery filtered to that genre.
- Priority: defer both until candidate retrieval and recommendation quality improvements. User explicitly requested backlog tracking rather than implementation now.

## 2026-09-11 - Broader, filtered candidate retrieval
- Implemented round-robin retrieval over up to three query plans, up to three pages each, stopping after a round supplies 30 eligible candidates. For anime in its own medium, the stopping target counts anime candidates. Empty/exhausted sources stop; failures preserve other results.
- Apply seed genre/topic, content section, avoided genres, saved/dismissed/experienced exclusions and shared-tag evidence before accepting external candidates. No filter relaxation to fill results.
- Open Library discovery combines core subjects with specific interests and a broader core query, 30 work records per page. Enrich up to four strongest subject matches with work descriptions/subjects, then recheck eligibility. Search ordering is provider relevance, not a global best-book claim.
- TMDB uses complete 20-row pages, AND genre/keyword queries and recommendations for a verified same-provider seed. Four concurrent detail requests enrich tags/ratings before frontend acceptance. Page/seed parameters are bounded and validated; page-specific caches prevent repeated page-one results.
- Cache up to 400 normalized catalog records for ten minutes in browser memory, reapply eligibility on reuse; cache up to 250 public TMDB responses for five minutes in the Worker. Verification bypasses the TMDB cache. This is not a persistent whole-catalog database; durable catalog storage requires separate infrastructure/provider-term review.
- UI reports examined/rejected/accepted counts, pages and cached matches. Added regression checks for sparse first pages, additional pages, alternative-source failures, deduplication, anime retrieval depth and related-page validation.
- Remaining: tune budgets with user relevance/latency measurements; broader book-related-title retrieval (Hardcover discovery remains unavailable), durable term-compliant cache, provider coverage and named-title recall benchmarks. More retrieval is not proof of globally best recommendations.

## 2026-09-11 - Recommendation research and proposed experiments
- Research report: [Recommendation systems for Mosaic](docs/recommendation-research.md). Literature review covers cross-media/cross-domain recommendation, semantic content, collaborative filtering, rank fusion, calibration, and evaluation. These are proposed experiments, not deployed features.
- Priority 1: build a judged seed/intent benchmark and record per-stage retrieval/ranking evidence; compare provider order and the current tag-cosine baseline on identical candidate pools.
- Priority 2: retain provider endpoint/query/page/rank evidence and test rank fusion, without treating repeated queries as independent votes.
- Priority 3: field-level feature provenance, confidence categories, and enrichment before final rejection of uncertain genre/topic metadata. Preserve explicit constraints.
- Priority 4: compare cleaned-description lexical matching and embeddings against the baseline; distinguish reranking gains from candidate-retrieval gains.
- Priority 5: evaluate a durable permitted metadata index, interest-specific profiles, and explicit cross-media discovery intent. Supabase is not configured yet.
- Later: consent-based shared ratings and regularized item-to-item recommendations once overlap and held-out reliability support them. Do not present provider average ratings as collaborative evidence.
- Keep existing music API research, age verification, and genre-navigation requests in their existing backlog positions. No recommendation behavior changed in this research turn.

## 2026-09-11 - First research implementation and Cloudflare AI experiment
- Implemented transient query/page/rank evidence and experimental smoothed rank fusion. Repeated queries contribute only the best provider position, preventing duplicated votes. Standard ranking remains the default pending judged evaluation.
- Based On discovery now offers standard, provider blend, and AI description blend. Genre/topic and same-medium tiers remain enforced. AI compares up to 24 already eligible candidates, not all retrieved titles or the full catalog.
- Added bounded POST semantic endpoint using Cloudflare BGE-small (384 dimensions), one-hour/500-vector in-memory cache, eight-second inference timeout, strict payload/output validation, and four uncached calls per minute per location. No model training, shared user history, or automatic AI tagging was added.
- Added comparison snapshot download, ranking evaluation runner, twelve proposed seed/intent review tasks, and explicitly unjudged synthetic example. Real relevance judgments and held-out quality gains are pending; new modes remain experimental.
- Next: gather reviewed snapshots; compare provider, standard, and AI variants; structured feature provenance and enrichment of uncertain metadata; durable permitted catalog storage. Supabase setup and collaborative recommendations remain pending.

## 2026-09-11 - Book synopsis repair
- Open Library search results contain subjects but usually no synopsis. Discovery now fetches full work records for the twelve leading tag-ranked/diversified results, up from four selected by tag count. Additional results offer a retryable Load synopsis action. Full source records can still lack descriptions.
- Freshly fetched details replace stale cached records; Hardcover verification preserves a full synopsis when the search index omits it. Placeholder text is excluded from AI comparisons on both client and server.
- A live Harry Potter retrieval check recovered descriptions for all ten leading results (twelve enriched out of eighty candidates). This checks metadata coverage, not judged recommendation quality. Sixty-eight regression tests pass.
- Remaining: review recommendation relevance with user judgments, improve book candidate coverage and series entry-point metadata, and evaluate identity-checked cross-provider enrichment. No extra ranking weights were introduced by this repair.

## 2026-09-11 - Core eligibility before ranking
- Based On requires the primary genre and a controlled defining subject when present: magic/mythology for fantasy, named sports, selected science-fiction subjects, or detective fiction. These rules apply equally across books, TV, and movies and are metadata heuristics, not title-specific exceptions.
- Fantasy + magic stays in every Open Library query; TMDB can now resolve magic as a keyword in addition to fantasy genre filtering. Related-title and cached results must also pass local eligibility. No quiet relaxation for sparse results.
- Optional Must have tags further restrict results before ranking; they remain separate from preferred aspects. These optional restrictions are local filters, not guaranteed provider-side queries. Anime remains a format within TV/movies.
- Up to eight uncertain Open Library search records per discovery receive full-record lookups before rejection. The bounded budget can still miss matches; requests may take longer. Seventy regression tests, typecheck and production build validate implementation, not subjective recommendation quality.
- Next: evaluate real seed/result judgments; broaden provider label equivalence and metadata confidence; expose a user-controlled primary genre override and provider-side optional constraints.

## 2026-09-12 - Series, metadata and story comparison
Other stories separates known same-series records; Same series displays those records instead. Unknown series are not guessed. The new default experimental story method adds up to a 30% grouped-evidence bonus (setting, premise, tone, catalog audience) and discounts explicitly identified later book volumes outside the seed series by 20%. Standard remains available for comparison. These are initial heuristics, not validated quality improvements.

Up to six leading Open Library books receive bounded Hardcover searches, merged only on normalized title and known author identity. Supplemental source links are retained. Failed requests preserve the original record; strict matching intentionally misses some alternate editions. Full descriptions are preserved and available Hardcover descriptions fill gaps. Series position comes only from explicit opening synopsis statements. Provider data can still be incomplete or inaccurate.

Use evaluation/review-sheet.csv as the human review worksheet. Capture real candidates using Download comparison snapshot; enter grades 0 irrelevant, 1 weak, 2 good, 3 strong, with a reason. No grades have been invented. Preserve development versus held-out assignments before tuning, and nominate relevant missing works separately to measure retrieval gaps. Run the evaluation script on the completed JSON snapshot: it now compares story, standard, provider and semantic methods and includes final diversified-list metrics. Snapshot candidate filtering preserves Must have eligibility and records series view. Raw snapshots should remain local pending provider redistribution review.

## Unified recommendation method (2026-09-12)
Recommended is now the default Based On method. Genre and defining topic eligibility are retained. Explicit historical/contemporary romance conflicts are excluded; other known subgenre non-overlap is a broader tier. Subgenre, setting and premise tiers precede media preference and every numeric score, including diversity. Unknown metadata is labeled separately. Within a tier, scores combine tags (60%), grouped story evidence (30%), available synopsis AI (8%) and provider rank (2%). These initial heuristics need judged evaluation. AI quota/errors fall back to local features; up to 24 eligible candidates are compared, not the full catalog.
Expanded setting/premise cues cover romance, historical periods, mysteries, heists, family secrets, political intrigue and survival. They are bounded text rules and can miss paraphrases or misread context; they are not complete story understanding. Provider queries now prioritize a known subgenre when there is no defining topic. Unsupported provider labels still rely on local comparison. The benchmark includes Recommended alongside the previous methods.
