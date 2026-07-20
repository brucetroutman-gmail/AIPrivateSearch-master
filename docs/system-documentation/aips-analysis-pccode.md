**Suggestions for analysis** (no code)

Focus on the three goals: **performance** (speed/throughput), **chunking behavior**, and **result quality**, primarily sliced by hardware (`PcCode` / CPU / RAM / Graphics / OS) while controlling for or crossing with the 4 models and the 15 baseline tests.

### 1. Core grouping and aggregation strategy
- Primary dimension: hardware (`PcCode` or combinations of `PcCPU` + `PcRAM` + `PcGraphics`). Treat each Mac Mini config as a group.
- Secondary dimensions to cross or stratify by:
  - Model pair (`ModelName-search` × `ModelName-score`) — important because search and scoring may use different models.
  - Test (`TestCode` / `TestCategory`) — the 15 baselines.
  - Optionally `CollectionName` / `SourceType` if retrieval corpora differ.
- Compute per-group summaries (mean, median, std, min/max, IQR, coefficient of variation) for every numeric metric. Prefer medians + IQR for durations and token rates because they are often skewed.
- Always report sample size (number of runs) per cell so you can judge reliability.

### 2. Performance comparison (hardware focus)
Key metrics:
- Search phase: `Duration-search-s`, `Load-search-ms`, `EvalTokensPerSecond-search`
- Score phase: `Duration-score-s`, `Load-score-ms`, `EvalTokensPerSecond-score`
- Derived totals: total wall-clock time (search + score), total load time, overall tokens/sec (if token counts can be inferred).

Suggested analyses:
- Rank hardware configs by median total duration and by median tokens/sec for each model (or model pair).
- Check whether faster hardware consistently improves both phases or only one (e.g., search may be more retrieval/CPU bound, scoring more generation bound).
- Look for interaction effects: does a given Mac Mini config help certain models more than others (larger context models or higher-temperature runs may stress RAM/GPU differently)?
- Stability: coefficient of variation of duration and tokens/sec across the 15 tests on the same hardware. High variance on one Mac Mini suggests thermal throttling, background load, or inconsistent cooling.
- Correlation / regression-style exploration (even without formal modeling): relationship of `PcRAM` or CPU generation with tokens/sec and with load times. Plot or tabulate to see diminishing returns.
- Outlier detection: flag runs whose duration is >2–3× the median for that hardware × model × test combination; investigate whether they share the same `CreatedAt` window or particular prompts.

### 3. Chunking analysis
- Treat `Chunks-search` as the primary variable (count of chunks if numeric; otherwise length or presence patterns if it is text).
- Questions to answer:
  - Does chunk count (or distribution) differ systematically by hardware? (It should not if the retrieval pipeline is identical; any difference is a red flag for non-determinism or config drift.)
  - Does chunk count differ by model (`ModelName-search`), by `ModelContextSize-search`, or by `ModelTopK-search`?
  - Relationship between number of chunks and downstream quality scores, and between number of chunks and search duration / tokens/sec.
- Summarize chunk statistics (mean/median count, variance) by hardware, by model, and by test category. Look for tests that systematically retrieve more or fewer chunks.
- If `Chunks-search` contains the actual text, consider secondary metrics such as average chunk length or total retrieved tokens; these can explain both latency and quality variance.

### 4. Quality-of-results comparison
Quality columns: `AccurateScore`, `RelevantScore`, `OrganizedScore`, `WeightedScore-pct`, `SimilarityScore`.

Suggested analyses:
- Overall quality ranking of hardware configs (they should be nearly identical if models and prompts are fixed; any systematic difference is interesting and worth investigating for non-determinism, temperature effects, or scoring-model sensitivity).
- Per-score breakdown: which hardware (or model) is strongest on Accuracy vs Relevance vs Organization.
- Consistency: standard deviation or range of each score across the 15 tests on the same hardware × model. Low variance is desirable.
- Correlation matrix among the five quality scores (do Accurate and Relevant move together? Does SimilarityScore track WeightedScore-pct?).
- Relationship of quality to performance and chunking:
  - Is higher tokens/sec associated with lower quality (possible under-generation or truncation)?
  - Do runs with more chunks tend to score higher or lower on Relevance / Organization?
  - Effect of context size, temperature, top-k, and token limit on the quality scores (stratify or partial out these parameters).
- Identify “winner” and “loser” tests: which of the 15 baselines show the largest quality gaps across hardware or across models.

### 5. Multi-factor and interaction views
- Hardware × Model heatmaps or tables for median duration, tokens/sec, and WeightedScore-pct.
- Hardware × TestCategory summaries to see whether certain categories are disproportionately slow or low-quality on particular Mac Minis.
- Three-way view (hardware × search-model × score-model) if the four models are mixed between phases.
- Time-based checks: group by day or by `CreatedAt` windows to detect whether later runs on the same hardware are slower (thermal, software updates, background processes).

### 6. Statistical and robustness checks (conceptual)
- Non-parametric comparisons (rank-based) between hardware groups for each metric, because distributions of latency and scores are rarely normal.
- Effect-size focus rather than pure significance: report practical differences (e.g., “Mac Mini A is 1.8× faster on median total duration than Mac Mini B for model X”).
- Sensitivity to outliers and to particular tests: recompute rankings after removing the slowest/fastest test or the highest/lowest scoring test.
- Check for confounding: confirm that the same `SystemPrompt`, `Prompt`, temperature, top-k, context size, and collection were used across hardware for each `TestCode`. Any systematic difference invalidates pure hardware comparison.

### 7. Visualization priorities (high-value charts)
- Box plots or violin plots of total duration and of tokens/sec, faceted by model, colored by `PcCode`.
- Side-by-side bar or lollipop charts of median WeightedScore-pct (and the three component scores) by hardware and by model.
- Scatter of search duration vs number of chunks, colored by hardware.
- Heatmap of median quality or median duration with rows = hardware, columns = models (or tests).
- Parallel-coordinates or radar plots of the five quality scores for each hardware–model combination.
- Cumulative distribution of durations to show tail behavior (important for interactive use cases).

### 8. Practical recommendations for interpretation
- Separate “speed ranking” from “quality ranking.” Hardware should mainly affect the former; any quality differences deserve extra scrutiny.
- Normalize or stratify by test difficulty (e.g., by average number of chunks or by average WeightedScore across all hardware) so that hard tests do not dominate the aggregates.
- Report both absolute numbers and relative differences (percent faster / percent higher score).
- Flag any hardware that is an outlier on load time (`Load-*-ms`) versus evaluation tokens/sec — this can indicate model-loading or memory-pressure differences.
- If sample sizes per cell are small, emphasize descriptive patterns and confidence intervals rather than formal hypothesis tests.

These steps will give you a clear picture of which Mac Mini configurations deliver the best speed, whether chunking behavior is stable across machines, and whether quality is effectively hardware-independent (or not). Start with the hardware × model aggregates on duration, tokens/sec, chunk count, and WeightedScore-pct; those four views usually surface the most actionable differences quickly.