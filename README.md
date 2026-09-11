# Mosaic

A cross-media discovery app for CSCI 310 Junior Seminar.

## Run and publish

Node.js 22.13+ and npm are required. Run `npm ci`, then `npm run dev`.
Run `npm test`, `npm run typecheck`, and `npm run build:pages` to validate.
GitHub Actions publishes `dist/client/mosaic` to https://anonymousxbelle.github.io/mosaic/ on main pushes. GitHub Pages must use GitHub Actions as its source. The repository and Pages site are public. Provider credentials stay in Cloudflare Worker secrets.

## Latest update

Demo titles are off by default and can be enabled explicitly. Find more from live catalogs retrieves candidates from the current providers using a leading taste tag, then ranks their metadata tags. It can return no matches and is not an exhaustive catalog search.

TMDB is active for films and TV. Hardcover is connected for book search and ID verification, with Open Library and Apple search fallbacks. Book discovery uses Open Library subject queries; Hardcover metadata-field discovery is not active because live requests failed. IGDB remains inactive; games use Wikidata. Music discovery is paused. See [backend setup](backend/README.md).

## Features

- Search live catalogs with debounced autocomplete for books, films, TV, and games.
- Verify the selected record again by provider ID and category before adding; reject duplicate titles. Offline, timeout, rate-limit, and no-match states are explicit.
- Automatically extract a shared tag vocabulary from provider genres and description keywords. These are reproducible rules, not an AI model or verified statements about a work's themes. Sparse metadata can produce no tags.
- Edit tags on any title: hide inaccurate automatic/demo tags, create personal tags, and reuse tags from other titles. Personal tags accept 2–32 letters/numbers/hyphens, up to 12 per title; case and spaces normalize for consistent matching.
- Search the library by title, creator, category or tag. Personal tags immediately influence For You, Based On, explanations and the taste profile.
- Rate titles 1–5, remove ratings, and remove added titles. Up to 200 additions, ratings, and tag edits persist in this browser's localStorage.

## APIs and attribution

| Media | Provider | Metadata |
| --- | --- | --- |
| Books | Hardcover; Open Library and Apple fallbacks | Stable ID, contributors, genres, moods/themes, synopsis, available rating counts |
| Songs and albums (paused) | Apple Search / Lookup API | Existing saved music remains supported |
| TV | TMDB | Show ID, genres, keywords, summary, content ratings |
| Films | TMDB | Film ID, genres, keywords, director, content ratings |
| Games | Wikidata | Item ID, video-game classification Q7889, genres, developer |

Hardcover and TMDB queries pass through the Cloudflare backend; fallback catalog queries go directly to their providers. Tokens never reach the browser. No paid AI calls are used. Requests are abortable, cached briefly, and bounded by a timeout. Wikidata only offers directly classified game instances, so some valid titles may be absent. Catalog matching verifies existence and category; it does not guarantee metadata accuracy or comprehensive coverage. Hardcover search preserves its relevance/popularity ordering; its rating counts are catalog metadata, not Mosaic user ratings or collaborative recommendations.

[Apple API documentation](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/Searching.html), [TVmaze API and CC BY-SA terms](https://www.tvmaze.com/api), [Wikidata CC0](https://www.wikidata.org/wiki/Wikidata:Licensing). Source links are retained on imported records and shown in the interface. Demo descriptions and tags are manually authored examples.

## Recommendations

Each title is a binary vector of its effective tags: automatic/demo tags minus hidden tags, plus personal tags. Ratings 3, 4 and 5 contribute positive weights 1, 2 and 3; ratings 1–2 contribute no positive preference. The profile averages these weighted vectors. Cosine similarity compares it (or a Based On seed) with available candidates, excluding rated titles in For You and the seed in Based On. Zero matches are omitted; ties sort by title.

A shared personal tag links titles across media; use it on at least two titles for a connection. Similarity is not a probability of liking a title or a measured accuracy score. Candidate recommendations come from saved titles, optional demos, and live candidates fetched by the visitor. Explicit negative-preference modeling and recommendation-quality evaluation remain future work.

## Architecture and limits

React + TypeScript, Vinext/Vite static export, Base UI/shadcn controls. GitHub Pages serves public static files, with a separate Cloudflare catalog API. Each visitor currently has a browser-local library. Login/cloud sync code awaits Supabase configuration; shared ratings and moderation are not active. Clearing browser storage clears the library; moving from the earlier Sites URL starts separate storage. Personal tags are private to the browser, not published to GitHub or submitted to the catalog APIs.

- `lib/media-api.ts`: provider normalization, search, verification and automatic tagging.
- `lib/tags.ts`: personal-tag validation and effective features.
- `lib/library-storage.ts`: validated persistence restoration.
- `lib/recommendations.ts`: weighted profiles and cosine ranking.
- `components/media/`: accessible catalog selection and tag editing dialogs.
- `app/page.tsx`: library, ratings, filters and discovery.
- `tests/`: recommendation, provider validation and personal-tag tests.
- `.github/workflows/`: checks and Pages deployment.

Tests cover numerical ranking, wrong-type catalog records, duplicate handling, malformed storage, error responses, tag normalization and cross-media tag connections. Live search and re-verification were checked against all five media categories. Broad browser interaction testing has not been performed. Optional WebMCP rating updates are feature-detected.

## Genres, book results and accounts

The Genres tab discovers across media using catalog genre metadata. Explicit avoided genres are hidden. Low ratings reduce genre ranking conservatively; only explicit avoided genres hide a genre. A positive rating revises the inferred penalty. Unknown genres cannot be filtered reliably. Results display shared-tag counts rather than uncalibrated match percentages.

Book results sort by title/creator relevance, with available catalog rating counts breaking ties. This is not a global bestseller ranking. Recognizable standalone promotional blurbs are removed; excerpts are bounded and link to the complete source.

Optional Supabase email-code login and manual cloud library save/merge are implemented but inactive until a project, email delivery and row-level security are configured. See [account setup](backend/ACCOUNT-SETUP.md). Cloud sync has not been live-tested. The current website remains browser-local.


## Guided discovery and feedback

Discover, My Library and Preferences are separate views. Guest onboarding asks for 3–5 favorites; Add a favorite explicitly assigns 5 stars, editable in My Library. Users can start discovery with fewer favorites. Search remains backed by the current live providers, not a new recommendation engine.

Save for later, Already experienced and Not interested persist on catalog records and exclude those records from recommendations. Not interested does not block a genre or create a star rating. The last feedback action can be undone; shelves can be cleared from My Library. New candidate feedback re-verifies the record. Recommendation explanations show actual intersecting effective tags and up to two source titles. Provider artwork is optional, restricted to known HTTPS hosts, with category-icon fallbacks.

My taste collections applies a reusable personal tag to selected saved titles. Opening a collection shows saved matches, including rated titles, but excludes dismissed records and respects the content section and explicit avoided genres. A custom collection name is not an external catalog query. Remove membership using Edit tags. Tag count/format restrictions still apply. Only catalog-derived tags are selected for ordinary external discovery queries.

Track user requests and milestones in [PROJECT-BACKLOG.md](PROJECT-BACKLOG.md). Recommendation-engine next steps are in [RECOMMENDATION-PLAN.md](RECOMMENDATION-PLAN.md). Unit/type/build validation does not substitute for browser usability testing or real-account testing.

## Recommendation quality update (2026-09-10)
Books now use Open Library work search and subject queries for discovery. Existing Apple books remain readable and verifiable. Open Library requests are user-triggered, cached for ten minutes and serialized at approximately one request per second per browser. This is not a global traffic cap. Source metadata may be missing or inconsistent; no minimum tag count is imposed.

The tag vocabulary now distinguishes subgenres, themes, tone and audience labels, with an in-app glossary. Weighted cosine ranking emphasizes specific shared evidence and discounts broad labels; a greedy diversity pass reduces repeated creators and media. Users can focus a seed on up to five aspects. The weights are an initial heuristic; a controlled user study remains necessary.

TMDB keywords support more specific retrieval; unsupported tag queries return no matches instead of an unfiltered popular list. Japanese animation plus sports evidence can receive sports-anime, basketball and sports-drama tags. Refresh catalog details updates saved metadata while keeping personal ratings and edits.

Feedback and correction reports save locally and can be exported. They are not yet sent to moderators. Community rating aggregation and an RLS database schema are prepared, but Supabase, trusted catalog registration, moderation and server integration are not activated. No other readers' preferences are currently used in the live ranking.

Provider references: [Open Library API](https://openlibrary.org/developers/api), [TMDB keyword search](https://developer.themoviedb.org/reference/search-keyword), [Hardcover API](https://api.hardcover.app/), [IMDb licensed data](https://developer.imdb.com/).
