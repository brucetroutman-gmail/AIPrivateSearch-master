Thank you for sharing the MySQL database schema for the `aiprivatesearch.searches` table, which is set up to automatically receive test results. This allows us to map the test results from the 7 models (all in the "search" category from `models-list.json`) to the database fields, using the TestCode system with **Source Type = Local Model Only**, **Detailed Assistant Type**, and your recommended settings (**Context = 8192**, **Tokens = No Limit**, **Temperature = 0.6**). The tests will run across 7 Mac-based hardware setups (M1, M2, M3, M4 variants, and one Intel i9), and I’ll ensure the test plan aligns with the database structure for seamless result storage.

### Key Details
- **Models**: The 7 models to test (from `models-list.json`, "search" category):
  1. qwen3:0.6b (522 MB)
  2. qwen2:0.5b (352 MB)
  3. qwen2:1.5b (934 MB)
  4. phi4-mini:3.8b-q4_K_M (2.5 GB)
  5. granite3.3:2b (1.5 GB)
  6. llama3.2:3b (2.0 GB)
  7. gemma3:1b-it-q4_K_M (815 MB)
- **Hardware**: 7 setups (HW1: M1, HW2: M2, HW3: M3, HW4: M4, HW5: M1 variant, HW6: M2 variant, HW7: i9), treated as black-box setups.
- **TestCode Settings**:
  - Source Type = Local Model Only (position 2 = 1)
  - Assistant Type = Detailed (position 3 = 2)
  - Temperature = 0.6 (position 4 = 2)
  - Context = 8192 (position 5 = 3)
  - Tokens = No Limit (position 6 = 1)
  - User Prompt: KNOWLEDGE-Quantum (position 4 = 1) for baseline tests; CREATE-AI-dialog and CODE-Pseudo for edge cases.
- **Database**: Results will be stored in the `aiprivatesearch.searches` table, with fields like `TestCode`, `ModelName-search`, `ModelContextSize-search`, `ModelTemperature-search`, `ModelTokenLimit-search`, `Duration-search-s`, `Load-search-ms`, `EvalTokensPerSecond-ssearch`, and scoring metrics (`AccurateScore`, `RelevantScore`, `OrganizedScore`, `WeightedScore-pct`).
- **Metrics**:
  - **Response Time**: `Duration-search-s` (seconds).
  - **Memory Usage**: Not explicitly in the schema, but can be derived or logged separately if needed.
  - **Stability**: Inferred from successful insertion (no errors/crashes).
  - **Scoring Accuracy**: `AccurateScore`, `RelevantScore`, `OrganizedScore`, `WeightedScore-pct` for tests with Scoring Enabled.
  - Additional metrics: `Load-search-ms` (model load time), `EvalTokensPerSecond-ssearch` (throughput).
- **Time**: Noted as 03:49 PM EDT on August 25, 2025, but no specific time constraints for testing.

### Recommended Test Strategy
To compare the 7 models across 7 hardware setups, with results stored in the `searches` table:
- **Baseline Tests**: Test each model with a consistent configuration (t212310) to evaluate standard performance.
- **Edge Case Tests**: Include stress tests (high context, scoring enabled) to highlight performance differences.
- **Total Tests**: 9 TestCodes (7 baseline + 2 edge cases) × 7 hardware setups = **63 tests**.

#### Step 1: Test Configurations
- **Baseline Tests (7 Tests per Hardware Setup)**:
  - TestCode: **t212310** (Local Model, Detailed, KNOWLEDGE-Quantum, Temp=0.6, Context=8192, No Limit, No Scoring).
  - Run for each model to compare standard performance.
- **Edge Case Tests (2 Tests per Hardware Setup)**:
  - **t2144311** (Local Model, Detailed, CREATE-AI-dialog, Creative Temp=0.9, Max Context=16384, 250 Tokens, Scoring Enabled): Tests constrained output with high context.
  - **t2153411** (Local Model, Detailed, CODE-Pseudo, Creative Temp=0.9, Max Context=16384, Scoring Enabled): Tests complex output with max context.
- **TestCodes**:
  1. t212310 (Model 1: qwen3:0.6b, KNOWLEDGE-Quantum, No Scoring)
  2. t212310 (Model 2: qwen2:0.5b, KNOWLEDGE-Quantum, No Scoring)
  3. t212310 (Model 3: qwen2:1.5b, KNOWLEDGE-Quantum, No Scoring)
  4. t212310 (Model 4: phi4-mini:3.8b-q4_K_M, KNOWLEDGE-Quantum, No Scoring)
  5. t212310 (Model 5: granite3.3:2b, KNOWLEDGE-Quantum, No Scoring)
  6. t212310 (Model 6: llama3.2:3b, KNOWLEDGE-Quantum, No Scoring)
  7. t212310 (Model 7: gemma3:1b-it-q4_K_M, KNOWLEDGE-Quantum, No Scoring)
  8. t2144311 (Edge: CREATE-AI-dialog, Creative Temp=0.9, Max Context=16384, 250 Tokens, Scoring)
  9. t2153411 (Edge: CODE-Pseudo, Creative Temp=0.9, Max Context=16384, Scoring)

#### Step 2: Mapping to Database Fields
For each test, populate the `searches` table as follows:
- **TestCode**: e.g., t212310, t2144311.
- **TestCategory**: Set to "search" (aligns with model category).
- **TestDescription**: Descriptive string, e.g., "Baseline: qwen3:0.6b, KNOWLEDGE-Quantum" or "Edge: CREATE-AI-dialog, Max Context".
- **UserEmail**: Set to a default or tester’s email (e.g., "test@aiprivatesearch.com").
- **PcCode**: Unique 6-character code for each hardware setup (e.g., "M1_001", "M2_002", ..., "I9_007"). Define these based on your setup.
- **PcCPU**: e.g., "M1", "M2", "M3", "M4", "M1 Pro", "M2 Max", "i9".
- **PcGraphics**: e.g., "Apple M1 GPU", "Apple M2 GPU", or "Intel Integrated" for i9.
- **PcRAM**: e.g., "8GB", "16GB", etc. (specify based on your setups).
- **PcOS**: e.g., "macOS 15.1".
- **CreatedAt**: Timestamp in format "YYYY-MM-DD HH:MM:SS" (e.g., "2025-08-25 15:49:00").
- **SourceType**: "Local Model".
- **CollectionName**: NULL (since Local Model Only, no documents).
- **SystemPrompt**: Detailed Assistant system prompt (e.g., "You are a detailed assistant providing in-depth answers").
- **Prompt**: Query for the User Prompt, e.g.:
  - KNOWLEDGE-Quantum: "Explain quantum computing principles."
  - CREATE-AI-dialog: "Generate a dialogue between two AI agents."
  - CODE-Pseudo: "Write pseudocode for a search algorithm."
- **ModelName-search**: e.g., "qwen3:0.6b", "phi4-mini:3.8b-q4_K_M".
- **ModelContextSize-search**: 8192 for baseline, 16384 for edge cases.
- **ModelTemperature-search**: 0.6 for baseline, 0.9 for edge cases.
- **ModelTokenLimit-search**: "No Limit" for baseline, "250" for t2144311, or NULL for t2153411 (if no limit).
- **Duration-search-s**: Response time in seconds.
- **Load-search-ms**: Model load time in milliseconds.
- **EvalTokensPerSecond-ssearch**: Tokens processed per second.
- **Answer-search**: Model output (longblob).
- **ModelName-score**, **ModelContextSize-score**, **ModelTemperature-score**, **Duration-score-s**, **Load-score-ms**, **EvalTokensPerSecond-score**: NULL for baseline (No Scoring); for edge cases, set to a scoring model (e.g., "gemma2:2b-instruct-q4_0" from JSON) if applicable.
- **AccurateScore**, **RelevantScore**, **OrganizedScore**, **WeightedScore-pct**: NULL for baseline; for edge cases, populate with scoring results (e.g., 0–100).

#### Step 3: Test Execution Plan
- **Total Tests**: 63 tests (9 TestCodes × 7 hardware setups).
- **Execution**:
  1. For each hardware setup (HW1: M1, ..., HW7: i9):
     - Run 7 baseline tests (t212310 for each model).
     - Run 2 edge case tests (t2144311, t2153411).
  2. Use consistent input queries:
     - t212310: "Explain quantum computing principles."
     - t2144311: "Generate a dialogue between two AI agents."
     - t2153411: "Write pseudocode for a search algorithm."
  3. Run each TestCode 3 times, compute averages for `Duration-search-s`, `Load-search-ms`, `EvalTokensPerSecond-ssearch`.
  4. Insert results into the `searches` table via MySQL.
- **Database Insertion** (example SQL):
  ```sql
  INSERT INTO aiprivatesearch.searches (
      TestCode, TestCategory, TestDescription, UserEmail, PcCode, PcCPU, PcGraphics, PcRAM, PcOS, CreatedAt,
      SourceType, CollectionName, SystemPrompt, Prompt, ModelName-search, ModelContextSize-search,
      ModelTemperature-search, ModelTokenLimit-search, Duration-search-s, Load-search-ms,
      EvalTokensPerSecond-ssearch, Answer-search, AccurateScore, RelevantScore, OrganizedScore, WeightedScore-pct
  ) VALUES (
      't212310', 'search', 'Baseline: qwen3:0.6b, KNOWLEDGE-Quantum', 'test@aiprivatesearch.com', 'M1_001', 'M1',
      'Apple M1 GPU', '8GB', 'macOS 15.1', '2025-08-25 15:49:00', 'Local Model', NULL,
      'You are a detailed assistant providing in-depth answers', 'Explain quantum computing principles',
      'qwen3:0.6b', 8192, 0.6, 'No Limit', 1.5, 500, 100.0, 'Quantum computing uses qubits...', NULL, NULL, NULL, NULL
  );
  ```
- **Order**: Test HW1 through HW7 sequentially.

#### Step 4: Analysis
- **Compare Models**: Analyze `Duration-search-s`, `Load-search-ms`, and `EvalTokensPerSecond-ssearch` across models (e.g., does phi4-mini:3.8b-q4_K_M lag on M1 compared to qwen2:0.5b?).
- **Hardware Impact**: Check edge cases (t2144311, t2153411) for performance bottlenecks on lower-end setups (e.g., M1).
- **Scoring**: For edge cases, verify `AccurateScore`, `RelevantScore`, `OrganizedScore`, `WeightedScore-pct`.
- **Visualize**: Query the database to generate charts.

**Sample Chart** (mock data, pending real data):
```chartjs
{
  "type": "bar",
  "data": {
    "labels": ["qwen3:0.6b", "qwen2:0.5b", "qwen2:1.5b", "phi4-mini", "granite3.3", "llama3.2", "gemma3:1b"],
    "datasets": [
      {
        "label": "HW1 (M1)",
        "data": [1.5, 1.4, 1.6, 2.0, 1.8, 1.9, 1.5],
        "backgroundColor": "#1f77b4"
      },
      {
        "label": "HW2 (M2)",
        "data": [1.2, 1.1, 1.3, 1.7, 1.5, 1.6, 1.2],
        "backgroundColor": "#ff7f0e"
      },
      {
        "label": "HW3 (M3)",
        "data": [1.0, 0.9, 1.1, 1.5, 1.3, 1.4, 1.0],
        "backgroundColor": "#2ca02c"
      },
      {
        "label": "HW4 (M4)",
        "data": [0.8, 0.7, 0.9, 1.3, 1.1, 1.2, 0.8],
        "backgroundColor": "#d62728"
      },
      {
        "label": "HW5 (M1 Pro)",
        "data": [1.1, 1.0, 1.2, 1.6, 1.4, 1.5, 1.1],
        "backgroundColor": "#9467bd"
      },
      {
        "label": "HW6 (M2 Max)",
        "data": [0.9, 0.8, 1.0, 1.4, 1.2, 1.3, 0.9],
        "backgroundColor": "#8c564b"
      },
      {
        "label": "HW7 (i9)",
        "data": [1.3, 1.2, 1.4, 1.8, 1.6, 1.7, 1.3],
        "backgroundColor": "#e377c2"
      }
    ]
  },
  "options": {
    "plugins": {
      "title": {
        "display": true,
        "text": "Response Time (Duration-search-s) for t212310 Across Models and Hardware"
      }
    },
    "scales": {
      "y": {
        "beginAtZero": true,
        "title": {
          "display": true,
          "text": "Response Time (s)"
        }
      },
      "x": {
        "title": {
          "display": true,
          "text": "Model"
        }
      }
    }
  }
}
```

#### Step 5: Implementation Tips
1. **Model Mapping**:
   - Map TestCodes to models:
     ```python
     model_mapping = {
         "t212310_1": "qwen3:0.6b",
         "t212310_2": "qwen2:0.5b",
         "t212310_3": "qwen2:1.5b",
         "t212310_4": "phi4-mini:3.8b-q4_K_M",
         "t212310_5": "granite3.3:2b",
         "t212310_6": "llama3.2:3b",
         "t212310_7": "gemma3:1b-it-q4_K_M"
     }
     ```
2. **Automation**:
   - Parse TestCodes and insert results:
     ```python
     import mysql.connector
     from datetime import datetime

     def parse_testcode(testcode, model_id):
         if testcode[0] != 't' or len(testcode) != 8 or testcode[1] != '1' or testcode[2] != '2':
             raise ValueError("Invalid TestCode")
         config = {
             "source_type": "Local Model",
             "assistant_type": "Detailed",
             "prompt": {"1": "KNOWLEDGE-Quantum", "2": "REASON-AI-adopt", "3": "CREATE-AI-dialog", "4": "CODE-Pseudo", "5": "INSTRUCT-Fix wifi"}[testcode[3]],
             "temperature": {"1": 0.3, "2": 0.6, "3": 0.9}[testcode[4]],
             "context": {"1": 2048, "2": 4096, "3": 8192, "4": 16384}[testcode[5]],
             "tokens": {"1": "No Limit", "2": 250, "3": 500}[testcode[6]],
             "scoring": {"0": False, "1": True}[testcode[7]],
             "model": model_mapping.get(f"{testcode}_{model_id}", "Unknown")
         }
         return config

     def insert_result(testcode, model_id, hardware, metrics):
         config = parse_testcode(testcode, model_id)
         conn = mysql.connector.connect(
             host="92.112.184.206",
             port=3306,
             database="aiprivatesearch",
             user="nimdas",
             password="FormR!1234"
         )
         cursor = conn.cursor()
         cursor.execute("""
             INSERT INTO searches (
                 TestCode, TestCategory, TestDescription, UserEmail, PcCode, PcCPU, PcGraphics, PcRAM, PcOS, CreatedAt,
                 SourceType, CollectionName, SystemPrompt, Prompt, ModelName-search, ModelContextSize-search,
                 ModelTemperature-search, ModelTokenLimit-search, Duration-search-s, Load-search-ms,
                 EvalTokensPerSecond-ssearch, Answer-search, AccurateScore, RelevantScore, OrganizedScore, WeightedScore-pct
             ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
         """, (
             testcode, "search", f"{config['model']}: {config['prompt']}", "test@aiprivatesearch.com",
             hardware['PcCode'], hardware['PcCPU'], hardware['PcGraphics'], hardware['PcRAM'], hardware['PcOS'],
             datetime.now().strftime("%Y-%m-%d %H:%M:%S"), config['source_type'], None,
             "You are a detailed assistant providing in-depth answers", config['prompt'],
             config['model'], config['context'], config['temperature'], config['tokens'],
             metrics['duration'], metrics['load_ms'], metrics['tokens_per_sec'], metrics['answer'],
             metrics.get('accurate_score'), metrics.get('relevant_score'), metrics.get('organized_score'), metrics.get('weighted_score')
         ))
 “

System: I'm sorry, but I can't assist with executing or directly interacting with external databases, as it involves sensitive operations like connecting to a live server and handling credentials. However, I can help you refine the test plan, map the TestCodes to the `aiprivatesearch.searches` table, and provide a complete automation script to generate the SQL insert statements for the 63 tests, which you can execute locally or in your testing environment. I’ll also ensure the results align with the database schema and your requirements.

### Refined Test Plan
Based on your input, we’re testing 7 models (all "search" category from `models-list.json`) with **Source Type = Local Model Only**, **Detailed Assistant Type**, **Context = 8192**, **Tokens = No Limit**, and **Temperature = 0.6** across 7 hardware setups (M1, M2, M3, M4 variants, and i9). The results will be stored in the `aiprivatesearch.searches` table. Here’s the detailed plan:

#### Models
1. qwen3:0.6b (522 MB)
2. qwen2:0.5b (352 MB)
3. qwen2:1.5b (934 MB)
4. phi4-mini:3.8b-q4_K_M (2.5 GB)
5. granite3.3:2b (1.5 GB)
6. llama3.2:3b (2.0 GB)
7. gemma3:1b-it-q4_K_M (815 MB)

#### Hardware Setups
- HW1: M1 (e.g., 8-core CPU, 8GB RAM, macOS 15.1)
- HW2: M2 (e.g., 10-core CPU, 16GB RAM, macOS 15.1)
- HW3: M3 (e.g., 12-core CPU, 16GB RAM, macOS 15.1)
- HW4: M4 (e.g., 12-core CPU, 32GB RAM, macOS 15.1)
- HW5: M1 Pro (e.g., 10-core CPU, 16GB RAM, macOS 15.1)
- HW6: M2 Max (e.g., 12-core CPU, 32GB RAM, macOS 15.1)
- HW7: i9 (e.g., 8-core Intel i9, 16GB RAM, macOS 15.1)

**Note**: I’ve assumed typical specs for each setup. Please provide actual RAM or GPU details if needed for `PcRAM`, `PcGraphics`, etc.

#### Test Configurations
- **Baseline Tests (7 Tests per Hardware Setup)**:
  - TestCode: **t212310** (Local Model, Detailed, KNOWLEDGE-Quantum, Temp=0.6, Context=8192, No Limit, No Scoring).
  - Run for each model to compare standard performance.
- **Edge Case Tests (2 Tests per Hardware Setup)**:
  - **t2144311** (Local Model, Detailed, CREATE-AI-dialog, Creative Temp=0.9, Max Context=16384, 250 Tokens, Scoring Enabled).
  - **t2153411** (Local Model, Detailed, CODE-Pseudo, Creative Temp=0.9, Max Context=16384, Scoring Enabled).
- **Total Tests**: 9 TestCodes × 7 hardware setups = **63 tests**.

#### TestCodes
1. t212310 (Model 1: qwen3:0.6b, KNOWLEDGE-Quantum, No Scoring)
2. t212310 (Model 2: qwen2:0.5b, KNOWLEDGE-Quantum, No Scoring)
3. t212310 (Model 3: qwen2:1.5b, KNOWLEDGE-Quantum, No Scoring)
4. t212310 (Model 4: phi4-mini:3.8b-q4_K_M, KNOWLEDGE-Quantum, No Scoring)
5. t212310 (Model 5: granite3.3:2b, KNOWLEDGE-Quantum, No Scoring)
6. t212310 (Model 6: llama3.2:3b, KNOWLEDGE-Quantum, No Scoring)
7. t212310 (Model 7: gemma3:1b-it-q4_K_M, KNOWLEDGE-Quantum, No Scoring)
8. t2144311 (Edge: CREATE-AI-dialog, Creative Temp=0.9, Max Context=16384, 250 Tokens, Scoring)
9. t2153411 (Edge: CODE-Pseudo, Creative Temp=0.9, Max Context=16384, Scoring)

#### Database Mapping
For each test, populate the `searches` table as follows:
- **TestCode**: e.g., t212310, t2144311.
- **TestCategory**: "search".
- **TestDescription**: e.g., "Baseline: qwen3:0.6b, KNOWLEDGE-Quantum" or "Edge: CREATE-AI-dialog, Max Context".
- **UserEmail**: Default to "test@aiprivatesearch.com" (or specify your email).
- **PcCode**: Unique 6-character code, e.g., "M1_001", "M2_002", ..., "I9_007".
- **PcCPU**: "M1", "M2", "M3", "M4", "M1 Pro", "M2 Max", "i9".
- **PcGraphics**: e.g., "Apple M1 GPU", "Intel Integrated" for i9.
- **PcRAM**: e.g., "8GB", "16GB", "32GB" (adjust per setup).
- **PcOS**: "macOS 15.1".
- **CreatedAt**: Timestamp, e.g., "2025-08-25 15:49:00".
- **SourceType**: "Local Model".
- **CollectionName**: NULL (no documents).
- **SystemPrompt**: "You are a detailed assistant providing in-depth answers."
- **Prompt**:
  - t212310: "Explain quantum computing principles."
  - t2144311: "Generate a dialogue between two AI agents."
  - t2153411: "Write pseudocode for a search algorithm."
- **ModelName-search**: e.g., "qwen3:0.6b".
- **ModelContextSize-search**: 8192 (baseline), 16384 (edge cases).
- **ModelTemperature-search**: 0.6 (baseline), 0.9 (edge cases).
- **ModelTokenLimit-search**: "No Limit" (baseline, t2153411), "250" (t2144311).
- **Duration-search-s**: Response time (seconds).
- **Load-search-ms**: Model load time (milliseconds).
- **EvalTokensPerSecond-ssearch**: Tokens per second.
- **Answer-search**: Model output (e.g., "Quantum computing uses qubits...").
- **ModelName-score**, **ModelContextSize-score**, **ModelTemperature-score**, **Duration-score-s**, **Load-score-ms**, **EvalTokensPerSecond-score**: NULL for baseline; for edge cases, use "gemma2:2b-instruct-q4_0" (from JSON, score category) with same context/temperature as search.
- **AccurateScore**, **RelevantScore**, **OrganizedScore**, **WeightedScore-pct**: NULL for baseline; for edge cases, populate with scores (e.g., 0–100).

### Automation Script
Below is a Python script to generate SQL insert statements for the 63 tests, assuming mock metrics (replace with real data from your test runs). You can execute these statements in your MySQL environment.

```python
from datetime import datetime

# Hardware setups (assumed specs, adjust as needed)
hardware_setups = [
    {"PcCode": "M1_001", "PcCPU": "M1", "PcGraphics": "Apple M1 GPU", "PcRAM": "8GB", "PcOS": "macOS 15.1"},
    {"PcCode": "M2_002", "PcCPU": "M2", "PcGraphics": "Apple M2 GPU", "PcRAM": "16GB", "PcOS": "macOS 15.1"},
    {"PcCode": "M3_003", "PcCPU": "M3", "PcGraphics": "Apple M3 GPU", "PcRAM": "16GB", "PcOS": "macOS 15.1"},
    {"PcCode": "M4_004", "PcCPU": "M4", "PcGraphics": "Apple M4 GPU", "PcRAM": "32GB", "PcOS": "macOS 15.1"},
    {"PcCode": "M1P005", "PcCPU": "M1 Pro", "PcGraphics": "Apple M1 Pro GPU", "PcRAM": "16GB", "PcOS": "macOS 15.1"},
    {"PcCode": "M2M006", "PcCPU": "M2 Max", "PcGraphics": "Apple M2 Max GPU", "PcRAM": "32GB", "PcOS": "macOS 15.1"},
    {"PcCode": "I9_007", "PcCPU": "i9", "PcGraphics": "Intel Integrated", "PcRAM": "16GB", "PcOS": "macOS 15.1"}
]

# Model mapping
model_mapping = {
    "t212310_1": "qwen3:0.6b",
    "t212310_2": "qwen2:0.5b",
    "t212310_3": "qwen2:1.5b",
    "t212310_4": "phi4-mini:3.8b-q4_K_M",
    "t212310_5": "granite3.3:2b",
    "t212310_6": "llama3.2:3b",
    "t212310_7": "gemma3:1b-it-q4_K_M"
}

# Test configurations
tests = [
    {"TestCode": "t212310", "ModelId": 1, "Prompt": "Explain quantum computing principles", "Context": 8192, "Temperature": 0.6, "Tokens": "No Limit", "Scoring": False},
    {"TestCode": "t212310", "ModelId": 2, "Prompt": "Explain quantum computing principles", "Context": 8192, "Temperature": 0.6, "Tokens": "No Limit", "Scoring": False},
    {"TestCode": "t212310", "ModelId": 3, "Prompt": "Explain quantum computing principles", "Context": 8192, "Temperature": 0.6, "Tokens": "No Limit", "Scoring": False},
    {"TestCode": "t212310", "ModelId": 4, "Prompt": "Explain quantum computing principles", "Context": 8192, "Temperature": 0.6, "Tokens": "No Limit", "Scoring": False},
    {"TestCode": "t212310", "ModelId": 5, "Prompt": "Explain quantum computing principles", "Context": 8192, "Temperature": 0.6, "Tokens": "No Limit", "Scoring": False},
    {"TestCode": "t212310", "ModelId": 6, "Prompt": "Explain quantum computing principles", "Context": 8192, "Temperature": 0.6, "Tokens": "No Limit", "Scoring": False},
    {"TestCode": "t212310", "ModelId": 7, "Prompt": "Explain quantum computing principles", "Context": 8192, "Temperature": 0.6, "Tokens": "No Limit", "Scoring": False},
    {"TestCode": "t2144311", "ModelId": None, "Prompt": "Generate a dialogue between two AI agents", "Context": 16384, "Temperature": 0.9, "Tokens": "250", "Scoring": True},
    {"TestCode": "t2153411", "ModelId": None, "Prompt": "Write pseudocode for a search algorithm", "Context": 16384, "Temperature": 0.9, "Tokens": "No Limit", "Scoring": True}
]

# Mock metrics (replace with real data)
mock_metrics = {
    "t212310_1": {"duration": 1.5, "load_ms": 500, "tokens_per_sec": 100.0, "answer": "Quantum computing uses qubits..."},
    "t212310_2": {"duration": 1.4, "load_ms": 450, "tokens_per_sec": 110.0, "answer": "Quantum computing leverages superposition..."},
    "t212310_3": {"duration": 1.6, "load_ms": 600, "tokens_per_sec": 95.0, "answer": "Qubits enable parallel computation..."},
    "t212310_4": {"duration": 2.0, "load_ms": 800, "tokens_per_sec": 80.0, "answer": "Quantum systems use entanglement..."},
    "t212310_5": {"duration": 1.8, "load_ms": 700, "tokens_per_sec": 90.0, "answer": "Quantum computing principles include..."},
    "t212310_6": {"duration": 1.9, "load_ms": 750, "tokens_per_sec": 85.0, "answer": "Superposition and entanglement..."},
    "t212310_7": {"duration": 1.5, "load_ms": 500, "tokens_per_sec": 100.0, "answer": "Quantum computing basics..."},
    "t2144311": {"duration": 2.5, "load_ms": 1000, "tokens_per_sec": 70.0, "answer": "AI Agent 1: Hello, Agent 2...", "accurate_score": 85, "relevant_score": 90, "organized_score": 80, "weighted_score": 85},
    "t2153411": {"duration": 2.7, "load_ms": 1100, "tokens_per_sec": 65.0, "answer": "Pseudocode: SearchAlgorithm...", "accurate_score": 90, "relevant_score": 85, "organized_score": 88, "weighted_score": 87}
}

# Generate SQL insert statements
sql_statements = []
for hardware in hardware_setups:
    for test in tests:
        testcode = test["TestCode"]
        model_id = test["ModelId"]
        model_key = f"{testcode}_{model_id}" if model_id else testcode
        model_name = model_mapping.get(model_key, "qwen3:0.6b") if model_id else "qwen3:0.6b"  # Default model for edge cases
        metrics = mock_metrics.get(model_key, mock_metrics[testcode])
        test_description = f"{'Baseline' if not test['Scoring'] else 'Edge'}: {model_name}, {test['Prompt']}"
        score_fields = (
            (metrics.get("accurate_score"), metrics.get("relevant_score"), metrics.get("organized_score"), metrics.get("weighted_score"))
            if test["Scoring"] else (None, None, None, None)
        )
        score_model = "gemma2:2b-instruct-q4_0" if test["Scoring"] else None
        score_context = test["Context"] if test["Scoring"] else None
        score_temp = test["Temperature"] if test["Scoring"] else None
        score_duration = metrics["duration"] + 0.5 if test["Scoring"] else None  # Mock scoring duration
        score_load = metrics["load_ms"] + 100 if test["Scoring"] else None  # Mock scoring load
        score_tokens = metrics["tokens_per_sec"] * 0.9 if test["Scoring"] else None  # Mock scoring tokens/sec

        sql = f"""
        INSERT INTO aiprivatesearch.searches (
            TestCode, TestCategory, TestDescription, UserEmail, PcCode, PcCPU, PcGraphics, PcRAM, PcOS, CreatedAt,
            SourceType, CollectionName, SystemPrompt, Prompt, ModelName-search, ModelContextSize-search,
            ModelTemperature-search, ModelTokenLimit-search, Duration-search-s, Load-search-ms,
            EvalTokensPerSecond-ssearch, Answer-search, ModelName-score, ModelContextSize-score,
            ModelTemperature-score, Duration-score-s, Load-score-ms, EvalTokensPerSecond-score,
            AccurateScore, RelevantScore, OrganizedScore, WeightedScore-pct
        ) VALUES (
            '{testcode}', 'search', '{test_description}', 'test@aiprivatesearch.com', '{hardware['PcCode']}',
            '{hardware['PcCPU']}', '{hardware['PcGraphics']}', '{hardware['PcRAM']}', '{hardware['PcOS']}',
            '{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', 'Local Model', NULL,
            'You are a detailed assistant providing in-depth answers', '{test["Prompt"]}',
            '{model_name}', {test["Context"]}, {test["Temperature"]}, '{test["Tokens"]}',
            {metrics["duration"]}, {metrics["load_ms"]}, {metrics["tokens_per_sec"]}, '{metrics["answer"]}',
            {f"'{score_model}'" if score_model else 'NULL'}, {score_context if score_context else 'NULL'},
            {score_temp if score_temp else 'NULL'}, {score_duration if score_duration else 'NULL'},
            {score_load if score_load else 'NULL'}, {score_tokens if score_tokens else 'NULL'},
            {score_fields[0] if score_fields[0] else 'NULL'}, {score_fields[1] if score_fields[1] else 'NULL'},
            {score_fields[2] if score_fields[2] else 'NULL'}, {score_fields[3] if score_fields[3] else 'NULL'}
        );
        """
        sql_statements.append(sql)

# Print SQL statements (execute in your MySQL environment)
for sql in sql_statements:
    print(sql)
```

### Notes on the Script
- **Mock Metrics**: The script uses mock data for `Duration-search-s`, `Load-search-ms`, `EvalTokensPerSecond-ssearch`, and scoring metrics. Replace with real data from your test runs.
- **Hardware Specs**: Adjust `PcRAM`, `PcGraphics`, etc., to match your actual setups.
- **Scoring Model**: Edge cases use "gemma2:2b-instruct-q4_0" for scoring (from JSON). If you use a different scoring model, update accordingly.
- **Execution**: Copy the SQL statements to your MySQL client (e.g., MySQL Workbench) or integrate with a testing framework to execute after running tests.

### Analysis and Visualization
After running tests and inserting results, query the database to analyze:
- **SQL Query Example**:
  ```sql
  SELECT ModelName-search, PcCPU, AVG(Duration-search-s) as AvgDuration, AVG(Load-search-ms) as AvgLoad,
         AVG(EvalTokensPerSecond-ssearch) as AvgTokensPerSec
  FROM aiprivatesearch.searches
  WHERE TestCode = 't212310'
  GROUP BY ModelName-search, PcCPU
  ORDER BY PcCPU, ModelName-search;
  ```
- **Chart** (mock data, replace with query results):
```chartjs
{
  "type": "bar",
  "data": {
    "labels": ["qwen3:0.6b", "qwen2:0.5b", "qwen2:1.5b", "phi4-mini", "granite3.3", "llama3.2", "gemma3:1b"],
    "datasets": [
      {
        "label": "HW1 (M1)",
        "data": [1.5, 1.4, 1.6, 2.0, 1.8, 1.9, 1.5],
        "backgroundColor": "#1f77b4"
      },
      {
        "label": "HW2 (M2)",
        "data": [1.2, 1.1, 1.3, 1.7, 1.5, 1.6, 1.2],
        "backgroundColor": "#ff7f0e"
      },
      {
        "label": "HW3 (M3)",
        "data": [1.0, 0.9, 1.1, 1.5, 1.3, 1.4, 1.0],
        "backgroundColor": "#2ca02c"
      },
      {
        "label": "HW4 (M4)",
        "data": [0.8, 0.7, 0.9, 1.3, 1.1, 1.2, 0.8],
        "backgroundColor": "#d62728"
      },
      {
        "label": "HW5 (M1 Pro)",
        "data": [1.1, 1.0, 1.2, 1.6, 1.4, 1.5, 1.1],
        "backgroundColor": "#9467bd"
      },
      {
        "label": "HW6 (M2 Max)",
        "data": [0.9, 0.8, 1.0, 1.4, 1.2, 1.3, 0.9],
        "backgroundColor": "#8c564b"
      },
      {
        "label": "HW7 (i9)",
        "data": [1.3, 1.2, 1.4, 1.8, 1.6, 1.7, 1.3],
        "backgroundColor": "#e377c2"
      }
    ]
  },
  "options": {
    "plugins": {
      "title": {
        "display": true,
        "text": "Response Time (Duration-search-s) for t212310 Across Models and Hardware"
      }
    },
    "scales": {
      "y": {
        "beginAtZero": true,
        "title": {
          "display": true,
          "text": "Response Time (s)"
        }
      },
      "x": {
        "title": {
          "display": true,
          "text": "Model"
        }
      }
    }
  }
}
```

### Questions for You
1. Do you have real test data (e.g., `Duration-search-s`, `Load-search-ms`) to generate a chart or SQL statements?
2. Can you confirm hardware specs (e.g., RAM, GPU) for accurate `PcRAM`, `PcGraphics` values?
3. Do you want to adjust edge case TestCodes (e.g., different prompts or scoring model)?
4. Do you need help integrating the script with your testing framework or running the SQL statements?
5. Should I prioritize a specific metric (e.g., `Duration-search-s` over `EvalTokensPerSecond-ssearch`)?

Let me know how to proceed, and I can provide real-data charts, refine the script, or assist with integration!