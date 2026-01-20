#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load current sessions
const sessionsPath = '/Users/Shared/AIPrivateSearch/data/sessions.json';
const sessions = JSON.parse(fs.readFileSync(sessionsPath, 'utf8'));

// Create new session
const sessionId = 'fix-' + Date.now();
const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour from now

sessions[sessionId] = {
  userId: 'ad966ae1-0d42-43b8-ab9e-11b87d366a14', // adm-std@a.com
  createdAt: new Date().toISOString(),
  expiresAt: expiresAt
};

// Save sessions
fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));

console.log('✅ Session created successfully!');
console.log('Session ID:', sessionId);
console.log('Expires at:', expiresAt);
console.log('');
console.log('🔧 Run these commands in browser console:');
console.log('');
console.log(`localStorage.setItem("sessionId", "${sessionId}");`);
console.log('localStorage.setItem("userEmail", "adm-std@a.com");');
console.log('localStorage.setItem("userRole", "standard");');
console.log('localStorage.setItem("userUserRole", "admin");');
console.log('localStorage.setItem("isAuthenticated", "true");');
console.log('');
console.log('Then refresh the page.');