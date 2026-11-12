# Mosaic study v1 — frozen November 12, 2026

Status: frozen for participant collection. Owner confirmed the final app walkthrough, form test/receipt and participant-link checks were done. These are owner-reported checks, not independently inspected form responses.

## Baseline
- Application commit: `d4c463c56081d97307b0543260cc5d20f0f5461f`.
- Archive branch: [study-v1-2026-11-12](https://github.com/anonymousxbelle/mosaic/tree/study-v1-2026-11-12). The full commit SHA is the immutable reference; a branch name alone is movable.
- Participant site: https://anonymousxbelle.github.io/mosaic/.
- Taxonomy: 158 active nodes; approved-taxonomy SHA-256 `1cae15ac25ccb00680f4c35838d8e33a03cad31cc00025b9e9a79f2aacbdf5c1`. Computed by the same serialization/filtering rule as AI tag analysis, after checking local taxonomy sources against the deployed commit.
- Primary activity: rate at least five titles across at least two of Book/Movie/TV, then For You, All media, normal Recommended ranking; evaluate the first five available results (or fewer if fewer appear).
- Secondary exploration: Based On, Library, Collections and preferences. Do not treat reviewer-mode experiments as primary-study responses.
- For You uses the combined rated tag profile. Based On can compare up to 24 descriptions with `@cf/baai/bge-small-en-v1.5`; AI fallback is permitted and should be recorded when observed. No web-search retrieval.
- TMDB, Hardcover, semantic comparison and feedback storage reported enabled; IGDB disabled. Book discovery uses Open Library subject queries. Games/music are outside the participant scope.
- Release evidence: 157 local automated tests passed; type checking, Pages build, GitHub checks, Pages deployment and Workers build succeeded.

Full configuration, provider status, verification timestamp, taxonomy source hashes and check URLs: [STUDY-BASELINE-v1.json](STUDY-BASELINE-v1.json).

## Collection rules
1. Label the response batch `mosaic-study-v1`. Exclude TEST submissions and owner diagnostics from participant results.
2. Keep application ranking, taxonomy, prompts, retrieval rules and provider configuration unchanged during collection. Do not publish taxonomy edits or experimental ranking changes to the study app.
3. Documentation/presentation work may continue. This freeze record is a documentation-only follow-up; the application source baseline above remains unchanged.
4. For an essential bug/security fix: record the reason, exact commit and time; label subsequent observations v1.1 and separate or disclose the batches. Do not silently combine them.
5. Save dated result screenshots/exports when possible. Live catalogs, provider metadata and hosted model behavior are not frozen snapshots, so identical results are not guaranteed.
6. Participant browser-local ratings and tag edits are part of normal use. Reviewer AI acceptance, model comparisons and tagging-accuracy experiments remain separate from the participant study.

No repository protection or deployment lock was added; this is an archived, documented baseline and change-control agreement. Keep the archive branch unchanged. The Google Form's exact current wording/response data has not been independently archived by this operation.

Next: distribute the verified responder link and prepare the 10–15 minute presentation while responses arrive. Report descriptive relevance/discovery feedback; a single-condition questionnaire does not prove mixed-media profiles outperform single-media profiles.

