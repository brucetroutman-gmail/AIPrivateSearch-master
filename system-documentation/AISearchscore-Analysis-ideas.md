
I have an app that runs tests on different models on different PcCodes under different num_ctx and temperature settings, The results are stored in this schema. What reports should I created to compare and contrast models pcPcoes and etc.

CREATE TABLE `searches` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `TestCode` char(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `TestCategory` char(100) DEFAULT NULL,
  `TestDescription` char(100) DEFAULT NULL,
  `UserEmail` char(100) DEFAULT NULL,
  `PcCode` char(6) DEFAULT NULL,
  `PcCPU` char(100) DEFAULT NULL,
  `PcGraphics` char(100) DEFAULT NULL,
  `PcRAM` char(10) DEFAULT NULL,
  `PcOS` char(10) DEFAULT NULL,
  `CreatedAt` char(19) DEFAULT NULL,
  `SourceType` char(25) DEFAULT NULL,
  `SystemPrompt` longblob,
  `Prompt` longblob,
  `ModelName-search` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `ModelContextSize-search` int DEFAULT NULL,
  `ModelTemperature-search` float DEFAULT NULL,
  `ModelTokenLimit-search` char(25) DEFAULT NULL,
  `Duration-search-s` float DEFAULT NULL,
  `Load-search-ms` int DEFAULT NULL,
  `EvalTokensPerSecond-ssearch` float DEFAULT NULL,
  `Answer-search` longblob,
  `ModelName-score` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `ModelContextSize-score` int DEFAULT NULL,
  `ModelTemperature-score` float DEFAULT NULL,
  `Duration-score-s` float DEFAULT NULL,
  `Load-score-ms` int DEFAULT NULL,
  `EvalTokensPerSecond-score` float DEFAULT NULL,
  `AccurateScore` int DEFAULT NULL,
  `RelevantScore` int DEFAULT NULL,
  `OrganizedScore` int DEFAULT NULL,
  `WeightedScore-pct` int DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `RunKey` (`CreatedAt`,`TestCode`,`PcCode`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;





Processing

Developing analysis

Ready to respond

Wrapping up

Answer

Based on your schema, I can see you're testing AI models across different hardware configurations and parameters. Here are the key reports you should create to compare and contrast models, PcCodes, and other variables:


1. 
Model Performance Comparison Reports

Model Leaderboard Report

sql
SELECT 
    `ModelName-search`,
    COUNT(*) as test_count,
    AVG(`WeightedScore-pct`) as avg_weighted_score,
    AVG(`AccurateScore`) as avg_accuracy,
    AVG(`RelevantScore`) as avg_relevance,
    AVG(`OrganizedScore`) as avg_organization,
    AVG(`Duration-search-s`) as avg_duration,
    AVG(`EvalTokensPerSecond-ssearch`) as avg_tokens_per_sec
FROM searches 
GROUP BY `ModelName-search`
ORDER BY avg_weighted_score DESC;

Model Performance by Temperature

sql
SELECT 
    `ModelName-search`,
    `ModelTemperature-search`,
    AVG(`WeightedScore-pct`) as avg_score,
    AVG(`Duration-search-s`) as avg_duration,
    COUNT(*) as test_count
FROM searches 
GROUP BY `ModelName-search`, `ModelTemperature-search`
ORDER BY `ModelName-search`, `ModelTemperature-search`;

Model Performance by Context Size

sql
SELECT 
    `ModelName-search`,
    `ModelContextSize-search`,
    AVG(`WeightedScore-pct`) as avg_score,
    AVG(`EvalTokensPerSecond-ssearch`) as avg_tokens_per_sec,
    COUNT(*) as test_count
FROM searches 
GROUP BY `ModelName-search`, `ModelContextSize-search`
ORDER BY `ModelName-search`, `ModelContextSize-search`;

2. 
Hardware Performance Impact Reports

PC Configuration Performance Report

sql
SELECT 
    PcCode,
    PcCPU,
    PcGraphics,
    PcRAM,
    PcOS,
    COUNT(*) as test_count,
    AVG(`Duration-search-s`) as avg_duration,
    AVG(`Load-search-ms`) as avg_load_time,
    AVG(`EvalTokensPerSecond-ssearch`) as avg_tokens_per_sec,
    AVG(`WeightedScore-pct`) as avg_score
FROM searches 
GROUP BY PcCode, PcCPU, PcGraphics, PcRAM, PcOS
ORDER BY avg_tokens_per_sec DESC;

Hardware vs Model Performance Matrix

sql
SELECT 
    PcCode,
    `ModelName-search`,
    AVG(`Duration-search-s`) as avg_duration,
    AVG(`EvalTokensPerSecond-ssearch`) as avg_tokens_per_sec,
    AVG(`WeightedScore-pct`) as avg_score,
    COUNT(*) as test_count
FROM searches 
GROUP BY PcCode, `ModelName-search`
ORDER BY PcCode, avg_score DESC;

3. 
Test Category & Description Analysis

Performance by Test Category

sql
SELECT 
    TestCategory,
    COUNT(*) as test_count,
    AVG(`WeightedScore-pct`) as avg_score,
    AVG(`Duration-search-s`) as avg_duration,
    MIN(`WeightedScore-pct`) as min_score,
    MAX(`WeightedScore-pct`) as max_score
FROM searches 
WHERE TestCategory IS NOT NULL
GROUP BY TestCategory
ORDER BY avg_score DESC;

Model Strengths by Test Category

sql
SELECT 
    TestCategory,
    `ModelName-search`,
    AVG(`AccurateScore`) as avg_accuracy,
    AVG(`RelevantScore`) as avg_relevance,
    AVG(`OrganizedScore`) as avg_organization,
    AVG(`WeightedScore-pct`) as avg_weighted_score,
    COUNT(*) as test_count
FROM searches 
WHERE TestCategory IS NOT NULL
GROUP BY TestCategory, `ModelName-search`
ORDER BY TestCategory, avg_weighted_score DESC;

4. 
Parameter Optimization Reports

Temperature Sweet Spot Analysis

sql
SELECT 
    `ModelName-search`,
    `ModelTemperature-search`,
    AVG(`WeightedScore-pct`) as avg_score,
    STDDEV(`WeightedScore-pct`) as score_consistency,
    COUNT(*) as test_count
FROM searches 
GROUP BY `ModelName-search`, `ModelTemperature-search`
HAVING test_count >= 3
ORDER BY `ModelName-search`, avg_score DESC;

Context Size Efficiency Report

sql
SELECT 
    `ModelName-search`,
    `ModelContextSize-search`,
    AVG(`WeightedScore-pct`) as avg_score,
    AVG(`Duration-search-s`) as avg_duration,
    AVG(`EvalTokensPerSecond-ssearch`) as avg_tokens_per_sec,
    (AVG(`WeightedScore-pct`) / AVG(`Duration-search-s`)) as efficiency_ratio
FROM searches 
GROUP BY `ModelName-search`, `ModelContextSize-search`
ORDER BY `ModelName-search`, efficiency_ratio DESC;

5. 
Comprehensive Comparison Dashboard

Model-Hardware-Parameter Matrix

sql
SELECT 
    `ModelName-search`,
    PcCode,
    `ModelTemperature-search`,
    `ModelContextSize-search`,
    AVG(`WeightedScore-pct`) as avg_score,
    AVG(`Duration-search-s`) as avg_duration,
    AVG(`AccurateScore`) as avg_accuracy,
    AVG(`RelevantScore`) as avg_relevance,
    AVG(`OrganizedScore`) as avg_organization,
    COUNT(*) as test_count
FROM searches 
GROUP BY `ModelName-search`, PcCode, `ModelTemperature-search`, `ModelContextSize-search`
ORDER BY avg_score DESC;

6. 
Time-based Performance Trends

Performance Over Time

sql
SELECT 
    DATE(CreatedAt) as test_date,
    `ModelName-search`,
    AVG(`WeightedScore-pct`) as avg_score,
    COUNT(*) as daily_tests
FROM searches 
GROUP BY DATE(CreatedAt), `ModelName-search`
ORDER BY test_date DESC, avg_score DESC;

7. 
Statistical Summary Reports

Model Reliability Report (Consistency)

sql
SELECT 
    `ModelName-search`,
    COUNT(*) as total_tests,
    AVG(`WeightedScore-pct`) as avg_score,
    STDDEV(`WeightedScore-pct`) as score_stddev,
    MIN(`WeightedScore-pct`) as min_score,
    MAX(`WeightedScore-pct`) as max_score,
    (STDDEV(`WeightedScore-pct`) / AVG(`WeightedScore-pct`)) * 100 as coefficient_of_variation
FROM searches 
GROUP BY `ModelName-search`
HAVING total_tests >= 5
ORDER BY coefficient_of_variation ASC;

Visualization Recommendations:

Heatmaps: Model vs PcCode performance matrix
Line Charts: Performance trends over temperature ranges
Bar Charts: Model leaderboards and hardware comparisons
Scatter Plots: Duration vs Score correlations
Box Plots: Score distributions by model/hardware
Radar Charts: Multi-dimensional model comparisons (accuracy, relevance, organization)

These reports will help you identify:


Best performing models overall and by category
Optimal temperature and context size settings
Hardware bottlenecks and performance gains
Consistency and reliability of different models
Cost-benefit analysis (performance vs duration)

Would you like me to elaborate on any of these reports or help you create specific visualizations?

Related






How would I visualize the data from these reports to make the comparisons clearer?











Answer

Here are specific visualization approaches for each type of report to make your model and hardware comparisons crystal clear:


1. 
Model Performance Dashboards

Multi-Panel Model Leaderboard

Primary Chart: Horizontal bar chart showing WeightedScore-pct by model
Secondary Metrics: Small multiples showing accuracy, relevance, and organization scores
Performance Indicators: Color-coded bars (green=excellent, yellow=good, red=poor)
Additional Info: Include test count as bar width or annotation

Parameter Optimization Matrix

3D Surface Plot: X=Temperature, Y=Context Size, Z=WeightedScore, colored by model
Alternative: Grid of small line charts, one per model, showing score vs temperature
Interactive Elements: Hover to see exact values and test counts

2. 
Hardware Performance Visualizations

PC Performance Heatmap

code
          Model A  Model B  Model C  Model D
PC-001      85      72      91      67
PC-002      78      85      88      73
PC-003      92      79      85      81

Use color intensity for performance scores
Add tooltips showing hardware specs (CPU, GPU, RAM)
Include secondary heatmap for tokens/second

Hardware Component Impact Analysis

Grouped Bar Charts: Performance by CPU type, GPU type, RAM amount
Box Plots: Show performance distribution for each hardware component
Correlation Matrix: Hardware specs vs performance metrics

3. 
Comprehensive Comparison Views

Model-Hardware Performance Matrix

Bubble Chart: X=Duration, Y=WeightedScore, Bubble Size=Test Count, Color=Model
Faceted by: Hardware configuration (separate panel for each PcCode)
Interactive: Click bubbles to drill down to individual test results

Multi-Dimensional Radar Charts

Individual Radars: One per model showing accuracy, relevance, organization, speed
Overlay Comparison: Multiple models on same radar with different colors
Dynamic Filtering: By hardware, temperature, or test category

4. 
Time-Based and Trend Analysis

Performance Timeline

Line Chart: Performance over time, separate lines for each model
Trend Indicators: Moving averages and confidence intervals
Annotations: Mark significant changes or updates

Parameter Sweep Visualization

Parallel Coordinates: Show how changing temperature/context affects all metrics
Animated Scatter: Show performance changes as parameters vary
Contour Plots: Performance landscapes across parameter combinations

5. 
Statistical and Distribution Views

Model Consistency Analysis

Box and Whisker Plots: Show score distributions with outliers
Violin Plots: Show full distribution shape for each model
Error Bars: Mean ± standard deviation on bar charts

Performance Correlation Analysis

Scatter Plot Matrix: All metrics vs all others
Correlation Heatmap: Pearson correlations between variables
Regression Lines: Show relationships between duration and performance

6. 
Interactive Dashboard Layout

Main Dashboard Structure:

code
┌─────────────────┬─────────────────┐
│   Model         │   Hardware      │
│   Leaderboard   │   Performance   │
│                 │   Heatmap       │
├─────────────────┼─────────────────┤
│   Parameter     │   Time Trends   │
│   Optimization  │   & Consistency │
│                 │                 │
└─────────────────┴─────────────────┘

Filtering Controls:

Dropdown: Select specific models to compare
Sliders: Filter by temperature and context size ranges
Checkboxes: Include/exclude specific hardware configurations
Date Range: Limit analysis to specific time periods

7. 
Specialized Comparison Views

Head-to-Head Model Comparison

Side-by-side Cards: Detailed metrics for 2-3 selected models
Difference Charts: Show performance gaps across categories
Win-Loss Matrix: Which model performs better in each scenario

Hardware ROI Analysis

Cost-Performance Scatter: If you have hardware cost data
Efficiency Frontiers: Best performance per dollar/watt
Upgrade Impact: Before/after hardware change comparisons

8. 
Implementation Tools & Technologies

Recommended Visualization Libraries:

Web-based: D3.js, Plotly.js, Observable Plot
Python: Plotly, Seaborn, Matplotlib, Bokeh
R: ggplot2, plotly, shiny
Business Intelligence: Tableau, Power BI, Grafana

Interactive Features to Include:

Brushing and Linking: Select data in one chart, highlight in others
Zoom and Pan: For detailed exploration of dense data
Export Options: PNG, PDF, or data export functionality
Real-time Updates: If tests are ongoing

9. 
Mobile-Friendly Alternatives

Simplified Mobile Views:

Swipeable Cards: Key metrics for each model
Collapsible Sections: Detailed breakdowns on demand
Touch-Friendly Controls: Large buttons and sliders

Progressive Disclosure:

Summary Level: Top-line metrics and rankings
Detailed Level: Full statistical breakdowns
Raw Data Level: Access to underlying test results

10. 
Automated Insights

Smart Annotations:

Automatically highlight: Best performing combinations
Flag outliers: Unusually good or poor results
Trend detection: Improving or declining performance
Recommendations: Suggest optimal parameter settings

Would you like me to provide specific code examples for any of these visualization approaches, or help you prioritize which visualizations would be most valuable for your specific use case?

Related






Ask AI anything...
Pro



Chat with any content | MaxAI


