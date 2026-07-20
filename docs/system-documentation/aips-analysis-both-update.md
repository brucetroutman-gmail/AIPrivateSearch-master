**Updated analysis framework** (incorporating the review feedback)

Both prior frameworks remain solid. The review correctly identifies the strongest elements and the three genuine gaps. Below is a consolidated, prioritized set of recommendations that keeps the high-value parts, explicitly adds the missing pieces, and focuses on what is practical to surface first.

### Confirmed strengths to retain
- Full coverage of performance (duration, load, tokens/sec), chunking, and the five quality scores.
- Explicit separation of search phase vs. score phase.
- Hardware confounding check (critical for valid model comparisons).
- Search-model vs. score-model isolation (“fix one, vary the other”).
- Pareto view of speed vs. quality.
- Statistical practicality: medians + IQR, CV for stability/thermal issues, non-parametric mindset, outlier flagging.

### Three gaps now closed

1. **Time-series / temporal drift**  
   Group or color runs by `CreatedAt` (day, week, or chronological order).  
   Check whether median duration, tokens/sec, or any quality score systematically changes over the collection period on the *same* hardware × model combination.  
   Possible causes: model-provider updates, OS/firmware changes on the Mac Minis, cumulative thermal history, or background-process drift.  
   Flag any hardware or model whose later runs are materially slower or lower-scoring than its early runs.

2. **Scoring circularity / self-preference**  
   Explicitly call out cases where `ModelName-search` == `ModelName-score`.  
   These runs can inflate scores because the model is judging its own output style.  
   Always present two parallel rankings:
   - All runs (including same-model pairs)
   - Strictly cross-model pairs only (search model ≠ score model)  
   The search×score combination table (see below) makes this visible at a glance.

3. **SimilarityScore as the independent quality signal**  
   Treat `SimilarityScore` as the only non-LLM-judge metric in the quality group.  
   Always show it alongside (or slightly elevated relative to) the LLM-derived scores (`AccurateScore`, `RelevantScore`, `OrganizedScore`, `WeightedScore-pct`).  
   It serves as a useful sanity check: large divergence between SimilarityScore and WeightedScore-pct can indicate judge-model bias or prompt sensitivity.

### Practical build priorities for `analyze-tests-documents.html`

Focus only on the high-ROI items that require almost no new data work:

1. **Leaderboard table**  
   - Rows = model (or search×score pair) and/or hardware (`PcCode`).  
   - Columns (minimum viable):  
     - Median total duration  
     - Median tokens/sec (search + score)  
     - Median chunk count  
     - Median WeightedScore-pct  
     - Median Accurate / Relevant / Organized (the three components)  
     - Median SimilarityScore ← add this  
   - Optional but cheap: sample size (n) and CV of duration.

2. **Searchription × Score model combination breakdown table**  
   - Matrix or grouped table with every observed (`ModelName-search`, `ModelName-score`) pair.  
   - Metrics: median WeightedScore-pct, median SimilarityScore, median total duration, n.  
   - Visually distinguish same-model pairs (circularity risk) from cross-model pairs.  
   - This single view implements the most analytically interesting insight and directly addresses self-preference.

3. **Component scores always visible**  
   Never show only WeightedScore-pct. Display Accurate / Relevant / Organized next to it in the leaderboard and in any model or hardware summary. They are already available and reveal different strengths.

Everything else in the earlier documents (full statistical tests, elaborate heatmaps, parallel-coordinates plots, formal regression, etc.) remains useful later but is secondary. The three items above give immediate, trustworthy answers to:
- Which model (or model pair) is best on quality?
- Which is fastest?
- How does chunking differ?
- Does hardware ranking change the model ranking?
- Is there evidence of self-preference or temporal drift?

### Suggested analysis order when the HTML is live
1. Look at the overall leaderboard sorted by WeightedScore-pct, then by SimilarityScore, then by duration.  
2. Switch to the search×score matrix and compare same-model vs. cross-model cells.  
3. Filter or facet by `PcCode` to confirm rankings are stable across hardware.  
4. Sort or color by time window to spot drift.  
5. Only then drill into individual test categories or outlier runs.

This keeps the analysis rigorous where it matters, practical to implement, and focused on the questions you actually need answered.