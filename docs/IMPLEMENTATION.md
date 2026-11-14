# How Mosaic works

[Back to README](../README.md) · [Roadmap](ROADMAP.md)

This document explains current behavior: retrieval, recommendation ranking and AI roles. The [roadmap](ROADMAP.md) tracks remaining work and future proposals; those are not promises of existing functionality.

## How recommendations work

### 1. Retrieve candidates

Mosaic queries a bounded set of provider pages. Genre, topic and story-context constraints help retrieve relevant candidates, and eligibility checks remove unsuitable records before ranking. It does **not** download or compare an entire provider catalog.

### 2. Normalize the records

Provider records are converted into a shared schema containing title, media type, description, genres, themes, moods, creators and keywords, alongside source identifiers and links.

Mosaic’s editable taxonomy distinguishes fiction/nonfiction, genres, subgenres, subjects, themes, tropes, settings, tone, audience and format. Provider labels and description patterns supply automatic tags; users can correct or supplement them. Missing metadata and inferred tags can be wrong.

### 3. Build the query and score matches

Normal **For You** uses positive rating weights of 3 for five stars, 2 for four stars and 1 for three stars. One- and two-star ratings add no positive profile weight; separate preference logic can apply genre penalties. Saved-but-unrated titles are bookmarks, not positive taste signals.

**Based On** uses the selected title as its query. Both modes use content features and cosine similarity, but normal recommendations are not a pure cosine-only list. Eligibility, story compatibility, preference adjustments and series grouping also matter. In the default Based On ranking, core story compatibility precedes the score; provider and available AI evidence make smaller contributions within that ranking.

Each fetched batch is ranked, then appended and displayed 12 results per page. Batch 1 stays in place when batch 2 arrives—even if a new candidate has a higher score. Rankings therefore apply **within each batch**, not globally across every page. Shared-tag counts alone do not determine rank, and similarity is not a probability of enjoyment.

An isolated [signed-cosine experiment](COSINE-EXPERIMENT.md) tests a different rating rule: 5 stars = +2, 4 = +1, 3 = 0, 2 = −1 and 1 = −2. Negative values subtract features from its profile. This teaching/reviewer experiment is separate from the normal For You weights above.

## What AI does

| Workflow | Current role |
| --- | --- |
| Based On description comparison | Workers AI embeddings compare the source synopsis with a bounded shortlist of up to 24 candidate descriptions. This supplements other matching evidence. |
| Reviewer tag analysis | A language model proposes tags with evidence, confidence estimates and provenance. Suggestions require review; new taxonomy labels require a separate taxonomy decision. |
| Normal For You | Uses the combined feature profile without a fresh AI description-comparison request. Accepted tags can contribute to its features. |

## Tag centrality and retrieval limits

A genre should describe the story, not an incidental mention. Broad automatic sports tags require central plot evidence or an explicit provider label; a specific sport can be a subject without making the work sports fiction. Manual and accepted reviewer tags remain deliberate overrides. These are conservative rules, not complete semantic understanding.

AI analysis asks for central or substantial evidence across taxonomy facets; genre/subgenre suggestions must be central. See [AI tagging](AI-TAGGING.md) for review and validation.

Continuation tracks provider cursors and retries failed pages without restarting successful ones. Provider page budgets are finite; an empty additional batch does not prove the whole catalog is exhausted. Reviewer-only pure cosine sorts its full pool by score, unlike normal discovery's stable batch append. See [the experiment](COSINE-EXPERIMENT.md).
