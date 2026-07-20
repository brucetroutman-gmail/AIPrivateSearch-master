**Expanded analysis suggestions: Model-vs-Model comparisons**  
(in addition to the earlier hardware-focused recommendations)

Treat the four models as a primary experimental factor. Because the pipeline has two distinct phases, analyze **search models** and **score models** both separately and as combinations.

### 1. Model grouping strategy
- Primary factor: `ModelName-search` and `ModelName-score` (and the pair formed by the two).
- Always stratify or cross with the controllable generation parameters that differ across models:
  - `ModelContextSize-*`
  - `ModelTemperature-*`
  - `ModelTopK-search`
  - `ModelTokenLimit-*`
- Secondary factors: the 15 baseline tests (`TestCode` / `TestCategory`) and hardware (`PcCode`).  
  Report results both pooled across hardware and stratified by hardware so you can see whether model rankings are stable across machines.
- Compute the same descriptive statistics (median, IQR, mean, std, CV, n) for every metric, now sliced by model (or model pair).

### 2. Performance: which model is faster?
Key metrics remain:
- Search phase: `Duration-search-s`, `Load-search-ms`, `EvalTokensPerSecond-search`
- Score phase: `Duration-score-s`, `Load-score-ms`, `EvalTokensPerSecond-score`
- Derived: total pipeline time, overall tokens generated per second.

Suggested analyses
- Rank the four models (and all search–score pairs) by median total duration and by median tokens/sec.
- Separate the ranking for the search phase from the ranking for the score phase; a model that is fast at retrieval/generation may be slow (or expensive) when used as a judge.
- Examine interactions with context size and token limit: larger-context models often show lower tokens/sec and higher load times—quantify the trade-off.
- Stability: coefficient of variation of duration and tokens/sec across the 15 tests for each model. Prefer models that are both fast and consistent.
- Hardware × model interaction tables: does one model benefit disproportionately from higher-RAM or newer-CPU Mac Minis?

### 3. Chunking behavior by model
- Primary variable: `Chunks-search` (count if numeric; otherwise length / total tokens retrieved).
- Questions
  - Which search model systematically retrieves more or fewer chunks?
  - Does chunk count vary with `ModelContextSize-search`, `ModelTopK-search`, or temperature?
  - Is chunk count stable across the 15 tests for a given model, or do some models show high variance on particular test categories?
- Relate chunk statistics to downstream outcomes:
  - Correlation of chunk count with search duration and with tokens/sec.
  - Correlation of chunk count with the five quality scores (more chunks can improve Relevance but sometimes hurt Organization or increase latency).
- Flag models whose chunk distributions are outliers relative to the others; this can indicate differences in retrieval prompting, top-k handling, or context-window utilization.

### 4. Response quality: which model produces better results?
Quality metrics: `AccurateScore`, `RelevantScore`, `OrganizedScore`, `WeightedScore-pct`, `SimilarityScore`.

Suggested analyses
- Overall quality ranking of the four models (and of every search-model × score-model combination) on median `WeightedScore-pct` and on each component score.
- Component-wise strengths: identify models that excel at Accuracy versus Relevance versus Organization. A model that is strong on Accuracy but weak on Organization may still be preferable depending on use-case priorities.
- Consistency: standard deviation or range of each quality score across the 15 baseline tests. Prefer models with high median scores *and* low variance.
- Effect of generation parameters:  
  - How does temperature affect each quality dimension?  
  - Does larger context size reliably improve any of the scores, or only for certain test categories?  
  - Interaction of top-k / token limit with quality.
- Search-model versus score-model contribution:  
  - Fix the score model and vary the search model → how much does retrieval quality move the final scores?  
  - Fix the search model and vary the score model → how much does the judge model move the scores?  
  This isolates whether quality differences are driven more by the answer generator or by the evaluator.
- Correlation structure among the five quality scores *within each model*. Some models may produce more internally consistent score profiles than others.

### 5. Joint performance–quality–chunking view
- Pareto-style examination: plot median total duration (or tokens/sec) against median `WeightedScore-pct` for each model (or model pair). Identify the models that sit on the efficient frontier (fast *and* high quality).
- Three-way relationships:  
  - Models that retrieve more chunks → higher latency but higher Relevance?  
  - Models that are faster → any systematic drop in AccurateScore or SimilarityScore?
- Stratify the above by test category to see whether the “best” model changes with task type (e.g., factual vs. organizationally complex tests).

### 6. Recommended summary tables and visualizations
- Ranked leaderboard table: model (or pair) × median duration, median tokens/sec, median chunk count, median WeightedScore-pct, plus the three component scores.
- Heatmaps: rows = models, columns = the 15 tests (or test categories), cells = median quality or median duration.
- Box / violin plots of each quality score and of total duration, colored by model.
- Scatter of chunk count vs. WeightedScore-pct, colored by search model.
- Parallel-coordinates plot of the five quality scores for each model.
- Faceted views that also show hardware so you can confirm model rankings are robust across Mac Minis.

### 7. Interpretation guidelines
- Declare a primary success metric in advance (e.g., WeightedScore-pct first, then total duration as a secondary criterion) so rankings are unambiguous.
- Always report both absolute differences and relative (%) differences.
- Because temperature, context size, and token limits may differ across the four models, either (a) restrict comparisons to runs that share identical parameter values or (b) explicitly model those parameters as covariates.
- Check for confounding with hardware: if one model was run more often on a faster Mac Mini, the apparent speed advantage may be partly hardware-driven.
- Treat any large quality gap between models as actionable; treat large speed gaps as cost/latency decisions.

These model-centric analyses, combined with the earlier hardware analyses, will tell you:
- which of the four models (or which search–score pairing) delivers the best quality,
- which is fastest,
- how their chunking behavior differs, and
- whether those rankings hold across the different Mac Mini configurations.  

Start with the simple model-level leaderboards on WeightedScore-pct and total duration; those two views usually reveal the dominant patterns immediately.