# Browser observations — September 22, 2026

Executed via browser UI against localhost:3000. This is a written observation record, not a screenshot archive or replayable browser suite.

| Action | Observed result |
| --- | --- |
| Open milestone page | 25 JSON records, five media types. |
| Rate Hunger Games 5; reload | `hunger:5`; survival/rebellion/dystopian/emotional each 1 persisted. |
| Inspect ranking | Nonempty results including The Resistance, Severance, For Emma, Interstellar and Arcane. This proves execution, not relevance. |
| Empty search | Type at least 2 characters. |
| Search !!! | Enter a title or creator containing letters or numbers. |
| Search zzmosaicnomatchqxy987654 | HTTP 200, zero results, no matching titles. |
| Search Avatar: The Last Airbender | HTTP 200, two results: 38753 and 555. |
| Verify/save 38753 | Verified by provider ID and saved: Avatar: The Last Airbender. |
| Reload | savedIds retained tvmaze:38753 beside course rating. |
| Main navigation | Discover/For You/Based On/My Library worked; preferences anchor revealed preferences. |
| Main TV search for Avatar | TVmaze autocomplete included Netflix 2024 and Nickelodeon 2005 editions. |
| Add Netflix edition as favorite | Success message, 1 rated, 5-star button pressed; profile fantasy/adventure/action. |
| Change to 4; reload; open My Library | Same title remained; 4-star button pressed. |

The main test used an initially empty localhost library, not the user's production-site library. HTTP failure handling was simulated in Node tests, not through an actual provider outage.
