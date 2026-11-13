# Main search: mature collection prompt

Study v1.1 UI hotfix, November 12, 2026. Publish commit containing this document identifies the update; deployment time is recorded in GitHub Actions. The study-v1 archive remains unchanged. Disclose subsequent participant observations as v1.1. Ranking, taxonomy and providers are unchanged.

When a successful Main search returns no visible titles, the add-title dialog suggests checking the 18+ collection. The button switches the collection and repeats the search, preserving the entered query and media type. It does not claim that a matching mature title definitely exists. Loading, invalid input and API failures do not show the prompt.

Manual checks:
1. In Main, search TV for Fate The Winx Saga. After the search finishes, expect the prompt.
2. Select Check the 18+ collection. The dialog should remain open with TV and the same query, and return the title.
3. Confirm successful Main searches, empty input, loading and failed requests do not show the prompt.

Validation: TypeScript typecheck and Pages build passed. Browser interaction not yet verified.

