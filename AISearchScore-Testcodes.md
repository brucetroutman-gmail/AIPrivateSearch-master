# AI Search & Score Application - TestCode System

## Overview

The TestCode system provides a systematic way to configure and track all parameter combinations for comprehensive testing of the AI Search & Score application. Each TestCode is an 8-digit identifier that specifies exact settings for all user-configurable parameters.

## TestCode Pattern: `t[1-3][1-5][1-5][1-3][1-4][1-3][0-1]`

### **Position 1: Test Identifier**
- **t** = Test (fixed)

### **Position 2: Source Type** (1-3)
- **1** = Local Model Only
- **2** = Local Documents Only  
- **3** = Local Model and Documents

### **Position 3: Assistant Type** (1-5)
- **1** = Simple Assistant
- **2** = Detailed Assistant
- **3** = Reasoned Assistant
- **4** = Creative Assistant
- **5** = Coding Assistant

### **Position 4: User Prompts** (1-5)
- **1** = KNOWLEDGE-Quantum
- **2** = REASON-AI-adopt
- **3** = CREATE-AI-dialog
- **4** = CODE-Pseudo
- **5** = INSTRUCT-Fix wifi

### **Position 5: Temperature** (1-3)
- **1** = Predictable (0.3)
- **2** = Moderate (0.6)
- **3** = Creative (0.9)

### **Position 6: Context** (1-4)
- **1** = 2048
- **2** = 4096
- **3** = 8192
- **4** = 16384

### **Position 7: Tokens** (1-3)
- **1** = No Limit
- **2** = 250 tokens
- **3** = 500 tokens

### **Position 8: Generate Scores** (0-1)
- **0** = Disabled (false)
- **1** = Enabled (true)

## Example TestCodes:

- **t1111111** = Local Model Only + Simple Assistant + KNOWLEDGE-Quantum + Predictable + 2048 + No Limit + No Scoring
- **t3542321** = Local Model and Documents + Creative Assistant + CODE-Pseudo + Moderate + 8192 + 250 tokens + Enabled Scoring
- **t2314230** = Local Documents Only + Creative Assistant + KNOWLEDGE-Quantum + Predictable + 16384 + 500 tokens + No Scoring

## Total Possible Combinations:
**3 × 5 × 5 × 3 × 4 × 3 × 2 = 5,400 unique test configurations**

## Recommended Test Strategy:

### **Baseline Tests** (8 tests):
- **t1111110** = All minimum values, no scoring
- **t3554341** = All maximum values, with scoring
- **t2323230** = Mixed values, no scoring
- **t1452121** = Mixed values, with scoring
- **t1234561** = Sequential progression, with scoring
- **t3521430** = Reverse progression, no scoring
- **t2143120** = Random mix A, no scoring
- **t3415231** = Random mix B, with scoring

### **Parameter-Specific Tests** (focused testing):

#### **Source Type Variations**:
- **t1111110** = Local Model Only baseline
- **t2111110** = Local Documents Only baseline
- **t3111110** = Local Model and Documents baseline

#### **Assistant Type Variations**:
- **t1111110** = Simple Assistant baseline
- **t1211110** = Detailed Assistant baseline
- **t1311110** = Reasoned Assistant baseline
- **t1411110** = Creative Assistant baseline
- **t1511110** = Coding Assistant baseline

#### **User Prompt Variations**:
- **t1111110** = KNOWLEDGE-Quantum baseline
- **t1121110** = REASON-AI-adopt baseline
- **t1131110** = CREATE-AI-dialog baseline
- **t1141110** = CODE-Pseudo baseline
- **t1151110** = INSTRUCT-Fix wifi baseline

#### **Temperature Variations**:
- **t1111110** = Predictable (0.3) baseline
- **t1111210** = Moderate (0.6) baseline
- **t1111310** = Creative (0.9) baseline

#### **Context Variations**:
- **t1111110** = 2048 context baseline
- **t1111120** = 4096 context baseline
- **t1111130** = 8192 context baseline
- **t1111140** = 16384 context baseline

#### **Token Limit Variations**:
- **t1111110** = No Limit baseline
- **t1111120** = 250 tokens baseline
- **t1111130** = 500 tokens baseline

#### **Scoring Variations**:
- **t1111110** = No scoring baseline
- **t1111111** = With scoring baseline

### **Edge Case Tests**:
- **t1111431** = Maximum Context + Maximum Tokens + Scoring
- **t1413111** = Creative Assistant + Creative Temperature + Scoring
- **t1544111** = Coding Assistant + CODE-Pseudo + Scoring
- **t3254321** = All Documents + Detailed + AI-adopt + Moderate + 8192 + 250 + Scoring
- **t2135140** = Documents + Simple + CREATE + Creative + 16384 + No Limit + No Scoring

### **Compatibility Tests**:
- **t1444331** = Creative Assistant + Creative Temperature + Creative Tokens + Scoring
- **t5511111** = Invalid (Assistant Type 5 max) - Error handling test
- **t1611111** = Invalid (User Prompt 6 max) - Error handling test

## Test Implementation Strategy:

### **Phase 1: Core Functionality** (16 tests)
- 8 Baseline tests
- 8 Parameter-specific tests (one per parameter)

### **Phase 2: Parameter Coverage** (35 tests)
- All Source Type variations (3 tests)
- All Assistant Type variations (5 tests)
- All User Prompt variations (5 tests)
- All Temperature variations (3 tests)
- All Context variations (4 tests)
- All Token variations (3 tests)
- All Scoring variations (2 tests)
- 10 Edge case tests

### **Phase 3: Comprehensive Testing** (100+ tests)
- Statistical sampling of the 5,400 possible combinations
- Focus on high-impact parameter interactions
- Performance testing with different configurations

## TestCode Usage:

### **Manual Testing**:
1. Generate TestCode for desired configuration
2. Set application parameters according to TestCode
3. Execute test and record results
4. Use TestCode as identifier in test documentation

### **Automated Testing** (Future):
1. Parse TestCode to extract parameter values
2. Programmatically set application configuration
3. Execute test automatically
4. Store results with TestCode identifier

### **Result Analysis**:
1. Group results by parameter patterns
2. Identify performance trends by configuration
3. Compare effectiveness across different settings
4. Generate reports organized by TestCode patterns

## Benefits of TestCode System:

### **Systematic Coverage**:
- Ensures all parameter combinations are considered
- Prevents duplicate testing
- Identifies untested configurations

### **Reproducibility**:
- Exact test conditions can be recreated
- Results can be verified and validated
- Issues can be debugged with precise configuration

### **Analysis**:
- Parameter impact can be isolated and measured
- Performance patterns can be identified
- Optimal configurations can be determined

### **Documentation**:
- Test results are clearly labeled and organized
- Test coverage can be tracked and reported
- Historical testing data is preserved with context

This TestCode system provides a comprehensive framework for systematic testing of all AI Search & Score application configurations, enabling thorough validation and optimization of the system's performance across all possible parameter combinations.