# Evidence index

- `raw-tvmaze-search.json`: real public search response without normalization.
- `normalized-tvmaze-record.json`: selected ID reverified and normalized; match ID 38753 in the raw response.
- `stored-preferences.json`: generated test payload restored with production code, not personal library data.
- `automated-live-evidence.json`: capture timestamp, URL/query, status, count, assertions and profile.
- `browser-observations.md`: observed browser interactions and reload persistence.

Regenerate JSON using `node --experimental-strip-types scripts/verify-milestones.mjs`. The separate unit tests simulate failures; these JSON captures use the real network. See `docs/MILESTONES.md` for steps and limitations.

TVmaze attribution: https://www.tvmaze.com/api (CC BY-SA); source record https://www.tvmaze.com/shows/38753. The normalized record adapts provider metadata. The separate 25-title course catalog is explicitly hand-authored fixture data.
