# Week 4 and Week 6 verification

Report finalized September 23, 2026; recorded browser/live checks September 22. The requirements below are demonstrated locally within the stated scope. This is not evidence that this revision has been deployed or that recommendation relevance has been measured.

## Before changes

Already implemented: Discover (For You / Based On), My Library with preferences, live autocomplete, ID verification before saving, star ratings, browser persistence and recommendation inputs. Books/movies/TV were visible; games/music intentionally hidden. The 25-title course catalog was a TypeScript fixture. Explicit themes/moods/creators/keywords fields, a current architecture diagram and paired raw/normalized milestone evidence were missing. Some README descriptions were stale.

## Results

| Requirement | Status and evidence |
| --- | --- |
| W4 architecture | Documented against source in [ARCHITECTURE.md](ARCHITECTURE.md), including optional services and separate audit storage. |
| W4 structured 25-title catalog | Implemented `data/catalog.json`; loader validates all 25 records. Browser rendered them. Automated checks establish five per type. No catalog rows embedded in the page component. |
| W4 frontend/navigation | Browser verified Discover, For You, Based On, My Library, preferences anchor and search/add dialog. |
| W4 preference flow | Main live favorite saved at 5 stars, changed to 4, survived reload; taste profile displayed its tags. Audit `hunger:5` persisted and fed shared profile/ranking functions. |
| W4 stored/retrieved evidence | [Stored test payload](../evidence/milestones/stored-preferences.json) restored with production storage code; [browser observations](../evidence/milestones/browser-observations.md) independently verify persistence. |
| W6 complete live workflow | Real TVmaze search returned two results; selected `tvmaze:38753`, normalized, reverified by ID and saved. Browser reload retained it. [Live report](../evidence/milestones/automated-live-evidence.json). |
| W6 shared schema | Explicit title/type/genres/themes/moods/creators/keywords across course records and production search/verification outputs. |
| W6 five media types | Five Book, Game, Music, Movie and TV records each validate against the same schema. These are curated course records, not five proven live UI integrations. |
| W6 invalid/empty/failure cases | Browser checked empty, punctuation-only and real no-result search. Unit tests injected HTTP 503 and malformed responses; errors are surfaced without fixture fallback. No real outage was induced. |
| W6 raw/normalized proof | [Raw response](../evidence/milestones/raw-tvmaze-search.json) beside [normalized selection](../evidence/milestones/normalized-tvmaze-record.json), matching ID 38753 (the 2024 show). |

## Scope and interpretation

The milestone page is a separate classroom verification workspace. It does not restore demo visuals to the product. Its key is `mosaic-milestone-evidence-v1`; the normal app uses `mosaic-library-v1`. The JSON catalog demonstrates structured storage and ranking execution, not the quality of the latest live recommendation system.

Unified schema includes `schemaVersion:1`, `id`, `title`, `type`, `description`, `genres`, `themes`, `moods`, `creators`, `keywords`, plus legacy `creator` and `tags`. Themes come from theme/trope tags; moods from tone tags; keywords retain tags. Unknown arrays remain empty. These deterministic classifications are not verified facts. TVmaze's network display credit is excluded from creators, because a network is not an author. Other legacy credits are retained without guessing or splitting combined names.

Still inactive or unverified here: Supabase login/cloud sync, shared community ratings/moderation, games/music discovery UI, comprehensive catalog coverage and measured recommendation quality. Existing adapters or fixtures are not marked as complete live integrations.

## Exact testing steps

From the repository, using Node 22.13+:

```sh
npm ci
npm run typecheck
npm test
node --experimental-strip-types scripts/verify-milestones.mjs
npm run build:pages
npm run dev
```

The live command requires internet and overwrites the four generated evidence JSON files. It asserts real HTTP 200, nonempty results, ID verification, schema/count validation and production storage restore. Provider results can change. Unit tests separately simulate errors.

1. Open `http://localhost:3000/milestones/`. Confirm 25 records across five types.
2. Rate The Hunger Games 5; expand **Stored preferences and computed profile**. Confirm `hunger:5` and survival/rebellion/dystopian/emotional each 1. Recommendations become nonempty. Reload and confirm persistence.
3. Search empty input, then `!!!`: expect minimum-length and letters/numbers errors respectively. Search `zzmosaicnomatchqxy987654`: expect no matching titles if the provider still returns zero.
4. Search `Avatar: The Last Airbender`. Inspect raw and normalized disclosures. Select `tvmaze:38753`; click **Verify & save selection**. Expect the success message. Reload and confirm its saved ID persists. The download button can export your run; download itself was not separately browser-tested.
5. Open `/`. Navigate Discover, For You, Based On, My Library and Edit taste & preferences; verify corresponding content appears.
6. With the local catalog API environment variable unset, Add a favorite → TV → search Avatar → choose Netflix 2024 → Add as a favorite. Confirm 5 stars in My Library and fantasy/adventure/action in the profile. Change to 4 stars, reload and reopen My Library; confirm 4 remains selected. Use a fresh browser profile if already saved, since duplicates are rejected.
7. The milestone unit test named `failed API and malformed responses` covers injected HTTP 503 and invalid response shape. Offline browser testing is not recorded as performed.

Recorded checks: typecheck passed; all 103 tests passed; Pages build exported `/` and `/milestones`. Build reported an advisory for chunks over 500 kB. See [evidence index](../evidence/milestones/README.md).

## Changed files

- `data/catalog.json`: structured curated records with provenance.
- `lib/catalog.ts`: JSON loader/count/schema validation.
- `lib/unified-media.ts`: explicit shared fields and validation.
- `lib/media-api.ts`: unified search/verification output, invalid-title handling.
- `lib/milestone-evidence.ts`: live capture and ID verification.
- `app/milestones/page.tsx`: isolated course catalog, ratings and live workflow.
- `scripts/verify-milestones.mjs`: reproducible real-network evidence.
- `tests/milestones.test.mjs`: schema, profile, metadata and failure tests.
- `docs/ARCHITECTURE.md`, `docs/MILESTONES.md`, `README.md`: current architecture, verification and entry-point documentation.
- `evidence/milestones/README.md`, `browser-observations.md`, `automated-live-evidence.json`, `raw-tvmaze-search.json`, `normalized-tvmaze-record.json`, `stored-preferences.json`: evidence and provenance.
