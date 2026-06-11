# A-002 Baseline Measurement Results

**Purpose**: Baseline score before A-003 (BM25 + reranking experiment)  
**Version**: 20.56  
**Model**: llama3.2:3b  
**Hardware**: Apple Silicon (remote Mac)  
**Date**: TBD

---

## Overall Score

| Metric | Value |
|--------|-------|
| Total queries | 15 |
| 👍 Good responses | TBD |
| 👎 Bad responses | TBD |
| **Baseline score** | **TBD / 15 = TBD%** |
| Avg elapsed time | TBD ms |

---

## Results by Collection

### Sample_Medical-Practice (5 queries)

| # | Query | Rating | Elapsed | Notes |
|---|-------|--------|---------|-------|
| M1 | Find patients with diabetes | | | |
| M2 | What medications is William Adams taking? | | | |
| M3 | Find all patients with cancer | | | |
| M4 | Compare hip vs knee treatment approaches | | | |
| M5 | Summarize conditions treated at practice | | | |

**Score**: _ / 5

### Sample_Law-Office (3 queries)

| # | Query | Rating | Elapsed | Notes |
|---|-------|--------|---------|-------|
| L1 | Which clients have durable power of attorney? | | | |
| L2 | Show upcoming appointments | | | |
| L3 | Most common estate planning documents | | | |

**Score**: _ / 3

### Sample_Federalist-Papers (3 queries)

| # | Query | Rating | Elapsed | Notes |
|---|-------|--------|---------|-------|
| F1 | Hamilton arguments for strong central govt | | | |
| F2 | Compare Union vs anti-Union arguments | | | |
| F3 | Summarize main themes | | | |

**Score**: _ / 3

### Sample_My-Emails (4 queries)

| # | Query | Rating | Elapsed | Notes |
|---|-------|--------|---------|-------|
| E1 | Find emails about parts orders | | | |
| E2 | What parts were ordered from supplier? | | | |
| E3 | Main business relationship in emails | | | |
| E4 | Find emails about monthly reports | | | |

**Score**: _ / 4

---

## Results by Query Type

| Type | Count | 👍 | 👎 | Score |
|------|-------|----|----|-------|
| fact | 9 | | | |
| analysis | 4 | | | |
| creative | 2 | | | |

---

## Raw Log Data

```jsonl
TBD — paste search-evaluations.jsonl contents here
```

---

## Analysis

TBD — filled in after baseline run

---

## Comparison Target

After A-003 (BM25 + reranking), re-run same 15 queries and compare:

| Version | Score | Avg Time | Notes |
|---------|-------|----------|-------|
| v20.56 baseline | TBD% | TBD ms | Before BM25/reranking |
| v?.?? + BM25 | | | |
| v?.?? + reranking | | | |
