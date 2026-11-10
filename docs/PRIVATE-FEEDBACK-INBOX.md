# Private feedback inbox and model learning

Date: November 10, 2026. Implemented code; live shared storage requires account setup.

## What is implemented
Visitors may explicitly opt in to send the displayed title, source/suggested title, feedback category and short explanation to the project owner. Library contents, star ratings and personal tags are not included. Existing local feedback is not uploaded automatically. A failed delivery keeps the local copy and reports failure; it never claims success. Identical retries reuse a submission UUID to avoid duplicate rows.

The Cloudflare Worker validates fields, caps request size, limits submission rate, and writes parameterized SQL to D1. It does not store request IPs (a SHA-256 digest is used only as a rate-limit key). The public endpoint cannot list feedback. Inbox reads and review writes require the existing TAGGING_REVIEW_KEY. The key remains in UI memory; Lock clears displayed records and invalidates pending inbox requests. Review decisions retain an audit row.

Reviewer statuses: Not reviewed, Reviewed, Rejected. Only Reviewed can be marked useful for evaluation. No status changes model weights, publishes tags, or automatically affects ranking. Evaluation examples are not automatically training examples.

## Cloudflare activation
1. Sign in to the existing Cloudflare account. Create a D1 database named mosaic-feedback.
2. Execute backend/migrations/0001_feedback.sql in its SQL console (or use Wrangler D1 migrations).
3. Bind the database to mosaic-catalog-api as FEEDBACK_DB. Record its non-secret database ID under d1_databases in backend/wrangler.jsonc, with database_name mosaic-feedback and migrations_dir migrations, so future Git builds retain the binding.
4. Deploy. FEEDBACK_LIMITER is defined in Wrangler configuration (five requests per minute per IP digest); TAGGING_REVIEW_KEY already protects analysis and is reused for the owner inbox.
5. Verify /status reports feedback:true. Submit a clearly labeled test through the consent checkbox, open /review/ with the key, verify the row, save a review and reload. Verify unauthenticated inbox requests return 401.
6. Do not claim collection complete until this real write/read test passes. Currently no database binding is configured in the repository and Cloudflare sign-in is required.

No credentials should be added to source, exports or chat. The D1 database ID is configuration, not a credential.

## What “learning from feedback” should mean
For this prototype, first review reports and fix demonstrated tagging/retrieval/ranking errors. Keep separate evaluation titles and compare before/after results. Approved examples can later guide the tagging prompt, but that requires an explicit integration and evaluation; the current model does not read inbox records.

Actual fine-tuning changes model weights and is a separate project: collect sufficient structured source/evidence/corrected-label examples with suitable permission, select a trainable model, split training/validation/test data, train and compare against the current system. Free-form recommendation opinions alone are not validated theme-extraction labels. Unreviewed comments must not be fed into prompts as instructions. No automatic training is implemented or claimed.

References: https://developers.cloudflare.com/d1/worker-api/ and https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/

## Validation
140 automated tests passed, including private-route authorization, invalid fields, parameterized storage, pending/rejected evaluation gating, missing configuration and rate-limit behavior. SQLite migration/default pending status checked in an in-memory SQLite database. TypeScript passed. See evidence/feedback-inbox-tests.txt and evidence/feedback-inbox-build.txt. Live database delivery remains unverified until activation.

## UI alignment
Library settings now sit immediately before the title/rating count at the right; Discover settings sit at the right of the Add & rate row. Both buttons are vertically centered.

