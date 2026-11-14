# Catalog backend

TMDB and Hardcover are configured in the Cloudflare Worker. IGDB remains inactive. The public frontend uses CATALOG_API_URL for this backend. Hardcover search and ID verification have passed live requests; book discovery remains on Open Library subject queries because Hardcover metadata-field requests failed in live checks.

Hardcover uses the encrypted runtime secret `HARDCOVER_TOKEN`. Its adapter sends fixed read-only GraphQL queries to `https://api.hardcover.app/v1/graphql`; it never accepts arbitrary GraphQL or accesses account/library data. Do not put tokens in repository variables, frontend environment variables, source files, or chat. Both raw tokens and tokens prefixed with `Bearer ` are accepted. See [Hardcover setup](https://docs.hardcover.app/api/getting-started/).

## Setup

1. Configure a Cloudflare Worker using `backend/wrangler.jsonc`. Frontend hosting remains GitHub Pages.
2. Set runtime secrets `TMDB_TOKEN` and `HARDCOVER_TOKEN` using `npx wrangler secret put NAME --config backend/wrangler.jsonc`. Enter values at the prompt. Use ignored `backend/.dev.vars` only for local testing.
3. Deploy with `npx wrangler deploy --config backend/wrangler.jsonc`. Check `/status`, then live-test Book/Movie/TV search, verification and discovery. Configuration booleans alone are not end-to-end proof.
4. Set the GitHub Actions variable `CATALOG_API_URL` to the public Worker origin and rebuild the frontend. Never expose provider secrets in frontend variables. Retain provider attribution.

IGDB/Twitch credentials are optional legacy support, not required for the current participant interface. Google Books is not configured.

## Endpoints and behavior

- GET /search?type=Movie|TV|Game|Book&q=... returns normalized records with metadata-derived tags.
- GET /verify?type=...&id=... re-fetches a record, bypassing response cache.
- GET /discover?type=...&tags=fantasy,adventure resolves supported provider genres/themes and fetches bounded candidates. Mosaic then applies its own shared-tag ranking. Unmapped custom tags may yield no matches; no fabricated tags are assigned.
- GET /status exposes configuration booleans only.

Only fixed upstream hosts and endpoints are used. Request IDs and query length are validated. Twitch tokens remain on the server. Search/discovery cache holds at most 100 responses for five minutes per isolate. A Cloudflare limiter allows 20 uncached requests per provider per minute per location; this is an approximate abuse limit, not global quota accounting. Catalog rate limits and errors remain possible. Origins are restricted to the GitHub Pages origin; CORS is not authentication.

`node scripts/build-api.mjs` bundles the Worker without credentials. `npm test` covers normalization, source URLs, wrong-category rejection, missing credentials, route validation, secret handling and rate limiting. The Worker does not host personal libraries or user accounts. Its private feedback database is separate.

## AI and private feedback

The `AI` binding supports bounded embeddings and reviewer tag analysis. `TAGGING_REVIEW_KEY` protects analysis and private inbox access; keep it as a runtime secret. See [AI tagging](../docs/AI-TAGGING.md). Rate-limit bindings are declared in Wrangler configuration.

The D1 database `mosaic-feedback` is bound as `FEEDBACK_DB`; initialize it using `backend/migrations/0001_feedback.sql`. The configured database ID is not a credential. Public cards no longer expose submission controls, but the backend and reviewer inbox remain. Validated submissions use parameterized SQL and deduplicate retries. Inbox access and decisions require the reviewer key; locking clears the interface and invalidates delayed responses.

Historical activation verified a test delivery (HTTP 200), `/status` configuration and unauthenticated rejection (HTTP 401) at commit `01133d429d3d5415448bcb63f7a62cdc146d0f68`. Authenticated browser review/reload still requires recorded verification. Exclude system-test rows from study analysis. Reviewer statuses do not train AI, publish tags or change ranking.

## Optional accounts (inactive)

Supabase code is prepared, not an operational feature of this release. To activate it, apply `backend/account-schema.sql`, configure email-code delivery, and supply public `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` build variables. Never use a service-role secret in the frontend. Verify row-level isolation between two accounts, guest snapshot merge, sign-out and cross-device restoration before claiming synchronization. Current library persistence remains local to the browser.
