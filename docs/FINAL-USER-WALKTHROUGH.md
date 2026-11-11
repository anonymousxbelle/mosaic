# Pre-study walkthrough

Use a spare browser profile so your actual library is not disturbed. Record device, date, deployed commit, title, expected result, observed result and screenshot for failures. Do not mark a row passed without observing it.

1. **New visitor:** Open Mosaic. Expect an empty library, no demo titles and a prompt to add a favorite. Media choices are Book, Movie and TV.
2. **Search:** Open Add & rate. Leave blank, enter !!!, then a nonsense query. Expect guidance, validation and a no-results message respectively. Search a real title. Enter must leave choices open. Select the correct edition/title yourself.
3. **Rate:** Choose 5 stars and add. Confirm one library entry and one rated title. Reload: both survive.
4. **Bookmark:** Add a different title using Not yet. Confirm it appears under Saved for later. Rate it in the library; it must leave Saved for later and appear under Already experienced without becoming a duplicate.
5. **Based On:** Select a known title, choose its own medium, search. Check that explanations and synopses describe genuine similarities. Change to a different medium. Old results should hide until the new request completes.
6. **Filters:** Prefer a tag: candidates should reorder, not be excluded solely for lacking it. Require a tag: all results must have it. Remove requirements if none match. Exclude must be honored.
7. **More:** If Find more recommendations appears, note the first three titles and click it. Existing cards stay visible and in order; newly fetched matches append without duplicates. A new page can yield no eligible titles; click again if another page remains. At the per-search page budget, the app must not claim the whole catalog is exhausted.
8. **Card actions:** Expand Continue reading: one continuous paragraph, no repeated opening. Show less collapses it. Save/rate another card without losing the search. Not interested hides the title; check its library shelf. Remove a library title only after reading and confirming the removal dialog.
9. **For You:** Rate several titles. Search, then change a rating and search again. Record whether order/profile changes; one change need not always change the top result. No positive profile should show onboarding rather than fabricated personalization.
10. **Tagging:** In reviewer mode, analyze a title. Central genre/subgenre requires story-defining evidence; substantial subject/theme can be secondary. Incidental mentions should not be suggested. Pending/rejected tags stay inactive; accepted approved tags enter matching. Read the exact quote, not just the confidence number. An estimate is not measured accuracy.
11. **Public feedback:** Open Details & feedback, select a type, enter SYSTEM TEST, explicitly choose to send to the project owner and submit. Confirm the delivered message. Local-only feedback should not appear remotely.
12. **Owner inbox:** Open /review/, enter the existing reviewer key privately and open the inbox. Locate SYSTEM TEST, mark Reviewed, add a note, save, lock/unlock and reload to verify persistence. Leave evaluation approval off for test records. Do not put the key in chat or screenshots. Without the key the inbox must not load.
13. **Failure recovery (desktop):** Open browser developer tools -> Network -> Offline. Attempt a new search. Expect a visible failure and retry action, not matches ready. Restore No throttling/Online and retry. Close/reopen the dialog if necessary. Do not clear your stored data. Partial-provider failures need a separate request-blocking test; do not disable the actual production service.
14. **Missing metadata:** Find an item without artwork or synopsis. Expect a readable fallback; synopsis hydration starts on approach/scroll. A failed synopsis request offers retry; unavailable source data does not fabricate text.
15. **Keyboard/mobile:** Use Tab and Shift+Tab through search, rating, results and dialogs. Focus is visible; Escape closes dialogs and focus returns to the trigger. Check phone width for clipped text, overlapping controls and usable buttons.

## What to send back
Use: step number; title; browser/device; what you clicked; what happened; what you expected; screenshot if helpful. Say Passed, Failed or Not tested. Report both result quality and interaction problems.

## Study form
Draft editor: https://docs.google.com/forms/d/1OpdAc-28Jzrhg_WEau10KmTUZekG9Z9GQ-C5WvgflR4/edit
Created with names/email, task identification, five evaluation scales, written feedback and follow-up/quotation preferences. Still unpublished: review wording/settings and preview before sending participants a responder link. The editor link is not the participant link. No invitation has been sent.

