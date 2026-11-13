# Participant feedback log

Owner-reported observations, November 12, 2026. These are qualitative reports, not measured study results. No participant names are recorded here. Keep the frozen study-v1 baseline separate from later UI changes.

| ID | Feedback | Evidence / interpretation | Status / next action |
| --- | --- | --- | --- |
| UX-01 | Add a visible search field beside Add a favorite. | Participant suggestion relayed by owner. | Published update prepared November 13, 2026: choose Book/Movie/TV, enter title, then press Enter or Add a favorite to open matching results. No result is automatically selected. The commit containing this log identifies the publication; GitHub Actions records deployment time. Type-checking and Pages build passed. |
| UX-02 | Fate: The Winx Saga was missing from Main search. | Live result is TV-MA; Main hides it. | Published a reminder and 18+ switch preserving query/type; reminder now appears above results even when Main returns other titles. Commits 7d16efe and 60e62c6. |
| UX-03 | Hamilton appeared missing under Movies. | Owner confirmed the displayed 2025 year caused confusion; the filmed musical was present. | Search works. Open: investigate original-release versus rerelease dates and clearer year labels. Do not hardcode a title-specific date. |
| DATA-01 | A title and its synopsis appeared in Japanese. | Owner thinks it was a book; exact title unknown. Not independently reproduced. | Open: inspect book language metadata and English-edition selection. Prefer available English descriptions, preserve original title as secondary metadata, and clearly label unavailable translations. Do not silently fabricate or translate descriptions. |

## Verification for UX-01
- Choose TV, enter a title, press Enter: dialog retains TV and query and presents selectable results.
- Button with empty query opens the existing search dialog.
- Select a result to use the existing rating/save flow.
- Check keyboard navigation and narrow-screen wrapping.

## Study handling
Record deployment commit/time when publishing new changes; disclose post-freeze changes with v1.1 observations. Language filtering remains a proposed refinement, not a deployed retrieval change.


## Follow-up: discovery navigation and result browsing
- Search placement correction: the first implementation appeared only during onboarding. Move the visible field to Discover's persistent Add & rate a title row so returning users see it too; retain the simple onboarding button to avoid duplicate fields.
- Mode clarity: show both definitions together directly beneath the mode controls. For You combines ratings across titles; Based On uses one chosen title.
- Existing continuation: Find more recommendations already reveals another 30 buffered results or fetches more provider candidates when available. It is not numbered pagination; a long initial batch can still feel like endless scrolling.
- Participant requested full title tags as well as shared tags and quicker category access. Open: clarify genre versus media type; consider compact pagination and separate descriptive tags from match explanations.
