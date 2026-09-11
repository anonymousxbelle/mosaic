# Recommendation systems for Mosaic

## Recommendation

Mosaic should develop an **evaluated hybrid recommender**: provider-filtered retrieval, structured genre and topic matching, semantic comparison of descriptions, and a small amount of diversity. Shared community behavior should become an additional signal when reliable interaction data exists. The immediate priority is measuring where good titles disappear, then improving their representation and ranking.

The current application has a useful foundation. It already separates retrieval from ranking, uses weighted cosine similarity, preserves genre and sport constraints, and removes repeated works. Its main weaknesses are incomplete metadata, loss of provider rank after retrieval, heuristic feature weights, and the absence of a judged relevance benchmark. Replacing cosine with a fashionable model would not address all of these problems.

Cross-media recommendation is an established research topic, usually studied under **cross-domain recommendation**. However, predicting a user's preferences in another domain and finding a thematically similar story in another medium are different tasks. Mosaic should explicitly support and evaluate both, beginning with the second because it can operate without a large community.

This report distinguishes established findings, observations from the application, and proposed experiments. Proposed weights, sample sizes, and rollout gates below are engineering starting points, not published guarantees. The implementation audit refers to repository revision `fb6b48cd4d1a0596e26ac07b788b181e87df1df4`; source availability was checked on September 11, 2026. No new recommendation algorithm was deployed as part of this research.

## 1. How recommendation systems work

### Retrieval, ranking, and list construction

A recommender normally needs to answer three questions: which items deserve consideration, how should those items be ordered for this request, and does the resulting list provide a useful experience? YouTube's 2016 research describes separate candidate-generation and ranking stages. That architectural distinction is relevant to Mosaic even though its neural networks and industrial training data are not an appropriate starting point here.[^1]

For Mosaic, retrieval might ask a book catalog for fantasy involving magic, take related television titles from TMDB, and search a local metadata index. Ranking then compares those candidates with the selected title or personal profile. List construction removes duplicate editions and prevents one franchise from occupying every position.

An excellent ranker cannot promote a title that was never retrieved. Conversely, fetching more records does little if inaccurate metadata makes the strongest matches look irrelevant. These are separate failure modes and need separate measurements.

### The main approaches

| Approach | What it compares | Useful in Mosaic | Main dependency or weakness |
|---|---|---|---|
| Provider relevance/popularity | The provider's own ordering for a query | Strong baseline and one input signal | Not necessarily personalized; different endpoints mean different things |
| Content-based matching | Genres, subjects, themes, descriptions | Works for new users and new titles with metadata | Missing or ambiguous features; can repeat familiar patterns |
| Collaborative filtering | Patterns in multiple people's interactions | Finds associations that metadata misses | Needs shared ratings or behavior and sufficient overlap |
| Knowledge-based matching | Explicit relationships and constraints | Adaptations, series, basketball, magic schools | Relationships need reliable evidence and maintenance |
| Hybrid recommendation | Several of these signals | Best practical architecture to test here | Signals need normalization, evaluation, and fallbacks |

Item-based collaborative filtering derives item similarity from users' ratings rather than from descriptive tags. The classic Sarwar et al. paper establishes this distinction; Amazon's account of its own system also describes item-to-item associations.[^2][^3] A book and film can therefore be associated because the same people enjoy them, even if their metadata overlaps little. A high average rating alone cannot establish that association.

Matrix factorization compresses an interaction table into learned user and item vectors; two-tower systems learn separate representations that can be compared efficiently. Sequential models additionally use the order of interactions. These are useful concepts for later development, but a new Mosaic installation does not have the training histories required to make them a convincing first improvement. The cross-domain survey catalogs how methods depend on overlapping users, items, or auxiliary information.[^4]

### What cosine does—and does not do

Cosine measures the direction of two vectors: `dot(a,b) / (length(a) × length(b))`. It is a comparison function, not a source of knowledge. In today's Mosaic, vector coordinates are tags. With a text embedding model, coordinates would instead be learned semantic features. Both representations can use cosine.

Sentence-BERT demonstrates how independently computed text embeddings can support efficient semantic similarity with cosine.[^5] This is relevant because two descriptions may express similar ideas using different vocabulary. It does not establish that text similarity equals enjoyment, or that any off-the-shelf embedding model will improve Mosaic.

A fantasy novel about young people learning magic may resemble another such novel even when only one provider supplies a “magic school” tag. Semantic text comparison is a candidate solution to this vocabulary gap. It still needs the genre and intent safeguards that stop an incidental mention of friendship from overpowering the central subject.

## 2. Research specifically about cross-media recommendations

### The terminology matters

Cross-domain research can involve different media, different shops, or even different categories inside one medium. A paper about transferring preferences between two product categories is not automatically evidence about book-to-anime discovery. Likewise, “multimodal” can mean combining a film's poster and synopsis; it does not necessarily mean recommending a film from a book.

For Mosaic, distinguish three outcomes: **similar experience** across media, **personal preference transfer** across media, and **explicit relationships** such as an adaptation. Keep these separate in both the interface and evaluation. A Harry Potter adaptation is an obvious relationship; finding an unfamiliar fantasy story is a different discovery achievement.

### Relevant evidence and its limits

| Research | What was studied | Useful implication | Limit on application |
|---|---|---|---|
| Tan et al., 2014, *Cross domain recommendation based on multi-type media fusion* | A topic-model approach combining descriptions, user text, and ratings for cross-media transfer | Combining several kinds of evidence has direct precedent | Publisher abstract and indexed excerpts were accessible; full text was blocked, so no numerical result is relied on |
| Zang et al., 2022, cross-domain survey | Taxonomies, methods, and datasets, including media domains | Decide what information actually connects the domains before choosing a model | Survey evidence is not a measured result for Mosaic |
| Liu et al., 2025, *Uncovering Cross-Domain Recommendation Ability of Large Language Models* | Prompted transfer across Amazon categories including Movies & TV, Video Games, and CDs & Vinyl | Domain relationships and candidate construction matter even with LLMs | Selected active users and small sampled candidate sets differ substantially from open-catalog discovery |
| Feijer et al., 2025, Spotify calibration | Adapting the balance of music and podcast shelves to context | The desired media mix is a separate decision from ranking within a medium | Shelf engagement on a large streaming platform is not a test of book-to-film story similarity |
| Kaur and Goyal, 2025, audiobook cold start | Transferring music/podcast history toward audiobook recommendations using a two-tower design | Transfer can help a new medium when source-domain histories already exist | Mosaic currently lacks those histories and trained representations |

The original media-fusion paper explicitly combines item descriptions, user-generated text, and ratings through a Bayesian topic model.[^6] It is direct evidence that the general idea of connecting entertainment media has been studied; it is not a reason to implement its older LDA model without comparison against simpler modern baselines.

The LLM4CDR study is particularly instructive because it exposes its evaluation setup. Its default candidate list contains 20 items, uses random negative sampling, and evaluates at most 100 selected users per experiment. It filters to shared users with substantial history; changing the candidate list size changes the reported results.[^7] Its findings justify an experiment with grounded LLM reranking, not a claim that an LLM will retrieve the best items from every provider.

Spotify's paper reports deployed contextual calibration and online gains, but its evaluated choice concerns music versus podcast shelves and short-term engagement.[^8] Mosaic can borrow the principle of respecting current intent without implementing a contextual bandit. An explicit “Books,” “Anime,” or “Across media” choice is a much simpler source of intent at this stage.

The audiobook study describes frozen domain-specific user representations and an adaptive fusion mechanism. It reports approximately 10% improvement in first audiobook listens against a popularity baseline in its own setting.[^9] That result depends on an established service's data and should not be projected onto Mosaic.

**Research conclusion:** meaningful cross-media recommendation is feasible, but there is no universal mapping from one genre label to another medium. Shared concepts, explicit relationships, and behavioral overlap each provide different kinds of evidence.

## 3. What Mosaic actually does today

These are code observations, not literature claims. Relevant files are `lib/recommendations.ts`, `lib/retrieval.ts`, `lib/media-api.ts`, `lib/book-api.ts`, `lib/features.ts`, `lib/genres.ts`, and `app/page.tsx`.

| Stage | Current behavior | Consequence |
|---|---|---|
| Catalog retrieval | Up to three query plans and three pages per plan; stops after a completed round reaches 30 preferred eligible items | A bounded candidate pool, not an exhaustive catalog search |
| Provider filtering | Open Library subject clauses; TMDB genre/keyword filters; an additional related-title route | Better candidates than title searches for genre words |
| Eligibility | Genre/topic, content section, exclusions, and shared-tag evidence | Preserves relevance rules but can reject incompletely tagged matches |
| Representation | Normalized tags and genres, plus heuristic extraction from descriptions | Semantics are compressed into a limited vocabulary |
| Ranking | Weighted tag cosine, matching penalties, and a same-medium/anime tier | Explainable, deterministic, but manually tuned |
| Personal profile | Ratings 3–5 add positive tag weights; 1–2 add no positive weight | Preferences are represented by one aggregate positive vector |
| Negative feedback | Separate per-medium genre penalties for excess low ratings | Some negative feedback exists, but it is coarse |
| List construction | Work deduplication and penalties for repeated series, creators, type, and tag overlap | Reduces repetition within the existing priority tiers |
| Community | Supporting code exists; shared service is not active | No live “similar people enjoyed this” signal |
| Cache | Up to 400 normalized browser-memory records, ten-minute lifetime | Useful reuse, not a durable searchable catalog |

### The most important weaknesses

**Provider rank is discarded as a final scoring feature.** It influences which records arrive before retrieval stops. After that, the final ranking uses tags and heuristics, with alphabetical tie-breaking. Preserving provider order during ingestion is not the same as using it in final ranking. This is a good first experiment because it responds directly to the concern that the provider may know more than the local ranker.

**Unknown tags can become false exclusions.** A relevant basketball story with sparse subjects can fail a strict basketball check. Relaxing the topic would violate the intended behavior; enriching uncertain records before the final gate is the better experiment. An unknown should remain distinguishable from a confirmed mismatch.

**Adding tags is not guaranteed to improve a score.** Extra nonmatching tags increase the cosine denominator. Two equally relevant records with different metadata richness can therefore rank differently. In addition, applying a specificity weight on both vectors squares its contribution to the dot product. These are properties of the current formula, not necessarily bugs, but they deserve explicit tests.

**Correlated labels can be counted repeatedly.** Sports, basketball, sports anime, and sports drama carry overlapping information. Multiple accurate labels are useful for browsing, but need not represent four independent reasons for a match. Field grouping and feature-family normalization can reduce this effect.

**The primary genre is a heuristic.** It comes from the first supported strong genre in the normalized genre/tag order, with fallbacks. That order is not evidence that the provider judged the genre most important. Mixed works need a confirmed anchor or multiple supported anchors.

**A single profile can blur separate interests.** Enjoying fantasy novels and sports anime does not imply a desire for every candidate to combine both. Multiple interest profiles could preserve these separate clusters. Current seed-based discovery already avoids some of this problem by using one selected title.

**Existing tests establish behavior, not taste accuracy.** A regression test can prove that football is excluded from a basketball request. It cannot prove that the top five surviving basketball titles are the most satisfying choices. The earlier live result showing a Percy Jackson candidate establishes retrieval presence only.

## 4. The proposed design

### A. Make the request explicit

Represent each discovery request as a small structured object: selected seed, requested medium, required topics, optional themes, avoided genres, content constraints, and exploration preference. Preserve the current same-medium/anime-first default. Provide cross-media exploration as an intentional mode rather than using unrelated media to fill a sparse list.

For Harry Potter, fantasy remains required; magic, school setting, youthful protagonists, and friendship are possible ranking evidence. For Kuroko's Basketball, basketball remains required under the current product choice, while anime receives priority unless another medium is selected. A broader “team sports” request should be a visible user choice, not an invisible fallback.

Distinguish audience from content certification. “Adult audience” does not mean explicit content, and unknown certification does not establish suitability. Recommendation quality changes should preserve the current content rules and keep deferred age verification separate.

### B. Improve metadata before adding a complex ranker

Store features in fields: genre/subgenre, topic, theme, tone, audience, format/style, and explicit relationships. Record evidence for each feature: provider field, source record, extraction method/version, and a confidence category. Keep confidence as an engineering assessment until it has been calibrated against human judgments.

Use canonical aliases to connect equivalent concepts while retaining medium-specific meanings. Basketball transfers well across anime, films, and books. Roguelike is a game-structure term and should not transfer literally to novels. “Alternative” music is not a title-search instruction or a universal theme.

For weakly described candidates, use a bounded enrichment stage before rejecting them. Prioritize records with strong provider relevance or a close semantic synopsis match, not only those already rich in matching tags. Preserve the current final topic gate until evidence supports admission. Track how many initially unknown records become valid matches.

Personal tags should affect the contributing user's profile immediately. Shared factual tags should require evidence and moderation. “Not accurate” should distinguish wrong metadata, a poor recommendation, and a personal dislike; these need different corrections. Treat a suggested title-to-title relationship as a separate record with a verified target ID and reason.

### C. Keep provider evidence and combine retrieval channels

Add a retrieval-evidence record containing provider, endpoint/query, page, original rank, and timestamp. Preserve multiple appearances of the same canonical work as evidence while displaying it once. Group nearly identical queries so repeatedly querying one provider cannot manufacture independent support.

Compare a provider-rank baseline with a fused ranking. Reciprocal rank fusion combines ordered lists through contributions of the form `weight / (k + rank)`, avoiding direct comparison of incompatible provider score scales.[^10] The proposed use in Mosaic is an adaptation: evaluate provider-related, subject-search, lexical, and semantic lists as separate channels. It is not a proven improvement for this catalog.

Endpoint meaning matters. A related-title list is a similarity signal; a popularity-sorted genre list is primarily a discovery prior. They should not automatically receive equal weight. Keep hard eligibility checks outside the fusion score, and cap the influence of duplicate channels.

### D. Add semantic descriptions as a second content signal

Build a cleaned text representation from synopsis and supported thematic fields. Remove marketing boilerplate, repeated blurbs, HTML, review quotes, and unrelated publisher text. Preserve factual details and avoid introducing generated claims. Version the representation so embeddings can be regenerated only when relevant content changes.

Test both a lexical baseline and pretrained text embeddings. Start by reranking a fixed candidate pool; that isolates whether the representation helps. A second experiment can use embeddings to retrieve from a durable index, addressing titles missed by API queries. Reranking alone cannot solve missing-candidate problems.

Use the same model and preprocessing for queries and items. Keep medium and strict content checks as explicit fields. Do not assume a model optimized for question-answer retrieval is automatically good at story-to-story similarity. Sentence Transformers documents the efficient bi-encoder retrieval plus more expensive cross-encoder reranking pattern; it should be benchmarked on Mosaic examples before adoption.[^11]

An optional cross-encoder would inspect the seed and candidate together, only for a short list. An optional LLM could extract supported themes or rerank verified candidates. Neither should generate unverified catalog titles for display, determine age suitability from guesses, or invent explanations unsupported by the stored evidence.

### E. Combine signals transparently

The initial experimental ranker should retain inspectable components: structured-feature match, semantic similarity, provider evidence, and personal preference adjustment. Combine normalized signals or their ranks; do not add raw provider ratings to cosine values. Use a validation set to choose the mixture and publish the selected configuration with benchmark results.

Test field-level matching rather than an undifferentiated bag of tags. Genre and specific topic can remain gates; theme, tone, and audience can each contribute a bounded score. Compare the current cosine with weighted overlap/query coverage to see whether metadata-rich candidates are unfairly penalized. Neither alternative should be called better without measurements.

Keep explanations faithful: “Shared basketball and team-competition themes; prioritized because you requested anime.” Provider-only support can be described as a related-title source. Do not present a heuristic match score as a probability of enjoyment, and do not claim community agreement before there is community data.

### F. Diversify within the request

Continue removing repeated editions and controlling franchise repetition. Separate adaptations from new-story discovery so obvious same-franchise matches do not inflate the apparent quality of cross-media recommendations. Let a “more like this series” intent opt into repetition instead of making it the default.

Calibration research concerns whether a recommendation list reflects the distribution of a person's interests, rather than allowing one interest to crowd out the rest.[^12] For Mosaic's general For You feed, a simple allocation across supported interest clusters is a reasonable experiment. For a specific basketball request, an overall fantasy preference should not inject fantasy novels into that list.

## 5. Shared behavior: when and how to add it

A login is not required for seed-based content recommendations. It is needed, together with a working shared database and appropriate access controls, for persistent cross-device accounts and community contributions. Merely enabling authentication will not produce a collaborative recommender.

Record explicit ratings, saves, dismissals with reasons, recommendation impressions, and item opens as distinct events. An item that was not clicked may never have been seen; a saved item is not necessarily enjoyed. Keep private library data separate from public suggestions and shared aggregates.

Start with a regularized item-to-item co-like baseline. Count how often positively rated items occur together, normalize for each item's overall popularity, and reduce the influence of low-support pairs. Evaluate the resulting neighbors against content-only recommendations. Display social explanations only when the supporting aggregate actually exists.

The threshold for using community evidence should depend on coverage and held-out reliability, not an invented universal number of users. A thousand accounts with disjoint single ratings may be less useful than a smaller group with meaningful overlap. Measure how many requests have credible neighbors, and fall back to content ranking when support is absent.

For cross-media transfer, retain domain-specific preferences alongside shared themes. Someone can like horror games and dislike horror films. The proposed hybrid should learn that distinction instead of forcing all ratings into one universal preference vector. More advanced factorization, two-tower, or graph models belong after this simple baseline has been evaluated.

## 6. What external datasets can contribute

The UCSD Book Graph contains historical Goodreads metadata and interactions collected in 2017. Its maintainers specify academic use and restrictions on redistribution and commercial use.[^13] It may be valuable for a separate seminar experiment, but it should not be copied into the public GitHub site as a substitute for a live book API. It also does not supply a matching movie history for each Mosaic user.

Amazon Reviews 2023 includes multiple product categories, interaction records, metadata, and timestamps.[^14] A bounded books/movies/games subset could support an offline cross-domain experiment after reviewing its use conditions. Validate cross-category user-ID consistency and actual overlap before designing the split. Reviews and purchases are imperfect proxies for entertainment enjoyment, and product editions need canonicalization.

The critical constraint is identity. Unrelated anonymized users from a movie dataset and a book dataset cannot be joined because they share an ID value or similar taste. For the prototype, a small consent-based evaluation with Mosaic users can answer product questions more directly than a large poorly aligned dataset.

A benchmark dataset is also different from a production catalog. Historical interactions can help compare models, but do not establish current availability, reliable certification, or provider permission to republish all descriptions.

## 7. Evaluation plan

### Establish a fixed benchmark first

Create an initial set of approximately 40–60 seed-and-intent requests spanning books, films, television/anime, and any games with adequate verified metadata. This is a proposed pilot size, not a statistical adequacy claim. Include popular and less popular seeds, sparse descriptions, mixed genres, non-fiction preferences, and explicit cross-media targets.

Harry Potter and Kuroko's Basketball should be regression examples, not the entire test set. Use human-reviewed relevance grades: 0 irrelevant, 1 weak connection, 2 good match, 3 strong match. Record the reason and whether the reviewer knows the work. Unknown should not be silently labeled irrelevant. Where possible, obtain two independent judgments and resolve or report disagreement.

Build a judged pool from the union of different retrieval methods plus independently suggested relevant works. Otherwise, the evaluation rewards whichever system supplied all the candidates. Canonicalize editions and group adaptations/series; keep related versions out of opposite training and test partitions when learning weights.

### Compare methods fairly

| Experiment | Comparison | What it answers |
|---|---|---|
| Retrieval only | Earlier limited batch versus current multi-query paging versus proposed enriched retrieval | Are relevant works entering the pool? |
| Ranking only | Provider order, current tag cosine, fusion, and semantic hybrid on the same fixed pool | Which ranking is better, independent of retrieval? |
| Representation | Current tags versus grouped fields versus tags plus cleaned descriptions | Does richer information help without adding false matches? |
| List construction | Current diversity versus controlled series/interest allocation | Is variety improving usefulness or weakening relevance? |
| Cross-media | Same-medium and explicit target-medium tasks scored separately | Does transfer help the intended experience? |

Report candidate recall against the **judged relevant set**, not against an unknowable whole catalog. Track Precision@5, graded NDCG@10, topic/genre violations, duplicate-work rate, and coverage by source and medium. Explain NDCG as giving more credit when stronger matches appear nearer the top. Track latency, failure rate, and request cost alongside quality.

Sampling research shows that evaluation against small random negative sets can reverse conclusions about which model is better.[^15] Mosaic should therefore evaluate all items in its fixed judged pool and describe that pool's limits. Do not seed every test with the correct answer and then report success as open-catalog retrieval.

Separate development and held-out seeds before choosing weights. Run ablations that remove semantic matching, provider rank, or feature grouping one at a time. Report per-query changes and uncertainty, including cases that worsen; do not only publish an average improvement. Unit tests remain valuable, but answer a different question.

With a small user base, use blinded side-by-side comparisons and short interviews before claiming an online A/B-test win. Ask both “Which list fits?” and “Which unfamiliar item would you actually try?” Record relevance and novelty separately. Clicks alone are not enough to measure satisfaction.

### Proposed rollout gate

Ship an experimental ranker only if it improves held-out relevance without introducing prohibited-content or explicit-constraint violations, and without a material latency regression. Freeze the baseline and make rollback easy. Numerical success thresholds should be chosen after measuring the baseline; none have been established by this report.

## 8. Implementation sequence for this project

| Priority | Work | Main files or infrastructure | Completion evidence |
|---|---|---|---|
| 1 | Benchmark and retrieval/ranking traces | New evaluation fixtures and runner; retrieval evidence types | Reproducible baseline report with per-query failures |
| 2 | Preserve provider ranks and experiment with fusion | `retrieval.ts`, `media-api.ts`, `book-api.ts`, `recommendations.ts` | Held-out comparison against provider-only and current ordering |
| 3 | Structured features, provenance, and uncertain-record enrichment | `features.ts`, provider adapters, normalized storage | Audited tag precision and recovered relevant candidates |
| 4 | Cleaned-description lexical/embedding experiment | Offline metadata snapshot and embedding job | Same-pool semantic ablation; no provider calls needed during scoring |
| 5 | Durable searchable catalog and explicit discovery modes | Backend plus database; `app/page.tsx` | Reusable eligible candidates, reliable explanations, latency measurement |
| 6 | Shared accounts, ratings, corrections, and item-to-item baseline | Supabase setup, schema/access controls, aggregation | Verified support counts and improved held-out results |
| Later | Learned rankers, two towers, bandits, or graph neural models | Training pipeline and sufficiently broad interaction data | Demonstrable benefit over simpler maintained baselines |

The first three steps can proceed without activating a shared account service or paying for an LLM. Embeddings can initially be generated offline for a bounded evaluation set with a suitable pretrained model; model licensing and runtime requirements must be checked before selection. An open model can avoid per-request API fees, but computation and storage still have costs.

For a durable implementation, Supabase documents combined Postgres full-text and pgvector search, including rank fusion.[^16] This is compatible with the planned account/database direction, but the project is not configured yet. Keep provider credentials and embedding service credentials in the backend. Do not ship private histories or privileged keys in the static GitHub Pages bundle.

The proposed database needs canonical works, provider IDs, sourced features, versioned text/embeddings, and separate user interactions. Build the catalog incrementally from permitted provider data; do not attempt to copy every entertainment catalog. Before permanent storage, establish each source's permitted retention and display behavior. That review is a prerequisite for deployment, not a blocker for the local ranking experiment.

## 9. What to defer

Do not train a custom deep recommender just to make the prototype appear sophisticated. A reproducibility study found several evaluated neural methods could be beaten by well-tuned simpler baselines; this is evidence for careful comparison, not a claim that neural recommendation never works.[^17]

Defer real-time LLM ranking on every request, image-based similarity of covers, automatic global acceptance of user tags, and contextual bandits. They introduce additional cost or failure modes before the core quality questions are answered. Cover similarity can capture marketing style rather than story content; that proposed signal needs its own relevance experiment.

Music should remain a separate research item. A shared mood may transfer, but music taxonomy does not provide an automatic narrative genre mapping. Preserve the existing Google Music/YouTube Music API backlog item and evaluate musical semantics independently before restoring cross-media music discovery.

The defensible seminar contribution is a measurable one: whether provider evidence plus structured and semantic content improves cross-media discovery under sparse user data. An interpretable system, a reproducible benchmark, and honest failure analysis would make a stronger prototype than an unevaluated complex model.

## Sources

The references below identify the exact sources supporting the numbered notes. Findings from abstracts or indexed excerpts are treated as such; deployment recommendations are this report's engineering judgments.

[^1]: Paul Covington, Jay Adams, and Emre Sargin. [Deep Neural Networks for YouTube Recommendations](https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/). RecSys, 2016. Official publication abstract; candidate generation and ranking architecture.

[^2]: Badrul Sarwar, George Karypis, Joseph Konstan, and John Riedl. [Item-Based Collaborative Filtering Recommendation Algorithms](https://files.grouplens.org/papers/www10_sarwar.pdf). WWW, 2001. Author-hosted paper, indexed text; direct PDF fetch unavailable during source verification.

[^3]: Amazon Science. [The history of Amazon's recommendation algorithm](https://www.amazon.science/the-history-of-amazons-recommendation-algorithm). 2019. First-party retrospective on item-to-item recommendation; background, not a Mosaic benchmark.

[^4]: Tianzi Zang, Yanmin Zhu, Haobing Liu, Ruohan Zhang, and Jiadi Yu. [A Survey on Cross-domain Recommendation: Taxonomies, Methods, and Future Directions](https://doi.org/10.1145/3548455). ACM Transactions on Information Systems 41(2), article 42, published December 2022. [Author preprint](https://arxiv.org/abs/2108.03357), initially 2021. Taxonomy and media dataset discussion from indexed publisher text and abstract.

[^5]: Nils Reimers and Iryna Gurevych. [Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks](https://aclanthology.org/D19-1410/). EMNLP-IJCNLP, 2019, pp. 3982–3992. Semantic embedding method; not entertainment preference validation.

[^6]: Shulong Tan, Jiajun Bu, Xuzhen Qin, Chun Chen, and Deng Cai. [Cross domain recommendation based on multi-type media fusion](https://www.sciencedirect.com/science/article/pii/S0925231213009260). Neurocomputing 127, March 2014, pp. 124–134. Publisher abstract/indexed excerpts; full article inaccessible in this review.

[^7]: Xinyi Liu, Ruijie Wang, Dachun Sun, Dilek Hakkani Tur, and Tarek Abdelzaher. [Uncovering Cross-Domain Recommendation Ability of Large Language Models](https://arxiv.org/html/2503.07761v1). WWW Companion, 2025. Full HTML, especially sections 5.1–5.4; active-user filtering and small candidate evaluation limit extrapolation.

[^8]: Diego Feijer et al. [Calibrated Recommendations with Contextual Bandits](https://arxiv.org/html/2509.05460v1). 2025 author manuscript. Full HTML, sections 2–3; evaluated music/podcast shelf mixing, not general narrative similarity.

[^9]: Kirandeep Kaur and Amit Goyal. [Cold-start audiobook recommendation via cross-domain sub-tower fusion](https://www.amazon.science/publications/cold-start-audiobook-recommendation-via-cross-domain-sub-tower-fusion). 2025. Official research summary; reported results belong to its streaming-service setting.

[^10]: Gordon V. Cormack, Charles L. A. Clarke, and Stefan Buettcher. [Reciprocal rank fusion outperforms condorcet and individual rank learning methods](https://research.google/pubs/reciprocal-rank-fusion-outperforms-condorcet-and-individual-rank-learning-methods/). SIGIR, 2009, pp. 758–759. Original method reference; formula and implementation mechanics also supported by source 16.

[^11]: Sentence Transformers. [Retrieve & Re-Rank](https://www.sbert.net/examples/sentence_transformer/applications/retrieve_rerank/README.html). Official documentation, accessed September 2026. Bi-encoder and cross-encoder architecture; recommendation transfer remains experimental.

[^12]: Diego Corrêa da Silva and Dietmar Jannach. [Calibrated Recommendations: Survey and Future Directions](https://arxiv.org/abs/2507.02643). 2025 preprint. Abstract-level support for calibration and preserving multiple interests; practical example also examined in source 8.

[^13]: Mengting Wan and Julian McAuley / UCSD Book Graph. [Goodreads Datasets](https://sites.google.com/eng.ucsd.edu/ucsdbookgraph/home), with [current download page](https://mengtingwan.github.io/data/goodreads.html). Data collected in 2017; documented updates in 2019. Source page specifies academic use, no redistribution, and no commercial use.

[^14]: McAuley Lab. [Amazon Reviews 2023](https://amazon-reviews-2023.github.io/main.html). Dataset documentation; associated publication Yupeng Hou et al., *Bridging Language and Items for Retrieval and Recommendation*, 2024. Metadata, interactions, categories, timestamps, and standard splits.

[^15]: Walid Krichene and Steffen Rendle. [On Sampled Metrics for Item Recommendation](https://research.google/pubs/on-sampled-metrics-for-item-recommendation/). KDD, 2020. Official abstract; inconsistency of sampled ranking metrics and limitations of small negative sets.

[^16]: Supabase. [Hybrid search](https://supabase.com/docs/guides/ai/hybrid-search). Official documentation, accessed September 2026. Postgres full-text search, pgvector, and smoothed reciprocal rank fusion. Documentation availability does not imply Mosaic has deployed this infrastructure.

[^17]: Maurizio Ferrari Dacrema, Paolo Cremonesi, and Dietmar Jannach. [Are We Really Making Much Progress? A Worrying Analysis of Recent Neural Recommendation Approaches](https://arxiv.org/abs/1907.06902). RecSys, 2019. Reproducibility and baseline comparison; its historical sample does not settle all later neural methods.
