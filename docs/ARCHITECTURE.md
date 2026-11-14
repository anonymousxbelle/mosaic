# Architecture

Current source structure; this diagram describes implemented paths, not a fresh live-service verification. [Implementation](IMPLEMENTATION.md) explains ranking; [backend setup](../backend/README.md) explains configuration.

```mermaid
flowchart TD
 Pages[GitHub Pages: static React / Vinext frontend] --> UI[Discover, Library, Collections]
 UI <--> Local[Browser storage: ratings, shelves, tags, preferences]
 UI --> Retrieval[Search, verification and bounded retrieval]
 Retrieval --> Worker[Cloudflare catalog Worker]
 Worker --> Providers[TMDB and Hardcover: server-side secrets]
 Retrieval --> Public[Open Library and public fallback adapters]
 Retrieval --> Normalize[Unified records and effective tags]
 Normalize --> Rank[Taste profile / source title and content ranking]
 Rank --> UI
 Rank -. Based On shortlist .-> Worker
 Worker -. embeddings .-> AI[Workers AI]
 Pages --> Review[Separate reviewer tools]
 Review -. authenticated analysis .-> Worker
 Worker -. tag suggestions .-> AI
 Review --> Decisions[Local accept / edit / reject history]
 Decisions --> Normalize
 Review -. authenticated inbox .-> Worker
 Worker --> D1[Private feedback database]
 Pages --> Course[Isolated catalog and cosine demonstrations]
 JSON[data/catalog.json: 25 fixtures] --> Course
 UI -. inactive optional integration .-> Supabase[Supabase accounts / snapshots]
```

Normal media choices are books, movies and TV. Games/music remain in schema and course fixtures. There is no complete provider-catalog database. The D1 inbox stores submitted feedback, not everyone's library; current public cards no longer submit feedback. AI suggestions stay inactive until reviewed and do not train the model.

The principal modules are `lib/media-api.ts`, `lib/library-storage.ts`, `lib/recommendations.ts`, `lib/ai-tagging.ts`, `backend/` and `components/`. `.github/workflows/pages.yml` builds the frontend; the Worker deploys separately. Legacy `/milestones/` and `/week8/` routes and evidence directories retain their names to keep recorded demonstrations reproducible.
