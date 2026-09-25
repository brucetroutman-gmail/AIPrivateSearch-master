#!/usr/bin/env node

/**
 * Query Intelligence Layer Validation Script
 * Tests the intelligence layer with various query types and scenarios
 */

const API_BASE = 'http://localhost:56306/api/search';
const TEST_EMAIL = 'test@example.com';

// Test cases
const testCases = [
  {
    name: 'Factual Query - Good Quality',
    query: 'which clients have power of attorney',
    expectedType: 'fact',
    expectedMethod: 'hybrid-search',
    expectedTemp: 0.1
  },
  {
    name: 'Analytical Query - Good Quality',
    query: 'analyze trends in client retention over the last year',
    expectedType: 'analysis',
    expectedMethod: 'ai-document-chat',
    expectedTemp: 0.3
  },
  {
    name: 'Creative Query - Good Quality',
    query: 'generate a creative marketing slogan for our services',
    expectedType: 'creative',
    expectedMethod: 'ai-document-chat',
    expectedTemp: 0.7
  },
  {
    name: 'Factual Query - Short',
    query: 'POA clients',
    expectedType: 'fact',
    expectedMethod: 'hybrid-search',
    expectedTemp: 0.1
  },
  {
    name: 'Test Mode - Intelligence Applied (testCode present, no flag)',
    query: 'which clients have power of attorney',
    testCode: 'TEST-001',
    searchType: 'auto',
    expectedTestMode: true,
    expectedIntelligenceUsed: true,
    expectedType: 'fact',
    expectedMethod: 'hybrid-search'
  },
  {
    name: 'Test Mode - Explicitly Disabled (useIntelligence: false)',
    query: 'any query here',
    testCode: 'TEST-002',
    searchType: 'line-search',
    useIntelligence: false,
    expectedTestMode: true,
    expectedIntelligenceUsed: false
  },
  {
    name: 'Test Mode - With Intelligence (useIntelligence: true)',
    query: 'which clients have power of attorney',
    testCode: 'TEST-003',
    searchType: 'auto',
    useIntelligence: true,
    expectedTestMode: true,
    expectedIntelligenceUsed: true,
    expectedType: 'fact',
    expectedMethod: 'hybrid-search'
  }
];

async function runTest(test) {
  const body = {
    query: test.query,
    model: 'gemma2:2b',
    collection: 'test-collection'
  };
  
  if (test.testCode) {
    body.testCode = test.testCode;
  }
  
  if (test.searchType) {
    body.searchType = test.searchType;
  }
  
  if (test.useIntelligence !== undefined) {
    body.useIntelligence = test.useIntelligence;
  }
  
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': TEST_EMAIL
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    const metadata = result.queryMetadata;
    
    // Validate results
    const checks = [];
    
    if (test.expectedType) {
      const typeMatch = metadata.detectedType === test.expectedType;
      checks.push({
        name: 'Type Detection',
        pass: typeMatch,
        expected: test.expectedType,
        actual: metadata.detectedType
      });
    }
    
    if (test.expectedMethod && !test.testCode) {
      const methodMatch = result.searchType === test.expectedMethod;
      checks.push({
        name: 'Method Selection',
        pass: methodMatch,
        expected: test.expectedMethod,
        actual: result.searchType
      });
    }
    
    if (test.expectedTestMode !== undefined) {
      const testModeMatch = metadata.testMode === test.expectedTestMode;
      checks.push({
        name: 'Test Mode',
        pass: testModeMatch,
        expected: test.expectedTestMode,
        actual: metadata.testMode
      });
    }
    
    if (test.expectedIntelligenceUsed !== undefined) {
      const intelligenceMatch = metadata.intelligenceUsed === test.expectedIntelligenceUsed;
      checks.push({
        name: 'Intelligence Used',
        pass: intelligenceMatch,
        expected: test.expectedIntelligenceUsed,
        actual: metadata.intelligenceUsed
      });
    }
    
    const allPassed = checks.every(c => c.pass);
    
    return {
      test: test.name,
      passed: allPassed,
      checks,
      metadata
    };
    
  } catch (error) {
    return {
      test: test.name,
      passed: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('Query Intelligence Layer - Backend Validation');
  console.log('='.repeat(80));
  console.log('');
  
  const results = [];
  
  for (const test of testCases) {
    console.log(`Testing: ${test.name}`);
    console.log(`Query: "${test.query}"`);
    
    const result = await runTest(test);
    results.push(result);
    
    if (result.error) {
      console.log(`  ❌ ERROR: ${result.error}`);
    } else {
      for (const check of result.checks) {
        const status = check.pass ? '✓' : '✗';
        console.log(`  ${status} ${check.name}: ${check.actual} ${check.pass ? '' : `(expected: ${check.expected})`}`);
      }
      
      if (result.metadata.wasImproved) {
        console.log(`  ℹ Query was improved`);
      }
      
      if (result.metadata.autoSelectedMethod) {
        console.log(`  ℹ Method was auto-selected`);
      }
    }
    
    console.log('');
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Summary
  console.log('='.repeat(80));
  console.log('Summary');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const successRate = ((passed / total) * 100).toFixed(1);
  
  console.log(`Tests Passed: ${passed}/${total} (${successRate}%)`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    const failed = results.filter(r => !r.passed);
    console.log('\nFailed tests:');
    failed.forEach(f => {
      console.log(`  - ${f.test}`);
      if (f.error) {
        console.log(`    Error: ${f.error}`);
      }
    });
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
