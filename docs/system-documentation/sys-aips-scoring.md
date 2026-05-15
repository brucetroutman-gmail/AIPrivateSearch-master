# AIPrivateSearch Scoring System

**Version**: 20.22

---

## Overview

The scoring system evaluates AI response quality using a second local Ollama model. It is optional — searches run without scoring, and scoring is added when you want to measure or compare response quality.

---

## How It Works

1. A search query runs and produces a response from the search model
2. The scoring model receives: the original query + the response
3. The scoring model evaluates on 3 criteria and returns scores
4. Scores are weighted and converted to a percentage

---

## Scoring Criteria

| Criterion | Weight | Scale | What it measures |
|-----------|--------|-------|-----------------|
| Accuracy | 3x | 1-3 | Factual correctness and verifiability |
| Relevance | 2x | 1-3 | How directly the response addresses the query |
| Organization | 1x | 1-3 | Clarity, structure, and logical flow |

### Score definitions

**Accuracy**
- 3 — Entirely accurate, all information verifiable
- 2 — Generally accurate with minor errors
- 1 — Predominantly inaccurate or contains major errors

**Relevance**
- 3 — Fully addresses the query, minimal unnecessary content
- 2 — Mostly addresses the query with some gaps or tangents
- 1 — Barely addresses or misses the query entirely

**Organization**
- 3 — Exceptionally clear, perfect logical flow
- 2 — Generally clear with minor structural issues
- 1 — Disorganized, hard to follow

---

## Weighted Score Calculation

```
Weighted Score % = (accuracy×3 + relevance×2 + organization×1) / 18 × 100
```

### Score range examples

| Accuracy | Relevance | Organization | Weighted % |
|----------|-----------|--------------|------------|
| 3 | 3 | 3 | 100% |
| 2 | 2 | 2 | 67% |
| 1 | 1 | 1 | 33% |
| 3 | 1 | 3 | 61% |
| 3 | 3 | 1 | 89% |
| 1 | 3 | 1 | 44% |

Maximum = 18 points = 100%
Minimum = 6 points = 33%

---

## Enabling Scoring

1. Go to **AI Search**
2. Check **Generate scores**
3. Select a **Score Model** (separate from search model)
4. Run your search — scores appear below the response

---

## Model Selection for Scoring

The scoring model should be capable of analytical evaluation. Recommended models:

| Model | Size | Notes |
|-------|------|-------|
| gemma2:2b | ~2GB | Good balance of speed and accuracy |
| gemma2:9b | ~9GB | Best scoring quality, slower |
| llama3.2:3b | ~2GB | Good general evaluator |
| qwen2.5:3b | ~2GB | Fast, reasonable scoring |

Avoid very small models (qwen2:0.5b) for scoring — they struggle with structured evaluation output.

---

## Use Cases

**Model comparison**
Run the same query with different search models, score each result, compare weighted percentages to identify which model performs best for your content.

**Response quality baseline**
Establish a baseline score for a collection + query type. Use it to detect when model updates improve or degrade quality.

**Search method comparison**
Score results from AI Direct vs AI Document Chat for the same query to determine which method produces better responses for your use case.

**Prompt tuning**
Test different system prompts or temperatures, score the results, use weighted percentage to guide optimization.

---

## Scoring in the Database

When results are saved to MySQL, scoring data is stored alongside search metrics:

| Field | Description |
|-------|-------------|
| AccurateScore | 1-3 accuracy score |
| RelevantScore | 1-3 relevance score |
| OrganizedScore | 1-3 organization score |
| WeightedScore-pct | Calculated weighted percentage |
| ModelName-score | Scoring model used |
| Duration-score-s | Time taken to score |
| EvalTokensPerSecond-score | Scoring model throughput |

---

## Performance Impact

Scoring adds a second AI inference pass. Approximate additional time:

| Score Model | Additional Time |
|-------------|----------------|
| gemma2:2b | +5-15s |
| gemma2:9b | +20-60s |
| llama3.2:3b | +8-20s |

Use scoring selectively — for evaluation and comparison tasks, not routine searches.

---

## Interpreting Results

| Weighted % | Interpretation |
|------------|---------------|
| 90-100% | Excellent — accurate, relevant, well-organized |
| 75-89% | Good — minor issues in one area |
| 60-74% | Acceptable — noticeable gaps but usable |
| 45-59% | Poor — significant accuracy or relevance issues |
| 33-44% | Very poor — response largely fails the query |

Note: Scores reflect the scoring model's evaluation, which itself has limitations. Use scores as a relative guide, not an absolute measure.
