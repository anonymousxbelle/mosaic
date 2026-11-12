# Participant walkthrough follow-up

The owner reported successful first-visit, search (except one-character K), rating, bookmark migration, For You, Based On interactions, filters, continuation, and keyboard/mobile checks. These are user-reported observations, not independent browser tests. Haikyuu-to-book relevance remains an open quality issue.

## Fixes
- Accept single-character title searches in both frontend and backend, while rejecting empty/punctuation-only input in the frontend.
- Order rated library titles before unrated titles, with Not interested last.
- Confirm a library rating and bookmark migration; show save feedback beside the recommendation card.
- Pin the existing discovery seed before adding a title, so implicit selection cannot switch to the newly saved title and invalidate preserved results.
- Remember navigation tab, discovery mode, shelf, target medium and saved seed in session storage. Refresh restores the location, not the prior live result set. Storage failure does not prevent library recovery.
- Open a collection as a dialog within Collections; offer rating and an explicit Find similar titles action.
- Explain that Exclude filters title labels, while Edit tags corrects labels on a particular title.

## AI verification
`evidence/semantic-live-smoke.json` preserves the actual live response to a synthetic two-candidate test. Cloudflare returned HTTP 200 using `@cf/baai/bge-small-en-v1.5`: school-team sports 0.7446 versus royal conspiracy 0.3890. This is an operational smoke test, not measured recommendation accuracy or a real Haikyuu evaluation.

Normal Based On compares up to 24 candidate synopses with AI. Normal For You uses the rated profile without this semantic call. AI tag extraction is a separate authenticated reviewer workflow; pending and rejected suggestions do not add tags. In Recommended Based On, genre/topic eligibility and compatibility tiers precede scoring. Within a tier, the score combines 90% core, 8% semantic and 2% provider signals, with missing external signals inheriting core score. Diversity can further change display order.

For an AI comparison test: open /review/, select Based On and a saved title with a synopsis, generate Recommended results, and read Search details. It must state how many descriptions were compared or explicitly report fallback. Record the source, candidate IDs, tags and results. Compare methods over the same candidate pool; separate live searches can change the pool and do not isolate AI benefit. Judge relevance, not just successful requests.

For tagging: reviewer My Library > Edit tags > AI tag analysis > privately enter reviewer key > Analyze tags. Inspect source quote, centrality, taxonomy and proposed label. Reject an unsupported suggestion; it should add no tag. Accept an approved supported label; it should appear in effective tags after refresh. A tag already supplied independently by the catalog remains even if its AI suggestion is rejected. New labels require taxonomy approval first. Do not infer accuracy from the confidence number.

For inbox: open the private inbox with the reviewer key, find the SYSTEM TEST record, save a review, lock, reopen and confirm persistence. Also lock while a request is pending: its late response must not overwrite the locked UI. Neither inbox approval nor tag review trains model weights.

## Quality work still needed
- Capture Haikyuu's actual book candidate pool and manually label the first five results for sport centrality, team/competition premise, audience and fiction/nonfiction suitability.
- Check whether good books were absent at retrieval or present but ranked poorly before adjusting scores.
- Explore web-assisted retrieval: search with title plus medium and story constraints, retain sources, verify title/creator in catalog APIs, deduplicate and apply the same eligibility rules. Not implemented; do not use an LLM's recalled titles as verified catalog records.
- Evaluate AI versus no-AI on a fixed candidate set and several unrelated seeds. Report helpful and harmful changes; no hardcoded title pairs.

## Checks
152 automated tests passed; new coverage checks single-character search and rated-before-unrated ordering. Type checking passed. See evidence/participant-fixes-tests.txt and participant-fixes-build.txt for logs. The connected browser could not reach the local development server, so the final interactive regression checks remain open until the deployed app is exercised.

Offline check: in desktop Edge/Chrome press F12, select Network, change the throttling dropdown from No throttling to Offline, then perform a new search. Expect visible failure/retry. Restore No throttling and retry. Do not clear site storage. Mobile participants can skip this developer-only check.

