# User study: method and versions

This revision supersedes the single-starting-title paired task as the primary study. The original plan is retained in Git history.

## Objective and research question
Build a unified profile from preferences across media and generate cross-media recommendations. Ask whether combining preferences produces relevant recommendations and helps users discover media they would not otherwise explore.

## Primary participant workflow
1. Add and rate at least five known titles spanning at least two of Book, Movie and TV. Record actual titles and ratings; do not require fabricated favorites.
2. Use normal Discover -> For You with All media. Evaluate the first five results, or all available if fewer. Record the actual result count and IDs. Do not press Find more until this evaluation is complete.
3. Read descriptions and explanations; optionally save a title. No appealing result is a valid outcome.
4. Submit the Google Form once for this experience. It collects name/email, rated titles, overall relevance (1–5), discovery value (1–5), clarity, intent to try, ease, a chosen title, prior awareness/consideration, usual media habits and interest outside those habits.
5. Actual enjoyment is recorded only after actual consumption; not tried is not a zero enjoyment rating. Follow up separately with participants who agreed. Record title, date, tried yes/no and enjoyment 1–5. Do not mix a follow-up into the count of new participants.

[Participant questionnaire](https://docs.google.com/forms/d/e/1FAIpQLSdYNjkKFDr58bBdMEukDVlM6zW_gObwy1dTFJdTPkkwj2n0VA/viewform) · [Questions and answer choices](PARTICIPANT-QUESTIONNAIRE.md)

## Evidence this design can support
Descriptive relevance, intention, novelty, usability and self-reported interest in less-usual media. It evaluates the combined profile experience. It does NOT establish that mixed-media inputs outperform single-medium inputs. Same-medium versus cross-media OUTPUT alone also does not isolate the benefit of combining INPUT preferences.

## Optional controlled comparison needed for the comparative claim
Use For You in both conditions: one profile has ratings from one medium; the other has ratings from multiple media. Hold number of rated titles, approximate rating distribution, target output categories, number of displayed results, version, taxonomy, provider setup and ranking mode fixed. Use isolated browser profiles or explicit backups, not deletion of a participant's real library. Counterbalance order. Record exact input/output records and which condition generated each response. Use a comparison-specific copy of the form with an explicit condition field; the current primary form does not capture that condition.

Changing which titles are rated is part of the treatment and can introduce selection effects; report this limitation. A small convenience sample supports an exploratory comparison, not universal claims. Do not improvise an unlogged condition change mid-study.

## Collation and reporting
Use one row per initial participant/session. Keep source names/emails in the restricted response sheet; analyze using row IDs if useful. Participant codes are optional administrative IDs, not required programming. Record consent to quote and follow up. Never commit raw contact information to GitHub. Fix a retention date with the supervisor.

Report actual sample size, missing responses, completion/assistance counts, medians/ranges and illustrative anonymous quotes with permission. Novelty: distinguish never heard of, known but not considered, already considered, and already experienced. Cross-media interest: compare the selected title type with usual habits; distinguish interest from actual use. Enjoyment denominators include only people who tried and responded. With the November 13 deadline, follow-up may remain pending.

Separate tagging evaluation: independently review a varied set of source descriptions and proposed labels; classify correct/incorrect/uncertain and central/substantial/incidental. Report precision and coverage separately; model confidence is not measured accuracy. Keep evaluation titles separate from prompt-tuning examples.


## Archived reference version

The November 12 reference is historical. Later UX/retrieval changes mean the live site is not identical; record the tested revision and disclose differences.


Status recorded on November 12: reference version saved for participant collection. Owner confirmed the final app walkthrough, form test/receipt and participant-link checks were done. These are owner-reported checks, not independently inspected form responses.

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

## Original collection rules (historical)
1. Label the response batch `mosaic-study-v1`. Exclude TEST submissions and owner diagnostics from participant results.
2. Keep application ranking, taxonomy, prompts, retrieval rules and provider configuration unchanged during collection. Do not publish taxonomy edits or experimental ranking changes to the study app.
3. Documentation/presentation work may continue. This freeze record is a documentation-only follow-up; the application source baseline above remains unchanged.
4. For an essential bug/security fix: record the reason, exact commit and time; label subsequent observations v1.1 and separate or disclose the batches. Do not silently combine them.
5. Save dated result screenshots/exports when possible. Live catalogs, provider metadata and hosted model behavior are not frozen snapshots, so identical results are not guaranteed.
6. Participant browser-local ratings and tag edits are part of normal use. Reviewer AI acceptance, model comparisons and tagging-accuracy experiments remain separate from the participant study.

No repository protection or deployment lock was added; this is an archived, documented baseline and change-control agreement. Keep the archive branch unchanged. 

