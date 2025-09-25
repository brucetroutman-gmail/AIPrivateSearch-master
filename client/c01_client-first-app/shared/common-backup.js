// Minimal working common.js for testing

// Common.js loaded successfully

// Simple test function
function showUserMessage() {
  // Message displayed
}

// Make available globally
if (typeof window !== 'undefined') {
  window.showUserMessage = showUserMessage;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Common.js DOMContentLoaded fired
});