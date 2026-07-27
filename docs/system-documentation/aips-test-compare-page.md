# Test Plan: Compare Tests Page (tests-compare.html)

**Version**: 21.21
**Page**: `/tests-compare.html`
**Purpose**: Verify the Compare Tests page loads data, populates selectors, runs comparisons correctly, and renders results accurately.

---

## 1. Page Load & Data

| # | Test | Expected |
|---|------|----------|
| L1 | Open page without email in localStorage | Error shown, no data loaded |
| L2 | Open page with valid email | Data loads, PC Code / Model / Test Category checkboxes populate |
| L3 | Verify `SourceType === 'Local Model Only'` records are excluded | Only document-backed tests appear in selectors |
| L4 | Open page with no test data in DB | Selectors are empty, Run Comparison shows "Select at least one value" |

---

## 2. Compare Selectors — Population

| # | Test | Expected |
|---|------|----------|
| S1 | PC Code list | Shows all unique PcCode values from loaded data |
| S2 | Model list | Shows all unique `ModelName-search` values |
| S3 | Test Category list | Shows all unique TestCategory values, sorted A–Z |
| S4 | Query Type list | Static: Fact, Analysis, Creative, Other — always present |
| S5 | Test groups | Static: E1–E4 (Email), F1–F3 (Federalist), L1–L3 (Legal), M1–M5 (Medical) — always present |

---

## 3. Query Type → Test Auto-Selection

| # | Test | Expected |
|---|------|----------|
| Q1 | Check **Fact** | Checks E1, E2, E4, F1, L1, L2, M1, M2, M3 — unchecks all others |
| Q2 | Check **Analysis** | Checks E3, F2, L3, M4 — unchecks all others |
| Q3 | Check **Creative** | Checks F3, M5 — unchecks all others |
| Q4 | Check **Other** | No tests auto-checked (no tests mapped to "other") |
| Q5 | Check Fact then Analysis | Analysis tests checked, Fact tests unchecked |
| Q6 | Check Fact + Analysis together | Union of both sets checked |

---

## 4. Test Group Mutual Exclusion

| # | Test | Expected |
|---|------|----------|
| G1 | Check E1 (Email group) | E1 checked; all Federalist, Legal, Medical tests unchecked |
| G2 | Check M1 (Medical group) | M1 checked; all Email, Federalist, Legal tests unchecked |
| G3 | Check E1 then F1 | F1 checked; E1 unchecked (cross-group exclusion) |
| G4 | Check E1 then E2 (same group) | Both E1 and E2 remain checked (same group allowed) |

---

## 5. Run Comparison — Validation

| # | Test | Expected |
|---|------|----------|
| R1 | Click Run Comparison with nothing selected | Shows "Select at least one value in any group." |
| R2 | Select one Model, run | Single column table with all 8 metrics |
| R3 | Select two Models, run | Two columns, best highlighted green, worst highlighted red |
| R4 | Select one PC Code + one Model | One column labeled "PCCode / ModelName" |
| R5 | Select two PC Codes + two Models | Four columns (cartesian product: 2×2) |
| R6 | Select one Test (e.g. M1), run | Column filtered to only M1 test records |
| R7 | Select Query Type = Fact, run | Column filtered to fact-type records |

---

## 6. Metrics Table — Values & Highlighting

| # | Test | Expected |
|---|------|----------|
| M1 | Avg Score row | Shows weighted score % average; N/A if no scored tests |
| M2 | Accuracy / Relevance / Organization rows | Averages of 1–3 scale scores; N/A if none |
| M3 | Similarity row | Average similarity %; N/A if none |
| M4 | Avg Duration row | Average search duration in seconds |
| M5 | Tokens/sec row | Average eval tokens per second |
| M6 | Tests (n) row | Count of matching records per column |
| M7 | Best value (higher-is-better metrics) | Cell has `best-score` CSS class (green) |
| M8 | Worst value (higher-is-better metrics) | Cell has `worst-score` CSS class (red) |
| M9 | Best value for Avg Duration (lower-is-better) | Lowest duration gets `best-score` |
| M10 | Single column — no best/worst highlighting | No highlighting when only one column |
| M11 | All values N/A in a metric row | No highlighting applied |

---

## 7. Answer-Search Cards

| # | Test | Expected |
|---|------|----------|
| A1 | No tests have `Answer-search` | Answer section not rendered |
| A2 | Tests have answers | "Answer-Search Comparison" heading appears below table |
| A3 | Answer card header | Shows group label and answer count |
| A4 | Answer card row | Shows TestCode, ModelName, TestCategory, Score |
| A5 | Click "View Answer" | Answer text expands inline |
| A6 | Click "View Answer" again | Answer text collapses |
| A7 | Answer text with HTML characters | `<` rendered as `&lt;` (no XSS) |

---

## 8. Theme

| # | Test | Expected |
|---|------|----------|
| T1 | Load page in dark theme | Table headers use `#2c3e50`, even rows `#34495e` |
| T2 | Load page in light theme | Table uses default `var(--bg-color)` styles |
| T3 | Toggle theme via header | Page re-renders with correct colors without reload |

---

## 9. Edge Cases

| # | Test | Expected |
|---|------|----------|
| E1 | Large cartesian product (3 PC Codes × 3 Models × 2 Categories) | 18 columns render, table scrolls horizontally |
| E2 | Column with zero matching records | n=0, all metrics N/A |
| E3 | API returns `success: false` | Error logged via `showError()` |
| E4 | Network failure on load | Error logged via `showError()` |
