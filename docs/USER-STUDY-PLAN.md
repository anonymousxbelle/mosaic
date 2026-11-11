# Mosaic formative study and completion plan

## Workspace and scope

`/project/` contains a completion checklist, local study log, descriptive summary, JSON backup/import, CSV export and proposed UI cleanup. It is a project tool, deliberately absent from ordinary discovery navigation. It is not a private authenticated admin area. All entered data stays in the browser unless explicitly exported; no study submission API or Supabase collection is implied.

Do not mark milestones complete from a checkbox alone. The checklist requires evidence for Done and distinguishes implementation, verification, deployment and human evaluation. All checks start uncompleted; existing tests and deployments can be linked after confirming they meet each criterion. Deferred work does not inflate completion.

Confirm the course rubric, deadline and final media scope first. The proposed live product focuses on books, movies and TV; five-media fixtures are course evidence, not five live integrations. Login/synchronization, community moderation, automatic AI acceptance, formal age verification and live music/games remain conditional or later work unless the rubric requires them. Preserve these in PROJECT-BACKLOG.md rather than claiming completion.

## Study design

Recruit approximately 5–8 voluntary participants for a small formative study after a pilot. This sample can reveal usability and relevance problems; it cannot establish population-wide effectiveness. Follow any course-specific participant approval requirements before recruitment. Use adult volunteers for this initial study. No study has yet been conducted by this implementation.

Assign participant codes P01, P02, etc. The owner selected name/email collection in the study form: describe the study as confidential, not anonymous. Keep identity/contact data in a restricted response sheet and a separate code mapping; do not store it in Mosaic or GitHub. Explain the activity, what is recorded, that questions may be skipped, and how to request removal. Obtain permission before quoting feedback. Keep contact arrangements outside the exported study dataset. Decide a retention/deletion date with the course supervisor.

Use a paired design: each participant completes a same-media and cross-media session with the same starting title or profile. Alternate condition order across participants. Hold app commit, taxonomy revision, ranking mode, source, candidate-retrieval configuration and displayed result count constant. Cross-media results should explicitly target another supported medium. Capture the first five result IDs in rank order. Do not silently substitute a different seed to make a condition look better.

Task script:
1. Add a favorite title, rate it, and find recommendations Based On that title.
2. Open a recommendation, read the synopsis and explanation, and save one they might try.
3. Repeat with the other media condition. Record assistance, hesitation, errors and task completion.
4. Optionally test For You with multiple favorites as a separately labeled exploratory task; do not mix it into the paired comparison without noting that change.

Use identical questions for each condition, rated 1–5; unanswered is blank:
- Relevance: How well do these recommendations match what you liked about the starting title? 1 = not at all; 5 = very well.
- Discovery: How much did these results help you find appealing titles you did not already know? 1 = not at all; 5 = a lot.
- Explanation clarity: How clear was why Mosaic recommended these titles? 1 = very unclear; 5 = very clear.
- Intent: How likely are you to try at least one recommendation? 1 = very unlikely; 5 = very likely.
- Ease: How easy was it to find and save a recommendation? 1 = very difficult; 5 = very easy.

Ask: Which result fit best and why? Which fit least and why? What was confusing? What would you change? Record anonymous quotes only with permission. Observer completion is Yes (unaided), Partial (assistance) or No.

Follow up in 3–7 days: Did you actually try a recommended title? Which one? If yes, enjoyment 1–5 (very low to very high). No response remains pending; intent is not actual use, and missing follow-up is not rejection. Log the title and follow-up date in observation notes.

## Collating results

The log stores one observation per participant/condition, including order, version, source/profile reference, ranked IDs, task completion, five scales, follow-up and notes. Edit records rather than creating duplicate rows. Removal has an immediate undo; export backups before bulk editing/importing. JSON preserves checklist plus study; CSV contains study rows only and escapes spreadsheet formulas.

The workspace displays counts and means with their actual denominators, completed sessions and follow-up responses. It counts comparable pairs only when exactly two rows have opposite conditions and matching version/source. It does not yet calculate paired differences, confidence intervals or significance tests. Repeated sessions can overweight descriptive averages; the final analysis must identify or separate them.

Final report structure:
1. Participants, recruitment limitations, consent process and task setup.
2. Exact app/taxonomy/ranking versions and condition order.
3. Counts of completed tasks and unanswered questions per condition.
4. Individual paired cross-media minus same-media ratings, median/range and distribution; averages as a supplementary summary. Report only comparable pairs; list excluded cases and why.
5. Relevance and discovery findings tied to specific anonymous result IDs and metadata problems.
6. Qualitative themes: classify observations as retrieval, ranking, metadata, explanation, navigation or presentation. Include supporting anonymous quotes and contrary examples.
7. Follow-up tried/enjoyed counts with response denominators; do not infer enjoyment from intent.
8. Changes made from findings, with before/after evidence and regression checks. If versions changed mid-study, analyze those groups separately.

## Separate tagging accuracy evaluation

Review 15–20 varied titles across media and genres. Preserve the exact source, taxonomy revision, model ID, prompt version, suggested IDs and review decisions. Human reviewers label each suggestion correct, incorrect or uncertain and separately record important missing tags. Report correct/(correct+incorrect), uncertain count and category-specific counts. New-tag proposals and validation exclusions should be reported separately. This is precision on reviewed suggestions, not recall; recall requires an independently prepared reference tag set. Keep a held-out subset for evaluating prompt changes. Model confidence is not measured accuracy.

## UI review before participants

Current separation: algorithm controls, AI review and diagnostic evidence are in the reviewer/project workspaces. Public discovery supports books, movies and TV. See UI-STATE-AUDIT-2026-11-10.md for current verification and remaining checks; earlier cleanup observations are historical.

Keep the ordinary journey: For You / Based On / My Library, ratings, title search, target medium, Require versus Prefer, useful synopses, understandable reasons, sources and correction feedback. Keep required provider attribution. Move algorithms, vectors, reviewer keys and milestone evidence to dedicated project/reviewer routes; these routes still require server authorization for privileged operations. Do not use a visibility toggle as access control.

Review jointly in this order: empty-library onboarding; adding/rating; Based On; category and requirement filters; result details; saving; For You; error recovery; mobile and keyboard. Identify empty sections, overlapping borders, inconsistent media colors and confusing series choices. Agree a small set of fixes, then pilot the study. Preserve technical evidence elsewhere rather than deleting it.

