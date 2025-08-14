// Load shared header and footer
async function loadSharedComponents() {
  try {
    // Load header
    const headerResponse = await fetch('./shared/header.html');
    const headerHTML = await headerResponse.text();
    document.getElementById('header-placeholder').innerHTML = headerHTML;
    
    // Load footer
    const footerResponse = await fetch('./shared/footer.html');
    const footerHTML = await footerResponse.text();
    document.getElementById('footer-placeholder').innerHTML = footerHTML;
  } catch (error) {
    console.error('Error loading shared components:', error);
  }
}

// Dark mode toggle function
function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Load saved theme
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

// Toggle mobile menu
function toggleMenu() {
  const navMenu = document.getElementById('navMenu');
  navMenu.classList.toggle('active');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  loadTheme();
  loadSharedComponents();
});