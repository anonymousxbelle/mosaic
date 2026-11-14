# Local development and deployment

[Back to README](../README.md) · [Backend setup](../backend/README.md)

## Run locally

Requires **Node.js 22.13 or later** and npm.

```sh
npm ci
npm run dev
```

For the configured catalog backend, create an ignored `.env.local` file containing the public Worker origin:

```dotenv
NEXT_PUBLIC_CATALOG_API=https://YOUR-WORKER.workers.dev
```

Use your own deployed Worker or an explicitly authorized service. Without a configured backend, some public fallback searches remain available, but this is not equivalent to the deployed application. API tokens belong in Worker secrets or an ignored local backend secrets file—not in `NEXT_PUBLIC_*` values or committed files.

Validation commands:

```sh
npm run typecheck
npm test
npm run build:pages
```

GitHub Actions validates pushes to `main` and publishes the Pages build. The frontend build receives its public backend URL through the repository’s `CATALOG_API_URL` variable. The Worker is deployed separately using `backend/wrangler.jsonc`.

See [backend setup](../backend/README.md) for implementation details. IGDB is not required for the current Book/Movie/TV interface.
