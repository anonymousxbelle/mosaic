# Recommendation testing guide

This developer tool compares ranking methods using the same retrieved titles and human relevance judgments. It evaluates **Based On** cases, not the combined For You taste profile or the whole participant experience. Use the [participant questionnaire](../docs/PARTICIPANT-QUESTIONNAIRE.md) for usability, discovery value and intent to try.

**Status:** the runner works; the included example is synthetic and unjudged. This folder does not establish that one method produces better recommendations.

## Try the runner

From the repository root, using the [local development setup](../docs/LOCAL-DEVELOPMENT.md):

```sh
node --experimental-strip-types scripts/evaluate-recommendations.mjs evaluation/example.json
```

The command prints a JSON comparison. Empty judgments produce `null` quality metrics, not evidence of success or failure.

## Evaluate real recommendations

1. Open the reviewer workspace (`/review/`), select **Based On**, choose a starting title and a Book, Movie or TV target, and finish a live search.
2. Open **Evaluate these recommendations** and select **Download comparison snapshot**. This saves the retrieved candidates, source title, filters, provider evidence and available AI scores. It does not export the full library or ratings. No new API or AI request is made by the evaluation runner.
3. Use the [review worksheet](review-sheet.csv) to grade candidates: **0 = irrelevant, 1 = weak, 2 = good, 3 = strong**. Record a reason. Leave unknown judgments absent rather than assigning zero.
4. Copy those grades into the snapshot's `judgments` object, keyed by the exact candidate IDs. The CSV is a worksheet; the runner reads JSON, not CSV.
5. Run the command above with your snapshot's path instead of `evaluation/example.json`. Keep the output together with the snapshot and the code/taxonomy version used.

Every method starts from the same supplied candidate pool. If you know a relevant title that retrieval missed, add its ID and grade to the judgments, **not** to the candidate pool. This exposes retrieval gaps instead of hiding them.

## Read the results

The runner compares `recommended`, `story`, `standard`, `provider`, `providerBlend` and `semanticBlend`. Provider ordering is reconstructed from captured rank evidence; it is not a fresh provider response. Without captured semantic scores, the semantic comparison does not demonstrate an AI contribution.

| Output | Meaning |
| --- | --- |
| Precision | Number of good/strong matches in the top ten divided by ten. Fewer than ten results still use ten slots. |
| NDCG | Whether the strongest judged matches appear near the top, relative to the supplied judgments. |
| Judged recall | Fraction of the known good/strong titles present in the evaluated list. It is not recall across an entire catalog. |
| `retrievedJudgedRecall` | Coverage of known relevant titles in the original retrieved pool, before ranking. |
| `top` / `finalTop` | IDs before and after the runner's diversity step. `finalList` contains metrics for that diversified list. |

Precision and NDCG are unavailable when displayed titles lack judgments; NDCG also needs a relevant judged title. Recall is unavailable when there are no known relevant titles. Both raw ranking and diversified lists are measured. The runner does **not** reproduce the full live interface, its saved state or appended pagination batches.

## Design a useful comparison

Include several genres, media types, popular and less-known titles, sparse descriptions, conflicting tags and duplicate editions. Choose some cases for development and reserve others for final testing before adjusting the ranking. Report the actual number of cases, reviewer agreement when available, missing judgments and limitations. A successful synthetic run or two familiar examples cannot establish recommendation quality.

Snapshots contain provider descriptions and metadata. Review them before sharing; keep participant information and unreviewed raw captures out of the public repository.

## Current implementation and historical notes

See [How Mosaic works](../docs/IMPLEMENTATION.md) for current behavior and the [roadmap](../docs/ROADMAP.md) for planned work. The [previous version of this guide](https://github.com/anonymousxbelle/mosaic/blob/2b652af1767d88dc4f79e4aee9c11f1f94b5f758/evaluation/README.md) preserves September development notes, earlier ranking formulas and proposed case counts. Those notes are historical proposals, not completed experiments or current participant requirements.

