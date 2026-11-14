# AI tagging and review

Reviewer analysis proposes metadata; it is separate from the description embeddings used in Based On ranking. [Implementation](IMPLEMENTATION.md) describes those roles.

## Analyze and decide

1. Open `/review/`, choose a saved title and open its tag editor. Enter the reviewer key privately; it stays in memory. Refresh catalog details if source text/provenance is missing.
2. Analyze the saved description and original provider genres. Personal ratings and personal tags are not sent as model inputs.
3. Inspect each proposed label, its quoted source evidence, centrality, confidence estimate and provenance. Confidence is not measured accuracy.
4. Accept an applicable approved tag, correct it to an appropriate existing tag, or reject it. Pending and rejected suggestions add no features. Accepted tags enter effective tags, matching and explanations.
5. New-label proposals need a separate [taxonomy](TAXONOMY.md) decision and publication before applying them. Accepting a suggestion cannot silently extend the published taxonomy.

Rejecting an AI suggestion does not erase the same label supplied independently by a provider or manual edit. Hide an inaccurate automatic tag separately. A later pending analysis must not overwrite an explicit decision.

## Constraints and provenance

The configured analysis model is `@cf/meta/llama-3.3-70b-instruct-fp8-fast`; prompt version is `grounded-tags-v3-centrality`. The request uses bounded source text and up to 16 suggestions. The validator checks evidence quotes, taxonomy IDs/applicability and centrality. Genres/subgenres require central evidence; incidental references should not become tags. A matching quote proves the text exists, not that the interpretation is correct.

Valid suggestions remain reviewable when other rows fail validation. Invalid output must not be silently applied. Review records retain evidence/confidence/model/prompt/source information and decisions locally; exports support inspection. They are not shared catalog edits.

## Learning and verification

Reviews do **not** train the model or automatically change its prompt. Reviewed examples could later support prompt refinement or fine-tuning, but that needs a separate evaluated workflow. The private feedback inbox also does not feed model weights.

Automated tests check validation and acceptance gating, not real-model accuracy. To measure accuracy, independently label a varied held-out set, record correct/incorrect/uncertain and central/substantial/incidental judgments, then report precision and coverage. Verify that accepted tags affect vectors and that pending/rejected tags do not; also test wrong keys, malformed output, timeout and retry. See [Testing](TESTING.md) and [backend setup](../backend/README.md).
