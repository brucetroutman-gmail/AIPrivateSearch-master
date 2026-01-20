// Quick fix for authentication - run this in browser console
// Sets up localStorage with valid session for adm-std@a.com

const sessionId = 'fix-' + Date.now();
const userId = 'ad966ae1-0d42-43b8-ab9e-11b87d366a14'; // adm-std@a.com
const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes from now

// Set localStorage
localStorage.setItem('sessionId', sessionId);
localStorage.setItem('userEmail', 'adm-std@a.com');
localStorage.setItem('userRole', 'standard');
localStorage.setItem('userUserRole', 'admin');
localStorage.setItem('isAuthenticated', 'true');

console.log('Authentication fixed. Refresh the page.');
console.log('Session ID:', sessionId);
console.log('User:', 'adm-std@a.com');