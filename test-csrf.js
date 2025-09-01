// Simple test script to verify CSRF protection
const fetch = require('node-fetch');

function safeLog(message, ...args) {
  const sanitized = args.map(arg => {
    if (typeof arg === 'string') {
      return arg.replace(/[\r\n\t\x00-\x1f\x7f-\x9f]/g, '_').substring(0, 500);
    }
    return String(arg).substring(0, 500);
  });
  console.log(message, ...sanitized);
}

async function testCSRF() {
  const baseURL = 'http://localhost:3001';
  
  safeLog('Testing CSRF Protection...');
  
  // Test 1: GET request should work without CSRF token
  try {
    const response = await fetch(`${baseURL}/api/csrf-token`);
    const data = await response.json();
    safeLog('GET /api/csrf-token works:', data.csrfToken ? 'Token received' : 'No token');
    
    const csrfToken = data.csrfToken;
    
    // Test 2: POST request without CSRF token should fail
    try {
      const response2 = await fetch(`${baseURL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test' })
      });
      
      if (response2.status === 403) {
        safeLog('POST without CSRF token correctly rejected (403)');
      } else {
        safeLog('POST without CSRF token should be rejected but got:', response2.status);
      }
    } catch (error) {
      safeLog('Error testing POST without token:', error.message);
    }
    
    // Test 3: POST request with CSRF token should work
    try {
      const response3 = await fetch(`${baseURL}/api/search`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ 
          query: 'test query',
          model: 'qwen2:0.5b',
          temperature: 0.3,
          context: 2048,
          sourceType: 'Local Model Only'
        })
      });
      
      if (response3.ok) {
        safeLog('POST with CSRF token works');
      } else {
        safeLog('POST with CSRF token failed:', response3.status);
      }
    } catch (error) {
      safeLog('Error testing POST with token:', error.message);
    }
    
  } catch (error) {
    safeLog('Error getting CSRF token:', error.message);
  }
}

// Run the test
testCSRF();