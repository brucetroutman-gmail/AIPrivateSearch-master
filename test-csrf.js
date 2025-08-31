// Simple test script to verify CSRF protection
const fetch = require('node-fetch');

async function testCSRF() {
  const baseURL = 'http://localhost:3001';
  
  console.log('Testing CSRF Protection...\n');
  
  // Test 1: GET request should work without CSRF token
  try {
    const response = await fetch(`${baseURL}/api/csrf-token`);
    const data = await response.json();
    console.log('✓ GET /api/csrf-token works:', data.csrfToken ? 'Token received' : 'No token');
    
    const csrfToken = data.csrfToken;
    
    // Test 2: POST request without CSRF token should fail
    try {
      const response2 = await fetch(`${baseURL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test' })
      });
      
      if (response2.status === 403) {
        console.log('✓ POST without CSRF token correctly rejected (403)');
      } else {
        console.log('✗ POST without CSRF token should be rejected but got:', response2.status);
      }
    } catch (error) {
      console.log('✗ Error testing POST without token:', error.message);
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
        console.log('✓ POST with CSRF token works');
      } else {
        console.log('✗ POST with CSRF token failed:', response3.status, await response3.text());
      }
    } catch (error) {
      console.log('✗ Error testing POST with token:', error.message);
    }
    
  } catch (error) {
    console.log('✗ Error getting CSRF token:', error.message);
  }
}

// Run the test
testCSRF();