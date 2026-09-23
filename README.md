# Mosaic

Cross-media story discovery for CSCI 310 Junior Seminar. The main interface supports books, movies and TV through Discover (For You / Based On) and My Library. Preferences are inside My Library. Demo titles, games and music are not shown in normal discovery.

## Run and verify

Use Node 22.13+. Run `npm ci`, then `npm run dev`. Validate with `npm run typecheck`, `npm test`, and `npm run build:pages`. GitHub Actions publishes main to https://anonymousxbelle.github.io/mosaic/. Secret-bearing requests use the separate Cloudflare backend.

The [Week 4 / Week 6 report](docs/MILESTONES.md) contains requirement results, exact testing steps, changed files and limits. See the [architecture diagram](docs/ARCHITECTURE.md) and [working evidence](evidence/milestones/README.md).

Open `/milestones/` locally for the isolated course verification page: 25 JSON records, ratings and a live TVmaze workflow. These curated records do not populate the product library. Regenerate network evidence with `node --experimental-strip-types scripts/verify-milestones.mjs`.

## Implementation

Live autocomplete selects catalog records and re-verifies provider IDs before saving. Ratings, tags, shelves and preferences persist in browser storage. Optional Supabase login/cloud sync requires configuration and has not been verified active. Shared community ratings are not operational evidence.

Configured TMDB/Hardcover requests use the Worker. Public fallback adapters include Open Library, Apple and TVmaze; Wikidata support remains in the provider layer. Games/music retain model support but have no current discovery controls. See [backend setup](backend/README.md).

Recommendations retrieve bounded provider candidates and rank eligible results using core genre, subgenre, setting/premise and weighted tag evidence. Optional/configured Workers AI compares candidate descriptions; it does not search an entire catalog or guarantee relevance. Metadata and rule-based classifications can be incomplete or inaccurate.

Shared records include title, type, genres, themes, moods, creators and keywords. Missing evidence remains empty. Legacy display credits may differ from creators, especially TVmaze network names. Imported records retain source links. Provider attribution: [TVmaze](https://www.tvmaze.com/api), [Open Library](https://openlibrary.org), [Hardcover](https://hardcover.app), [Apple](https://www.apple.com/itunes/), [Wikidata](https://www.wikidata.org/wiki/Wikidata:Licensing).

See [backlog](PROJECT-BACKLOG.md), [recommendation plan](RECOMMENDATION-PLAN.md), [research](docs/recommendation-research.md), and [evaluation guide](evaluation/README.md). Historical plans contain proposals as well as implemented work; the milestone report identifies the verified scope of this revision.
