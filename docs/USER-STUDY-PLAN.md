# Mosaic user-study plan — revised November 11, 2026

This revision supersedes the single-starting-title paired task as the primary study. The original plan is retained in Git history.

## Objective and research question
Build a unified profile from preferences across media and generate cross-media recommendations. Ask whether combining preferences produces relevant recommendations and helps users discover media they would not otherwise explore.

## Primary participant workflow
1. Add and rate at least five known titles spanning at least two of Book, Movie and TV. Record actual titles and ratings; do not require fabricated favorites.
2. Use normal Discover -> For You with All media. Evaluate the first five results, or all available if fewer. Record the actual result count and IDs. Do not press Find more until this evaluation is complete.
3. Read descriptions and explanations; optionally save a title. No appealing result is a valid outcome.
4. Submit the Google Form once for this experience. It collects name/email, rated titles, overall relevance (1–5), discovery value (1–5), clarity, intent to try, ease, a chosen title, prior awareness/consideration, usual media habits and interest outside those habits.
5. Actual enjoyment is recorded only after actual consumption; not tried is not a zero enjoyment rating. Follow up separately with participants who agreed. Record title, date, tried yes/no and enjoyment 1–5. Do not mix a follow-up into the count of new participants.

Editor: https://docs.google.com/forms/d/1OpdAc-28Jzrhg_WEau10KmTUZekG9Z9GQ-C5WvgflR4/edit
The form is updated but unpublished. No participant invitations sent. Automatic verified-email collection and the one-response sign-in requirement are off; explicit name/email questions are present. Public response summary is off. Names/emails are not anonymous codes.

## Evidence this design can support
Descriptive relevance, intention, novelty, usability and self-reported interest in less-usual media. It evaluates the combined profile experience. It does NOT establish that mixed-media inputs outperform single-medium inputs. Same-medium versus cross-media OUTPUT alone also does not isolate the benefit of combining INPUT preferences.

## Optional controlled comparison needed for the comparative claim
Use For You in both conditions: one profile has ratings from one medium; the other has ratings from multiple media. Hold number of rated titles, approximate rating distribution, target output categories, number of displayed results, version, taxonomy, provider setup and ranking mode fixed. Use isolated browser profiles or explicit backups, not deletion of a participant's real library. Counterbalance order. Record exact input/output records and which condition generated each response. Use a comparison-specific copy of the form with an explicit condition field; the current primary form does not capture that condition.

Changing which titles are rated is part of the treatment and can introduce selection effects; report this limitation. A small convenience sample supports an exploratory comparison, not universal claims. Do not improvise an unlogged condition change mid-study.

## Collation and reporting
Use one row per initial participant/session. Keep source names/emails in the restricted response sheet; analyze using row IDs if useful. Participant codes are optional administrative IDs, not required programming. Record consent to quote and follow up. Never commit raw contact information to GitHub. Fix a retention date with the supervisor.

Report actual sample size, missing responses, completion/assistance counts, medians/ranges and illustrative anonymous quotes with permission. Novelty: distinguish never heard of, known but not considered, already considered, and already experienced. Cross-media interest: compare the selected title type with usual habits; distinguish interest from actual use. Enjoyment denominators include only people who tried and responded. With the November 13 deadline, follow-up may remain pending.

Separate tagging evaluation: independently review a varied set of source descriptions and proposed labels; classify correct/incorrect/uncertain and central/substantial/incidental. Report precision and coverage separately; model confidence is not measured accuracy. Keep evaluation titles separate from prompt-tuning examples.

## Before distribution
Preview form on desktop/mobile, run one clearly labeled test response, verify response storage, remove/exclude that test from analysis, then freeze the deployed commit, taxonomy, ranking mode and study instructions. The reviewer-key inbox flow, controlled outage recovery and full continuation browser test remain outstanding; see FINAL-USER-WALKTHROUGH.md.

