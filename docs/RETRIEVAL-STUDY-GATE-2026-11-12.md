# Retrieval changes and pre-study gate

## General changes
Main now explicitly says known mature titles are hidden, missing/incorrect ratings can let mature content through, and known mature titles belong in 18+.

No title names, IDs or recommendation pairs are embedded in ranking or retrieval code. A shared retrieval-context module distinguishes explicit fiction/nonfiction and reference/manual evidence. Provider labels and work-purpose phrasing are used conservatively; a character reading a manual is not enough to classify a novel as nonfiction. Conflicting or absent metadata remains imperfect.

Fiction seeds now add a fiction subject constraint to book queries across genres. Fantasy plus magic requirements remain combined. For sport-specific searches, the named sport replaces the redundant broad sports clause while retaining fiction. Central sport evidence in descriptions or specific source subjects can supply a query topic without inventing a new taxonomy tag. The same topic check is used in retrieval and ranking. Volleyball, basketball, baseball, football, soccer, tennis and swimming are supported; this is a bounded heuristic, not universal understanding.

Confirmed compatible content classes rank ahead of unknown classes in Recommended Based On. Unknown records are not automatically deleted, nor treated as confirmed fiction. Public For You gains applicable book-query behavior, but its multi-seed scoring is not replaced with AI. Week 8 pure cosine remains separate.

## Observed live comparison
Before: Haikyu book retrieval examined 261 unique titles, accepted 149, and only five ranked candidates had descriptions eligible for AI comparison. Weak leading candidates included fantasy with a sports tag, sports law and sports psychology.

After: examined 44, rejected 40, accepted four, all four compared by AI. The first two were All you've got and Jump serve, whose supplied descriptions concern volleyball teams and competition. Two Haikyu manga volumes also remained. This is a fresh live retrieval diagnostic, not a controlled participant study, proof of global precision, or the complete diversified UI result list. Incomplete series metadata is still a limitation; no series relationship was fabricated.

Evidence: evidence/haikyu-book-before-retrieval.json and evidence/haikyu-book-after-retrieval.json. Synthetic regression tests also cover mystery, romance, fantasy/magic, incidental sport mentions, wrong sports, unknown class, and fictional characters using manuals.

## Before distributing the study
Owner confirmed the acceptance/form/link checks below on November 12. Freeze evidence: docs/STUDY-FREEZE-v1.md.
- [x] Brief deployed acceptance pass: add/rate, bookmark without losing results, reopen a collection card, refresh location, Not interested exclusion, and one For You plus one cross-media Based On search.
- [x] Owner reported offline errors and retry work.
- [x] Preview the current Google Form on desktop/phone. Preserve the owner's edits. Confirm the activity asks for at least five ratings across at least two supported media types, then For You with All media.
- [x] Submit one clearly labeled TEST response; confirm it arrives, and exclude it from analysis. Verify the responder link works for someone other than the owner. Do not send the editor link.
- [x] Record deployed commit, taxonomy revision, normal ranking mode, enabled providers and date before real responses. Keep ranking/taxonomy stable during collection; record any emergency change and separate affected responses.
- [ ] Keep question scales consistent for relevance, discovery value, clarity and intent to try. General exploration feedback is optional. Distinguish intention from actual enjoyment; record not-yet-tried honestly.
- [ ] Explain that this study provides descriptive usefulness feedback. A claim that mixed-media profiles are *more relevant* than single-media profiles requires a defined comparison condition; this questionnaire alone does not establish that causal claim.

Then distribute the form and begin the presentation in parallel: problem, objective/research question, architecture/data, profile and cosine method, AI's limited role, live demo, observed results, limitations, challenges and next steps. Add real study results when they arrive. Do not delay presentation preparation until every response is collected.

The requested AI-ranking evaluation remains a separate task: same candidate pool, AI on/off, several genres and media pairs, before/after retrieval if later introducing web search. Web search is not enabled in this release.

