# Feedback and resulting changes

This consolidates owner-reported participant observations and implementation changes. It is not a participant-results table. The [study reference version](USER-STUDY.md#archived-reference-version) predates subsequent changes; do not attribute earlier feedback to later fixes.

| Feedback | Current response / remaining work |
| --- | --- |
| Search was hard to find | Persistent Discover search beside Add & rate; choices appear while typing. Enter opens suggestions instead of silently selecting a title. |
| For You and Based On were unclear | Stronger mode-specific taglines. For You combines ratings; Based On starts from one title. The temporary combined explanation was removed. |
| Cards only showed shared tags | Cards show three descriptive tags, with the full categorized Mosaic tags in a dialog; match evidence remains separate. |
| Browsing felt endless | Numbered 12-result pages, with Find more for additional candidates. Each new batch is ranked and appended without moving earlier batches. This supersedes the intermediate global-reranking behavior. |
| Repeated searches felt repetitive | An unchanged repeat search continues provider retrieval and omits prior session batches; finite coverage can still produce no new matches. |
| Mature titles seemed missing | Search/discovery now includes general and mature titles by default. Hide 18+ filters known mature records; saved library titles remain visible. Earlier Main-only defaults are historical. |
| Hamilton's year was confusing | Owner found the title; investigate release/rerelease labeling rather than assuming it was absent. |
| Japanese title/description | Exact book unknown; unresolved. Evaluate English-edition selection and honest language fallbacks. |
| Sparse synopses/creator credits | Inline synopsis expansion and detail loading improve access; provider completeness and creator normalization still need work. |
| Feedback controls were confusing | Removed public card feedback controls. Study feedback uses the questionnaire; private reviewer infrastructure remains separate. |

## Retrieval diagnostic, November 12

Book queries use content-class and story-topic evidence, including specific sports, rather than requiring title-specific pairs. In the recorded Haikyu diagnostic, the earlier retrieval accepted 149 of 261 examined titles; the revised retrieval accepted four of 44, including two volleyball stories and two manga volumes. This is a live diagnostic across changing candidate pools, not a controlled relevance estimate or proof that all recommendations improved.

See [before](../evidence/haikyu-book-before-retrieval.json) and [after](../evidence/haikyu-book-after-retrieval.json). Incomplete series metadata remains a limitation.

## Historical detail

The [original feedback log](https://github.com/anonymousxbelle/mosaic/blob/d17cd66ce5782ec3d9def897f45c1f0c54b93ef9/docs/PARTICIPANT-FEEDBACK-LOG.md) preserves the sequence of intermediate decisions and their recorded checks. The table above resolves superseded behavior; [Implementation](IMPLEMENTATION.md) is the current behavior reference, and [Roadmap](ROADMAP.md) tracks open work.
