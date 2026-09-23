# Ranking changes — September 23, 2026

This update fixes scoring and explanation problems; it does not establish an improvement in human-rated relevance.

- Cards count all shared tags. The old badge counted only the three explanation tags retained by the scorer. Expand “Why this match?” to see every shared tag and an explanation of why count is not rank.
- Explicit setting/premise tags contribute story evidence even when descriptions are absent. Matching uses the existing vocabulary, not title-specific exceptions.
- Story similarity weights setting and premise at 3 each, era at 2, tone and audience at 0.5 each. These are heuristic relative weights, not measured taste probabilities.
- The denominator includes all story facets known for the seed. Previously only facets available on both records counted, allowing a single matching tone to look like a perfect story match. Unknown candidate facets now provide no positive evidence; they remain distinct from known differences in compatibility ordering.
- Missing AI/provider signals inherit the core score instead of zero. Their availability alone therefore does not create a bonus. When available, they retain small 8%/2% contributions. With story context the core blends tag and story similarity at 2:1; without it the core is tag similarity.
- Core compatibility remains ahead of score, preference and diversity adjustments. No change to provider retrieval limits or new model is introduced.

Regression tests cover explicit facets across books/movies/TV, sparse evidence, tone versus story context, neutral missing external scores, uncapped shared-tag counts and the previous genre/setting safeguards.

Next quality check: use the existing evaluation harness with user judgments on a fixed retrieved pool across historical mystery, romance, fantasy and other genres. Compare relevance at the top of the list and record missing metadata. Do not treat synthetic tests as proof that actual recommendations are now better.
