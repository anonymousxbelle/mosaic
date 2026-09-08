# Mosaic

A cross-media discovery app for CSCI 310 Junior Seminar.

## Run and publish

Node.js 22.13+ and npm are required. Run `npm ci`, then `npm run dev`.
Run `npm test`, `npm run typecheck`, and `npm run build:pages` to validate.
GitHub Actions publishes `dist/client/mosaic` to https://anonymousxbelle.github.io/mosaic/ on main pushes. GitHub Pages must use GitHub Actions as its source. The repository and Pages site are public. No API keys are needed.

## Latest update

Demo titles are off by default and can be enabled explicitly. Find more from live catalogs retrieves candidates from the current providers using a leading taste tag, then ranks their metadata tags. It can return no matches and is not an exhaustive catalog search.

TMDB and IGDB server adapters, IMDb links and genre/theme discovery are implemented but **not activated**. Developer credentials and a backend deployment are still needed. See [backend setup](backend/README.md). The live site continues to use the original providers.

## Features

- Search live catalogs with debounced autocomplete for books, songs/albums, films, TV, and games.
- Verify the selected record again by provider ID and category before adding; reject duplicate titles. Offline, timeout, rate-limit, and no-match states are explicit.
- Automatically extract a shared tag vocabulary from provider genres and description keywords. These are reproducible rules, not an AI model or verified statements about a work's themes. Sparse metadata can produce no tags.
- Edit tags on any title: hide inaccurate automatic/demo tags, create personal tags, and reuse tags from other titles. Personal tags accept 2–32 letters/numbers/hyphens, up to 12 per title; case and spaces normalize for consistent matching.
- Search the library by title, creator, category or tag. Personal tags immediately influence For You, Based On, explanations and the taste profile.
- Rate titles 1–5, remove ratings, and remove added titles. Up to 200 additions, ratings, and tag edits persist in this browser's localStorage.

## APIs and attribution

| Media | Provider | Metadata |
| --- | --- | --- |
| Books | Apple Search / Lookup API | Ebook ID, author, genres, description |
| Songs and albums | Apple Search / Lookup API | Track/collection ID, artist, genre |
| TV | TVmaze | Show ID, genres, summary, network |
| Films | Wikidata | Item ID, film classification Q11424, genres, director |
| Games | Wikidata | Item ID, video-game classification Q7889, genres, developer |

Search text is sent directly from the visitor's browser to the selected provider. No keys, proxy server, or paid AI calls are used. Requests are abortable, cached briefly, and bounded by a timeout. Wikidata only offers directly classified film/game instances, so some valid titles may be absent. Catalog matching verifies existence and category; it does not guarantee metadata accuracy or comprehensive coverage.

[Apple API documentation](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/Searching.html), [TVmaze API and CC BY-SA terms](https://www.tvmaze.com/api), [Wikidata CC0](https://www.wikidata.org/wiki/Wikidata:Licensing). Source links are retained on imported records and shown in the interface. Demo descriptions and tags are manually authored examples.

## Recommendations

Each title is a binary vector of its effective tags: automatic/demo tags minus hidden tags, plus personal tags. Ratings 3, 4 and 5 contribute positive weights 1, 2 and 3; ratings 1–2 contribute no positive preference. The profile averages these weighted vectors. Cosine similarity compares it (or a Based On seed) with available candidates, excluding rated titles in For You and the seed in Based On. Zero matches are omitted; ties sort by title.

A shared personal tag links titles across media; use it on at least two titles for a connection. Similarity is not a probability of liking a title or a measured accuracy score. Candidate recommendations come from saved titles, optional demos, and live candidates fetched by the visitor. Explicit negative-preference modeling and recommendation-quality evaluation remain future work.

## Architecture and limits

React + TypeScript, Vinext/Vite static export, Base UI/shadcn controls. GitHub Pages serves public static files. Each visitor has a separate browser-local library: there is no login, shared tagging database, cross-device sync, file uploading, or deployed server API. Clearing browser storage clears the library; moving from the earlier Sites URL starts separate storage. Personal tags are private to the browser, not published to GitHub or submitted to the catalog APIs.

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

The Genres tab discovers across media using catalog genre metadata. Explicit avoided genres are hidden. Two 1–2-star ratings with no positive ratings for a genre within a media type hide it automatically; one low rating reduces its score. A positive rating revises that inference. Unknown genres cannot be filtered reliably. Match percentages can include the dislike penalty and are not probabilities.

Book results sort by title/creator relevance, with available catalog rating counts breaking ties. This is not a global bestseller ranking. Recognizable standalone promotional blurbs are removed; excerpts are bounded and link to the complete source.

Optional Supabase email-code login and manual cloud library save/merge are implemented but inactive until a project, email delivery and row-level security are configured. See [account setup](backend/ACCOUNT-SETUP.md). Cloud sync has not been live-tested. The current website remains browser-local.
