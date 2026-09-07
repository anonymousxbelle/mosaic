# Mosaic

A cross-media recommendation prototype for CSCI 310 Junior Seminar. Explore connections across books, music, games, movies, and TV.

## Run locally

Requires Node.js 22.13 or later and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by the server. No API keys or account connections are required for this first milestone.

```sh
npm test
npm run typecheck
npm run build
```

## Implemented

- Search a 25-title demonstration catalog spanning five media categories.
- Rate and remove ratings; ratings last for the current page session.
- For You: combine positive preferences into a unified taste profile.
- Based On: use one selected title as the recommendation query.
- Filter recommendations by destination media category.
- Display matching tags and a cosine similarity score.
- Responsive, keyboard-accessible interface using React, TypeScript, and Base UI components.

## Recommendation method

Each title uses binary features from a shared tag vocabulary. For ratings 3, 4, and 5, the positive-preference weights are 1, 2, and 3. Ratings 1 and 2 contribute no positive features. The profile is the weighted average of item features. This first version does not yet model explicit negative preferences.

Cosine similarity is dot(query, candidate) / (norm(query) * norm(candidate)). Empty vectors return zero. Results with zero similarity are omitted. For You excludes all rated titles. Based On excludes its seed title; select a different media category for cross-media discovery. Equal scores are sorted by title.

The percentage shown is a similarity score, not a probability, accuracy measure, or evidence of recommendation quality. Profile theme percentages represent weighted feature presence.

## Source map

- `app/page.tsx`: discovery UI and session state.
- `app/globals.css`: responsive visual design.
- `lib/catalog.ts`: illustrative manually authored catalog.
- `lib/recommendations.ts`: independent, deterministic recommendation functions.
- `tests/recommendations.test.mjs`: numerical and ranking tests.
- `.github/workflows/ci.yml`: automated tests, type checking, and production build.

React runs on the Vinext/Vite starter. The production adapter targets Cloudflare Workers through Sites; the entire application source is ordinary Git-tracked code and can live in GitHub. Sites' deployment source repository is separate from your GitHub repository.

## Next milestones

1. Add a backend API and persistent media/ratings database.
2. Integrate one real catalog API, normalize metadata, and implement reproducible rule-based tagging.
3. Expand media coverage, measure tagging quality, and improve music-specific features.
4. Add single-media versus cross-media evaluation, participant feedback, and exportable results.
5. Consider optional AI-assisted tagging only after establishing the non-AI baseline.

No live media API integrations, login, persistent user storage, AI tagging, or user-study results exist yet. Sample descriptions and tags are illustrative and need validation before research use.

## GitHub

This directory is intended to be the repository root. Keep `.env*`, dependencies, generated builds, and credentials out of Git. Set a GitHub remote named `origin` once a repository is available. Do not mistake the Sites deployment remote for GitHub.

## Validation notes

The local route was checked for a successful HTTP response. Broader browser interaction testing was not performed. The optional WebMCP surface is feature-detected; no supported validation context was available in this build session.
