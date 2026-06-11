# A-002 Test Query Set & Baseline Measurement

**Purpose**: Establish a baseline score before BM25/reranking experiment (A-003).  
**Model**: llama3.2:3b  
**Method**: AI Document Chat  
**Rating**: 👍 (good) or 👎 (bad) using feedback buttons after each query  
**Pass criteria**: Record score as X/15 for baseline

---

## Instructions

1. Select collection, run query, rate response with thumbs up/down
2. Note any observations about what was wrong or right
3. Record final score at bottom

---

## Collection: Sample_Medical-Practice (5 queries)

| # | Type | Query | Expected Answer |
|---|------|-------|----------------|
| M1 | fact | `Find patients with diabetes` | P002 (Maria Gonzalez) and P013 (William Adams) — both have Type 2 diabetes |
| M2 | fact | `What medications is William Adams taking?` | Metformin 500mg twice daily (diabetes), Oxycodone 5mg every 6 hours (post-op) |
| M3 | fact | `Find all patients with cancer` | 11 patients: P001 P003 P005 P007 P008 P010 P016 P018 P020 P022 P024 |
| M4 | analysis | `Compare treatment approaches for hip vs knee replacement patients` | Hip: P002, P023 — total hip replacement, PT bi-weekly, pain management. Knee: P017 — total knee replacement, PT bi-weekly, pain management. Both similar approaches. |
| M5 | creative | `Summarize the types of conditions treated at this practice` | Mix of orthopedic (fractures, joint replacements) and oncology (sarcomas, tumors, metastasis) |

---

## Collection: Sample_Law-Office (3 queries)

| # | Type | Query | Expected Answer |
|---|------|-------|----------------|
| L1 | fact | `Which clients have durable power of attorney documents?` | Emma Johnson, Thomas Hall, William Brown |
| L2 | fact | `Show upcoming appointments` | Lists scheduled appointments from calendar |
| L3 | analysis | `What are the most common types of estate planning documents in this collection?` | Living wills, durable POA, revocable living trusts, last will and testament |

---

## Collection: Sample_Federalist-Papers (3 queries)

| # | Type | Query | Expected Answer |
|---|------|-------|----------------|
| F1 | fact | `What arguments does Hamilton make for a strong central government?` | Efficiency, national defense, preventing faction, commerce regulation |
| F2 | analysis | `Compare the arguments for Union vs arguments against it in these papers` | Pro-union: national security, commerce, preventing war between states. Anti-union concerns: loss of state sovereignty, tyranny |
| F3 | creative | `Summarize the main themes of the Federalist Papers` | Union, republican government, separation of powers, checks and balances, federalism |

---

## Collection: Sample_My-Emails (4 queries)

| # | Type | Query | Expected Answer |
|---|------|-------|----------------|
| E1 | fact | `Find emails about parts orders` | Emails with subject containing "Parts Order" or "Order Request" |
| E2 | fact | `What parts were ordered from the supplier?` | Transmission fluid, and other auto parts from various order emails |
| E3 | analysis | `What is the main business relationship described in these emails?` | Auto shop ordering parts/supplies from supplier team |
| E4 | fact | `Find emails about monthly reports` | Emails with subject containing "Monthly Report" |

---

## Results

| # | Query | Rating | Notes |
|---|-------|--------|-------|
| M1 | Find patients with diabetes | | |
| M2 | What medications is William Adams taking? | | |
| M3 | Find all patients with cancer | | |
| M4 | Compare hip vs knee treatment | | |
| M5 | Summarize conditions at practice | | |
| L1 | Which clients have durable POA? | | |
| L2 | Show upcoming appointments | | |
| L3 | Most common estate planning docs | | |
| F1 | Hamilton arguments for central govt | | |
| F2 | Compare Union vs anti-Union arguments | | |
| F3 | Summarize main themes | | |
| E1 | Find emails about parts orders | | |
| E2 | What parts were ordered? | | |
| E3 | Main business relationship | | |
| E4 | Find emails about monthly reports | | |

**Baseline Score**: __ / 15 = __%

**Date**: 
**Version**: 20.56
**Model**: llama3.2:3b

---

## Notes
- Run all queries before rating to avoid anchoring bias
- A "good" response correctly answers the question without hallucination
- A "bad" response includes wrong facts, missed key items, or hallucinated data
- Partial credit: if response is mostly right but misses 1-2 items, still rate 👍
