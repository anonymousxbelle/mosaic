# AI tagging review — November 8, 2026

## Status

Local implementation, not published or live-model verified. This is a Week 10 implementation increment, **not a completed milestone**. Human tagging accuracy and usability remain unmeasured. Automated backend tests inject model responses; they do not demonstrate model quality.

## Agreed behavior and reasons

- Manual **Analyze tags** inside Library → Edit tags. A human decides when to incur inference usage.
- All active taxonomy categories are available, not just themes. The model may make reasonable interpretations, labeled inferred rather than explicit.
- Input is a saved provider description and original provider genre labels, capped at 6,000 characters. No title, ratings, user tags, or review key are included in the model prompt. The instruction forbids remembered title knowledge; this is a prompt constraint, not a guarantee about model internals.
- Each proposal has an exact source quotation, reasoning, estimated confidence, and explicit/inferred basis. Quote validation proves the passage exists, **not** that the inference is correct.
- Existing tags must be active approved IDs with the correct kind. New concepts require definitions and stay proposals until separately added and published through the taxonomy editor. The current handoff is export/manual entry, not a one-click taxonomy merge.
- Every analysis records a UUID, item ID, timestamp, source snapshot/provider/URL/retrieval time, model ID, prompt version, and SHA-256 taxonomy revision. Provider provenance is copied from the saved catalog record; this endpoint does not independently re-fetch or authenticate that source.
- Accept, accept correction, and reject update review state. Original suggestions remain intact; review history retains up to 100 decisions per suggestion. A new pending analysis cannot overwrite a reviewed decision. Up to 10 analyses are retained per title; additional runs are blocked rather than silently deleting history.
- Only accepted, currently applicable approved tags enter `effectiveTags`, the existing recommendation input path. Pending/rejected proposals contribute no new features. Rejecting an AI proposal does not remove an independently existing provider/manual tag; hide that automatic tag separately if it is wrong.
- Reviews use the existing browser library persistence and library export, plus a dedicated evidence export. They do not modify a shared catalog or retrain the model. Reviewed examples are not yet fed into future prompts.

## Backend setup before live testing

1. In the `mosaic-catalog-api` Cloudflare Worker, add a **Secret** named `TAGGING_REVIEW_KEY`, using a long random value stored in your password manager. Do not put it in GitHub, frontend environment variables, or chat.
2. Deploy the updated backend with its existing AI binding and AI_LIMITER. The endpoint is `POST /analyze-tags`. It requires `Authorization: Bearer <reviewer key>`; without configuration it returns 503, without a matching key 401.
3. Deploy the frontend with `NEXT_PUBLIC_CATALOG_API` pointing at that Worker. For local testing, configure a local Worker with the appropriate localhost `ALLOWED_ORIGIN`; production permits the GitHub origin only.
4. Enter the key in the review panel. It stays in component memory, not localStorage or exported evidence. Existing server global limits restrict analysis requests; the 25-second timeout bounds response waiting but does not guarantee cancellation of model compute. No automatic retry is performed.

Model: `@cf/meta/llama-3.1-8b-instruct`, structured JSON mode, temperature 0.2, maximum output 3,000 tokens. Availability/schema checked against [Cloudflare JSON mode documentation](https://developers.cloudflare.com/workers-ai/features/json-mode/). Usage is Cloudflare Workers AI usage; this work does not establish available free allowance or a hard billing cap.

## Exact manual acceptance test

1. Add a real catalog title with a synopsis to My Library; refresh catalog details if source information is missing.
2. Open Edit tags → AI tag analysis. Enter reviewer key and click Analyze tags. Verify one actual response arrives and its model/source/revision appear under Source and analysis record.
3. Export the pending analysis. Check every quote against the displayed source. Check inferred suggestions for reasoning quality, not just a high confidence number.
4. Leave one suggestion pending, reject another with a reason, and accept a third that was not already in the title's tags. Check the library's effective tags and rerun recommendations: only the accepted feature should be newly available to scoring/explanations.
5. Correct an accepted suggestion to another approved tag. Verify the original suggestion is retained in the export and its replaced tag no longer contributes via that decision.
6. Run another analysis and verify existing human decisions remain active. Refresh the page and verify reviews persist. Export the library and restore it into a separate test browser to check portability.
7. For a new-tag proposal, verify direct acceptance is blocked. Export it for taxonomy review, or choose an approved replacement. Do not treat approving its taxonomy definition as automatically approving its use on this title.
8. Exercise wrong key, missing source, unavailable backend, and invalid model output: none may silently add tags. Test narrow-screen layout and keyboard navigation.

## Verification and gaps

- Automated tests cover review gating into real cosine vectors, persistence, corrections, pending reruns, invalid quotes/IDs/confidence, duplicate suggestions, new proposals, authorization and rate limiting.
- Before shared or autonomous operation: verify a live model response, browser interactions and deployment; measure precision and reviewer agreement on a varied human-reviewed sample. Compare relevance before/after accepted tagging using the same candidate pool. Keep a separate evaluation sample for instruction changes.
- Account-based reviewer identity, shared storage, automatic acceptance, feedback-based training, multiple-source retrieval, and automatic new-tag publishing are not implemented.
- Browser verification was attempted, but the in-app browser could not connect to the local development server. No UI screenshot or successful interactive review is claimed.

## Files

`lib/ai-tagging.ts`: source/output validation, review decisions, persistence restoration, accepted features.
`backend/tag-analysis.ts`: protected bounded model request, provenance and revision.
`backend/worker.ts`: route and Authorization CORS header.
`lib/tags.ts`: persistence and accepted-feature integration.
`components/media/ai-tag-review.tsx`: reviewer interface and evidence export.
`components/media/tag-editor.tsx`: integration, preserve review records during manual edits.
`tests/ai-tagging.test.mjs`: regression tests.

Verification recorded November 8: 121/121 automated tests passed; TypeScript check passed; Pages build rendered 5 routes with 0 skipped. Logs: evidence/ai-tagging-tests-2026-11-08.txt and evidence/ai-tagging-build-2026-11-08.txt. Model responses in tests are mocked. No live inference or deployment was performed.


## Live failure follow-up
Cloudflare lists the original llama-3.1-8b-instruct model ID as unavailable. Switched to @cf/meta/llama-3.3-70b-instruct-fp8-fast, which documents JSON output support and a 24,000-token context. Added sanitized AI-specific errors instead of the generic catalog failure. This diagnoses a configuration defect, not a verified provider log of the failed user request. Live inference still needs reviewer testing. Model reference: https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/

## Per-suggestion validation follow-up
Analysis now keeps individually valid suggestions pending and stores excluded-row diagnostics with tag, position and validation reason. Excluded rows cannot be accepted or enter vectors. This replaces whole-response rejection for malformed individual suggestions; an invalid top-level list still fails. Diagnostics survive browser persistence and evidence export. A quoted passage still requires human interpretation review. The original failed response for The Hate U Give was not retained, so its exact validation failure is unknown until another analysis.

