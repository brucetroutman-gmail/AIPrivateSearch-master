// Minimal working common.js for testing

console.log('Common.js loaded successfully');

// Simple test function
function showUserMessage(message, type = 'info') {
  console.log(`${type}: ${message}`);
}

// Make available globally
if (typeof window !== 'undefined') {
  window.showUserMessage = showUserMessage;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('Common.js DOMContentLoaded fired');
});