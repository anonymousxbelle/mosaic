# Final release review — November 11

## Changes
- Normal discovery can reveal additional eligible titles already retrieved before fetching another provider page. Saving a card no longer hides continuation while its results are preserved.
- A delayed inbox review response cannot change the locked message or busy state after locking or changing the reviewer key. This is a UI request-order guard, not cancellation of a review already received by the server.
- The Google Form's existing edits were preserved. An optional paragraph question now invites feedback on Based On, Library, Collections, preferences and navigation. The introduction encourages exploring the whole site.

## Study scope
Use normal discovery for participants. Reviewer-only tools are for the project owner: tag approval, inbox triage and reproducible cosine evidence. Do not mix reviewer ranking with normal discovery in the same study condition.

Use Google Forms as the main study questionnaire. In-app feedback remains optional for title-specific problems; it is not required for the study and does not train the model. No in-app feature was removed in this release.

## Evidence and limits
- 151 automated tests passed, zero failures; type checking passed.
- Pages build succeeded with static prerendering after granting network access to the build's local server. The first restricted run skipped routes and was not accepted as build evidence.
- Logs: evidence/release-review-tests.txt and evidence/release-review-build.txt.
- The previous browser smoke-test session was no longer available on resume. These two final UI fixes have not received a completed browser interaction test.
- The form remains unpublished. No participant response was submitted or invitation sent.
- Owner-key inbox save/reload, full participant walkthrough and study-version freeze remain required. This is not a complete security audit or a claim that the study is complete.

Follow docs/FINAL-USER-WALKTHROUGH.md and record Passed, Failed or Not tested for every journey.

