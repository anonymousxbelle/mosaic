# Recommendation quality: next implementation plan

This is a proposed next stage, not the behavior currently deployed. The current baseline retrieves a bounded set from provider search and scores shared keyword tags with cosine similarity.

## 1. Retrieve candidates before ranking

Activate the existing TMDB/IGDB backend after credentials, attribution and configuration are ready. Use provider-supported genre/theme discovery and related-title endpoints where appropriate; retrieve from several liked seeds rather than sending one leading tag as a title search. For books and music, select metadata providers based on actual genre/theme coverage, access, licensing and quota constraints. Do not assume a music catalog contains moods, lyrics or narrative themes. Where permitted, cache normalized metadata in a small searchable index. Retain provider IDs, provenance, freshness and editions/formats; deduplicate records and cap requests per provider.

## 2. Normalize evidence into distinct dimensions

Represent each work with separate genres, themes, moods and optional pacing/format. Every feature records source and confidence: provider genre; provider keyword; rule extracted from synopsis; personal user tag. Missing metadata stays unknown. A shared narrative theme can bridge a book and a film, while music should bridge only through supported mood/context/theme evidence. Never infer theme from an artist/title alone. Start with a small manually reviewed mapping vocabulary and fixtures before considering text embeddings. Embeddings would be an optional candidate or scoring signal to evaluate against the baseline, not a substitute for evidence or an automatic guarantee of understanding.

## 3. Model preferences and apply explicit constraints

Use rated favorites as positive evidence, stronger at higher ratings. Keep disliked works, already-experienced records and explicit genre/content exclusions distinct. Avoid interpreting absent ratings as dislikes. Not interested hides that work, without assuming hatred of its genre. Explicit exclusions apply before final results. Inferred genre penalties remain reversible and weaker than explicit intent.

## 4. Rank and diversify

Combine dimension similarities using weights selected through evaluation, rather than claiming arbitrary constants are optimal. Downweight broad frequent tags and weakly supported features. A personal tag can provide strong local evidence but does not become public catalog truth. Rerank a relevant candidate pool to avoid duplicate editions, too many sequels/franchise entries and domination by one medium. Only introduce diversity among relevant candidates; do not force unrelated music into every list. Use popularity as a modest quality prior or tie-breaker, not the definition of personal taste.

## 5. Explain and evaluate

Generate explanations from the exact features that contributed to ranking and identify source favorites; show uncertainty where data is sparse. Separate retrieval coverage from ranking quality. Compare popularity, existing tag-cosine and improved scoring on the same test profiles/candidate sets. Use held-out likes where possible and 5–8 formative user sessions. Measure relevance in the first five results, new discoveries, cross-media variety, exclusions, empty-result rate and time to first useful result. Tune only after collecting judgments, and disclose small-sample limitations.

## Example data flow

Favorites → normalized evidence → several provider candidate searches → deduplication and explicit exclusions → weighted similarity → diversity reranking → explanations → user feedback.

If someone likes found family and political conflict in a fantasy book, a game needs evidence of those themes to earn that explanation. “Fantasy” alone should not outweigh the themes, and an album should not receive a narrative explanation simply because its genre shares a word.

## First bounded delivery

Connect TMDB/IGDB, build a reviewed mapping for a small set of themes and genres, create test profiles and candidate fixtures across at least three media, then compare retrieval and ranking with the baseline. Keep the current functioning UI and collect feedback through the new actions. Authentication and age verification are separate workstreams in the backlog.
