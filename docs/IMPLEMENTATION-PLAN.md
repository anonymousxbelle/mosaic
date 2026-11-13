# Mosaic roadmap

Updated November 13, 2026. This roadmap separates completed foundations from remaining work. For the current algorithms and AI roles, read [How Mosaic works](IMPLEMENTATION.md). The [original recommendation proposal](../RECOMMENDATION-PLAN.md) records earlier intentions and is not a current feature checklist.

## Implemented foundation

- Book, movie and TV title search, normalized catalog records, verification and browser-saved ratings/library.
- Shared taxonomy, user tag edits, collections and content preferences.
- For You taste profiles and Based On single-title discovery, cosine/content matching and bounded provider retrieval.
- Optional Based On AI description comparison and separately reviewed AI tag suggestions.
- Paged results, synopsis loading, grouped tag dialogs and participant-feedback-driven UI changes.

See [How Mosaic works](IMPLEMENTATION.md) for recommendation logic and AI roles, [evidence and limitations](EVIDENCE-AND-LIMITATIONS.md) for verification and constraints, and the [README](../README.md) for provider scope.

## Current refinement

1. **Implemented and unit-tested:** rank new candidates within their batch and append them without moving earlier results. Full browser verification of continuation and saved-result preservation remains part of the walkthrough.
2. **Implemented:** include general/mature titles by default, with an explicit Hide 18+ titles filter. Saved library titles stay visible.
3. Verify the full participant journey after UI changes, including mobile/keyboard search, Enter, rating, bookmarking and error recovery.
4. Consolidate documentation. Check architecture and backend setup next; retain historical milestone evidence with clear dates.

## Next: book metadata quality

- Prepare Google Books as a proposed primary title-search source, supplemented by Hardcover and Open Library. It is **not yet integrated**; Google Cloud/API credentials are not configured.
- Compare a representative set of titles for correct work/edition, language, author, description and useful categories before changing live provider priority.
- Fix author-field normalization and verify richer detail records before displaying unavailable credits.
- Prefer available English descriptions and identify unavailable translations explicitly; investigate the reported Japanese book record when its title is known.
- Merge supplementary metadata only after matching work identity; retain provenance and avoid duplicate editions or invented tags.

## Evaluation and submission

- Collect responses using the [study questions](PARTICIPANT-QUESTIONNAIRE.md) and [study protocol](USER-STUDY-PLAN.md).
- Record versions and distinguish owner diagnostics from participant responses. Explain post-freeze changes using the [feedback/change log](PARTICIPANT-FEEDBACK-LOG.md).
- Report actual sample sizes, relevance/discovery measures and limitations. Do not treat intent to try as actual enjoyment or claim superiority without a comparison.
- Refresh presentation results and follow the [submission checklist](SUBMISSION-READINESS.md).

## Later work

Verified account synchronization, shared community recommendations, age verification, broader media support and web-assisted retrieval remain future work. The [historical backlog](../PROJECT-BACKLOG.md) preserves requests but contains older status entries that need reconciliation.
