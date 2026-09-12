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

## 2026-09-12 - Series, metadata and story comparison
Other stories separates known same-series records; Same series displays those records instead. Unknown series are not guessed. The new default experimental story method adds up to a 30% grouped-evidence bonus (setting, premise, tone, catalog audience) and discounts explicitly identified later book volumes outside the seed series by 20%. Standard remains available for comparison. These are initial heuristics, not validated quality improvements.

Up to six leading Open Library books receive bounded Hardcover searches, merged only on normalized title and known author identity. Supplemental source links are retained. Failed requests preserve the original record; strict matching intentionally misses some alternate editions. Full descriptions are preserved and available Hardcover descriptions fill gaps. Series position comes only from explicit opening synopsis statements. Provider data can still be incomplete or inaccurate.

Use evaluation/review-sheet.csv as the human review worksheet. Capture real candidates using Download comparison snapshot; enter grades 0 irrelevant, 1 weak, 2 good, 3 strong, with a reason. No grades have been invented. Preserve development versus held-out assignments before tuning, and nominate relevant missing works separately to measure retrieval gaps. Run the evaluation script on the completed JSON snapshot: it now compares story, standard, provider and semantic methods and includes final diversified-list metrics. Snapshot candidate filtering preserves Must have eligibility and records series view. Raw snapshots should remain local pending provider redistribution review.

## Unified recommendation method (2026-09-12)
Recommended is now the default Based On method. Genre and defining topic eligibility are retained. Explicit historical/contemporary romance conflicts are excluded; other known subgenre non-overlap is a broader tier. Subgenre, setting and premise tiers precede media preference and every numeric score, including diversity. Unknown metadata is labeled separately. Within a tier, scores combine tags (60%), grouped story evidence (30%), available synopsis AI (8%) and provider rank (2%). These initial heuristics need judged evaluation. AI quota/errors fall back to local features; up to 24 eligible candidates are compared, not the full catalog.
Expanded setting/premise cues cover romance, historical periods, mysteries, heists, family secrets, political intrigue and survival. They are bounded text rules and can miss paraphrases or misread context; they are not complete story understanding. Provider queries now prioritize a known subgenre when there is no defining topic. Unsupported provider labels still rely on local comparison. The benchmark includes Recommended alongside the previous methods.
