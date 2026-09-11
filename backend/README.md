# Catalog backend

TMDB and Hardcover are configured in the Cloudflare Worker. IGDB remains inactive. The public frontend uses CATALOG_API_URL for this backend. Hardcover search and ID verification have passed live requests; book discovery remains on Open Library subject queries because Hardcover metadata-field requests failed in live checks.

Hardcover uses the encrypted runtime secret `HARDCOVER_TOKEN`. Its adapter sends fixed read-only GraphQL queries to `https://api.hardcover.app/v1/graphql`; it never accepts arbitrary GraphQL or accesses account/library data. Do not put tokens in repository variables, frontend environment variables, source files, or chat. Both raw tokens and tokens prefixed with `Bearer ` are accepted. See [Hardcover setup](https://docs.hardcover.app/api/getting-started/).

## Setup

1. Register a [TMDB account](https://www.themoviedb.org/signup), then request a developer API key in account Settings → API. Keep the API Read Access Token for server use.
2. Register a [Twitch developer app](https://dev.twitch.tv/console/apps), enable account two-factor authentication, and choose a confidential client. Keep its client ID and secret. See [IGDB setup](https://api-docs.igdb.com/#account-creation).
3. Use a Cloudflare Workers account to deploy `backend/wrangler.jsonc`. The frontend stays on GitHub Pages. Check that rate-limit namespace 31001 is unused in the account before deploying.
4. From the project root, securely set Worker secrets with `npx wrangler secret put TMDB_TOKEN --config backend/wrangler.jsonc`, then repeat for IGDB_CLIENT_ID and IGDB_CLIENT_SECRET. Enter values at the terminal prompt, never in committed files or chat. For local development only, use ignored `backend/.dev.vars`.
5. Deploy using `npx wrangler deploy --config backend/wrangler.jsonc`. Confirm /status reports both providers configured, then live-test search, verification and discovery for Movie, TV and Game.
6. Complete TMDB's [required logo attribution](https://developer.themoviedb.org/docs/faq) in the site's credits before activating this provider; the required endorsement notice is already conditional in the footer.
7. Set GitHub repository Actions variable CATALOG_API_URL to the deployed HTTPS origin, and rerun Publish Mosaic. This is a public endpoint URL, not a secret. The build embeds it as NEXT_PUBLIC_CATALOG_API.

## Endpoints and behavior

- GET /search?type=Movie|TV|Game|Book&q=... returns normalized records with metadata-derived tags.
- GET /verify?type=...&id=... re-fetches a record, bypassing response cache.
- GET /discover?type=...&tags=fantasy,adventure resolves supported provider genres/themes and fetches bounded candidates. Mosaic then applies its own shared-tag ranking. Unmapped custom tags may yield no matches; no fabricated tags are assigned.
- GET /status exposes configuration booleans only.

Only fixed upstream hosts and endpoints are used. Request IDs and query length are validated. Twitch tokens remain on the server. Search/discovery cache holds at most 100 responses for five minutes per isolate. A Cloudflare limiter allows 20 uncached requests per provider per minute per location; this is an approximate abuse limit, not global quota accounting. Catalog rate limits and errors remain possible. Origins are restricted to the GitHub Pages origin; CORS is not authentication.

`node scripts/build-api.mjs` bundles the Worker without credentials. `npm test` covers normalization, source URLs, wrong-category rejection, missing credentials, route validation, secret handling and rate limiting. No user accounts/database are implemented by this Worker. Those require a separate authentication and persistence milestone.
