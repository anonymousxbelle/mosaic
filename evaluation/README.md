# Recommendation evaluation

Run `node --experimental-strip-types scripts/evaluate-recommendations.mjs evaluation/example.json` from the project root. The example is synthetic, unjudged, and only demonstrates the runner. It does not establish an improvement.

For a real experiment, create a snapshot with one case per seed/intent. Store the exact seed and candidate Media records, retrieval evidence (`plan`, `page`, one-based `rank`), optional semantic scores, target `category`, and `requiredGenre`. The same candidates are passed to every method. Do not add a relevant item to the retrieved pool just to improve a metric.

Judgments map canonical IDs to 0 (irrelevant), 1 (weak), 2 (good), or 3 (strong). Omit unknown judgments. Include independently nominated relevant works in judgments even when retrieval misses them. NDCG and precision are null when displayed items are unjudged; judged recall is explicitly limited to this known relevant set. Precision uses ten slots, so returning fewer results does not artificially inflate it. Output is measured before diversity, so evaluate final list construction separately.

The interface's **Download comparison snapshot** saves the actual current external candidate pool and ranking evidence locally. It omits the user's library, ratings, and personal tag edits. It includes public candidate descriptions and seed metadata, so review provider retention/redistribution conditions before sharing snapshots. Human judgments can be added to a copy. Keep raw snapshots out of public GitHub until reviewed.

Initial human-review requests (unjudged; verify title IDs and metadata before capture):

| Seed | Target | Required interest |
|---|---|---|
| Harry Potter and the Philosopher's Stone | Books | Fantasy; magic and friendship |
| Harry Potter and the Philosopher's Stone | Movies | Fantasy; new stories separately from adaptations |
| Kuroko's Basketball | TV/anime default | Basketball |
| Kuroko's Basketball | Books | Basketball |
| The Hobbit | Books | Fantasy adventure |
| The Hobbit | Games | Fantasy, subject to actual provider coverage |
| The Hunger Games | Books | Dystopian fiction |
| The Hunger Games | Movies | Dystopian fiction |
| Spirited Away | TV | Fantasy |
| Sherlock Holmes | Books | Mystery |
| A verified basketball biography | Books | Non-fiction basketball |
| A less popular, sparsely described fantasy work | Books | Fantasy |

Split future judged cases into development and held-out groups before tuning. Include genre conflicts, missing descriptions, mixed genres, duplicate editions, and explicit content constraints. Two familiar seeds alone cannot validate the system. Research target remains approximately 40–60 diverse cases, with human review and uncertainty reporting.
