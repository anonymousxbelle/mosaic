# UI state and scope audit: November 10

Public discovery supports Book, Movie and TV. Browser verification confirmed these are the only add-title choices. New libraries start empty. Five-media course fixtures remain in data/catalog.json and the isolated /milestones/ and /week8/ routes.

Removed unused game/music search copy. Book search disclosure includes Open Library fallback. Discovery now distinguishes loading, failure, partial outage, zero matches and success; failed searches no longer announce matches ready or suggest choosing nonexistent search options.

## Evidence and remaining checks
- Live browser verified empty library/onboarding, blank search guidance, punctuation-only validation, loading, and no-result recovery for qzxvplmn987654. See evidence/empty-search-live.png.
- 145 local tests passed including five discovery-state regressions. TypeScript passed.
- Controlled browser outage/recovery and exhaustive missing-synopsis cases remain pending. Automated message coverage is not live outage evidence.
- Supported-media copy and fixture separation are verified. Do not mark the entire UX audit complete yet.

## Testing steps
1. Use a fresh browser profile; do not erase a real library. Confirm zero titles and add-favorite onboarding.
2. Add media: blank input prompts two characters; !!! prompts letters/numbers. A nonsense query shows Searching then no matches. Add remains disabled.
3. Open Media type: only Book, Movie, TV. Enter must not select a suggestion automatically.
4. With a rated title, start discovery. Loading prevents another submission. Changing criteria hides old results.
5. In browser developer tools, block the catalog request, search, verify failure and retry. Unblock and retry. Block one provider to test partial availability separately. These controlled outage checks are still pending.
6. Scroll to a missing synopsis: loading should begin automatically; unavailable data offers the source link, request errors offer Retry synopsis.

## Feedback activation
Database mosaic-feedback and both tables were created. FEEDBACK_DB is configured in backend/wrangler.jsonc. Commit 01133d429d3d5415448bcb63f7a62cdc146d0f68 deployed successfully. Live /status reports feedback:true. A labeled SYSTEM TEST submission returned HTTP 200, receipt a93340f0-aa52-412d-a4a5-1320007f095a. Unauthenticated inbox returned HTTP 401. Owner-key browser review/reload remains pending; no automatic AI training is implemented. Exclude the test record from study results.

