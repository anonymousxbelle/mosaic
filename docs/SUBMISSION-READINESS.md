# Submission readiness — November 10, 2026

Target: November 13. Presentation: 10–15 minutes; problem, methodology, results, demonstration, challenges/solutions, conclusion. Upload slides to Canvas in advance and share recording via YouTube/Drive in the Canvas discussion. Check the forthcoming detailed rubric.

## Finish in this order
1. Verify owner inbox with reviewer key: submit through UI, open inbox, review, reload. Test controlled catalog outage and recovery. Do not expose the key in evidence.
2. Pilot the participant tasks with one person. Fix blocking issues, then freeze commit, taxonomy revision, ranking mode, provider setup, result count and study script.
3. Collect paired same-media/cross-media observations using PARTICIPANT-QUESTIONNAIRE.md and USER-STUDY-PLAN.md. Report actual counts and missing responses; do not manufacture follow-up or label intent as actual enjoyment.
4. Audit tags on a varied held-out set. Separate central genre, important subject and incidental mention. Current keyword rules do not reliably establish centrality. Record errors and known limits rather than claiming semantic understanding.
5. Review code and repository: secret scan, server authorization/input limits, browser-storage recovery, cancellation/stale results, deduplication, ranking invariants, accessibility, dependency/build checks. Avoid broad refactors immediately before the study.
6. Refresh README, architecture, setup/environment names, taxonomy/matching methodology, milestone evidence, study protocol/results, privacy/data retention, known limitations and provider attribution. Consolidate navigation with links; retain historical evidence clearly dated. Do not delete old evidence merely to tidy the repository.
7. Final tests, build, deploy and browser smoke test; tag/record final release. Prepare a backup demonstration, slides and timed recording. Verify recording sharing from a signed-out session.

## User journeys to check
- New visitor: empty library -> search -> select -> rate -> discover.
- Bookmark -> rate -> leaves Saved for later; counts agree.
- Based On -> another medium; Require excludes, Prefer only reorders.
- For You with several ratings; changed ratings genuinely affect results.
- Save/rate/report without losing the current results; changed search criteria hide stale results.
- Missing image/synopsis, catalog failure and retry; empty matches without false success.
- Mobile, keyboard, visible focus, Escape/close and focus return, readable expanded synopsis.
- Removal confirmation; reload persistence; export/import recovery where supported.
- Feedback consent and delivery; private inbox authorization/review.

## Recommendation continuation — not implemented
The ordinary diversity stage currently returns up to 30 results from bounded retrieval. Reaching the bottom does not establish catalog exhaustion. A future continuation must retain provider/query cursors, deduplicate already seen titles, retain filters, and append without shuffling current cards. Distinguish showing undisplayed existing candidates from fetching additional provider pages. Stop truthfully on exhausted providers or request budget; disclose partial failures. Do not implement a button that simply repeats the same first pages. Keep study result counts fixed for comparisons.

## Centrality rubric — proposed, not a measured classifier
Genre: the subject organizes the work's main conflict, goals or structure. Subject/theme: it matters substantially but is not its principal genre. Incidental: a passing mention or background detail; do not tag. An athlete's occupation alone does not make a romance a sports drama. Training, competition and team development driving the story support a sports genre; a brief game scene does not. Nonfiction substantially about a sport can carry a sports subject without being sports fiction.

Apply the same distinction to medicine, politics, romance and other concepts. Prefer contextual evidence over mention counts or arbitrary confidence thresholds. AI suggestions need exact evidence plus a centrality rationale and human review during testing. Provider labels are evidence, not ground truth. Current sports keyword rules can overtag basketball/football mentions; no centrality accuracy claim is justified yet.

