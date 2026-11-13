# Mosaic

**Find your next story across books, movies and TV.**

Mosaic is a prototype that brings a person’s media preferences into one shared taste profile. It uses story metadata and content-based similarity to recommend titles within and across media types.

[Try Mosaic](https://anonymousxbelle.github.io/mosaic/) · [Roadmap](docs/IMPLEMENTATION-PLAN.md) · [User-study questions](docs/PARTICIPANT-QUESTIONNAIRE.md)

## Why this project exists

Someone who enjoys a book’s setting, themes or relationships might enjoy a television show for the same reasons. Mosaic explores those connections instead of solely treating each medium as a separate interest.

**Research question:** Can combining user preferences across multiple forms of media produce more relevant recommendations and help users discover media they would not otherwise explore?

## Using Mosaic

1. Search for a book, movie or TV show and select the correct catalog record.
2. Rate something you have experienced, or save an unfamiliar title for later.
3. Choose a discovery mode:
   - **For You** combines your ratings into a taste profile.
   - **Based On** uses one selected title’s story features as the starting point.
4. Explore matches, read their synopses and inspect their tags and match explanations.
5. Save or rate discoveries, dismiss unwanted titles, and refine your preferences.

"My Library" contains all saved supported titles, including mature titles. 
"Collections" connect saved titles through reused personal tags.

Ratings, shelves, personal tags and preferences are stored in the current browser. Search and discovery include general and mature titles by default. **Hide 18+ titles** filters known mature records; **Include 18+ titles** restores all titles. This does not hide saved library items. Unknown ratings are not a child-safety guarantee, and the toggle is not age verification.

Mosaic searches limited batches to keep requests and waiting times manageable. **Find more recommendations** appends another ranked batch without moving earlier results. Repeating the main discovery search with unchanged inputs instead explores further pages and omits earlier batches, helping users find different options. Providers can run out of eligible matches, so fresh results are not guaranteed.

## Catalog sources

| Source | Current use |
| --- | --- |
| TMDB | Primary movie and TV search, details, content ratings and discovery. |
| Hardcover | Primary book title search and supplementary book metadata. |
| Open Library | Book subject-based discovery, work details and search fallback. |
| Apple catalog / TVmaze | Fallback adapters in the codebase; not the primary configured search routes. |

IMDb links may appear, but Mosaic does **not** query an IMDb API. Google Books is planned and not connected.

The initial scope included games and music but the prototype was narrowed to books, movies and TV to focus on working catalog access and meaningful story-based matches. Game and music integration remain incomplete. Some schema fields, adapters and fixtures retain five-media support for future work; games and music are not currently offered to participants.

Catalog coverage, descriptions, author/creator credits, language and edition information vary. A provider’s missing field should not be interpreted as evidence that a work has no author, synopsis or relevant theme.

## Architecture and storage

- **Frontend:** React and TypeScript, built with Vinext/Vite and deployed as a static GitHub Pages site.
- **Catalog backend:** a Cloudflare Worker keeps provider credentials off the frontend and handles catalog requests, semantic comparison and reviewer tag analysis.
- **Personal data:** library and personalization state persist in browser storage. They do not automatically follow users across browsers or devices.
- **Reviewer tools:** the codebase includes a private D1-backed feedback inbox and local AI-tag review tools. Card-level feedback submission controls have been removed from the current participant interface; the user study uses a separate questionnaire.

Supabase integration code exists, but active account synchronization and shared community recommendations are not features of this release. Participant preferences are not sent to catalog providers as a full profile; search queries and applicable metadata are sent through the relevant workflows. AI tagging analyzes catalog text rather than personal star ratings.

## Documentation

- [How Mosaic works](docs/IMPLEMENTATION.md): retrieval, rating weights, ranking and AI roles.
- [Roadmap](docs/IMPLEMENTATION-PLAN.md): current priorities and future work.
- [Local development](docs/LOCAL-DEVELOPMENT.md): setup, checks and deployment.
- [Evidence and limitations](docs/EVIDENCE-AND-LIMITATIONS.md): verification, study versions and known constraints.
- [User-study questions](docs/PARTICIPANT-QUESTIONNAIRE.md) and [study plan](docs/USER-STUDY-PLAN.md).
- [Architecture](docs/ARCHITECTURE.md) and [backend setup](backend/README.md)
- [Week 4/6 verification](docs/MILESTONES.md) and [Week 8 experiment](docs/WEEK8.md)
- [Taxonomy editor](docs/TAXONOMY-EDITOR.md) and [submission checklist](docs/SUBMISSION-READINESS.md)

`components/` contains the interface, `lib/` contains normalization/retrieval/ranking, `backend/` contains the Worker, and `tests/` contains automated checks. Course pages (`/milestones/`, `/week8/`) use isolated fixtures; `/review/` holds reviewer experiments. Historical reports describe their recorded revisions.

## Data attribution

Movie and TV data: [TMDB](https://www.themoviedb.org/). This product uses the TMDB API but is not endorsed or certified by TMDB. Book data: [Hardcover](https://hardcover.app/) and [Open Library](https://openlibrary.org/). Fallback sources include [Apple](https://www.apple.com/itunes/), [TVmaze](https://www.tvmaze.com/api) and [Wikidata](https://www.wikidata.org/wiki/Wikidata:Licensing).
