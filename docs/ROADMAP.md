# Roadmap

This is the single list of remaining work and future proposals. [Implementation](IMPLEMENTATION.md) describes existing behavior; this page does not promise unbuilt features.

## Current priorities

- Verify the latest search, rating, bookmarking, pagination, keyboard and mobile journeys using [Testing](TESTING.md). Preserve earlier batches when fetching more.
- Improve book metadata: compare Google Books, Hardcover and Open Library on matched works/editions before changing provider priority. Google Books is not integrated or configured yet.
- Repair missing creator normalization, prefer available English metadata and clarify original-release versus rerelease dates. The Japanese-language book report still lacks a reproducible title.
- Evaluate retrieval coverage separately from ranking. Test multiple genres and media pairs, including story-defining settings and sports fiction; avoid title-specific recommendation rules.
- Compare AI-assisted and non-AI ranking on the same candidate pools. Measure reviewed-tag precision, coverage and centrality on held-out examples.
- Report participant results with denominators, missing answers and tested versions. Follow up on actual consumption separately from intent to try; see [User study](USER-STUDY.md).

## Deferred requests

- Optional account synchronization: activate Supabase only after isolation, guest merge, sign-out and cross-device tests.
- Shared community ratings and collaborative recommendations; feedback-informed prompt improvements require explicit implementation and evaluation, not automatic training.
- Age verification appropriate to the intended audience; the current mature-content switch is only a catalog filter.
- Games and music: investigate IGDB, Spotify, Google/YouTube music options and permitted metadata access before restoring public controls. Five-media fixtures are not live support.
- Web-assisted candidate retrieval, with identity verification, provenance, cost controls and measured improvement.
- Clickable genre/tag browsing and further taxonomy/collection usability improvements.

## Planning history

Older requests and experimental targets remain in [the original backlog](https://github.com/anonymousxbelle/mosaic/blob/d17cd66ce5782ec3d9def897f45c1f0c54b93ef9/PROJECT-BACKLOG.md) and [recommendation proposal](https://github.com/anonymousxbelle/mosaic/blob/d17cd66ce5782ec3d9def897f45c1f0c54b93ef9/RECOMMENDATION-PLAN.md). Their statuses are historical; use this roadmap and the current implementation guide for present scope. The documentation consolidation replaces the separate submission-readiness checklist; it does not certify that outstanding tests have passed.
