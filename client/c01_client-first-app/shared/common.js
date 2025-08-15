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
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error loading shared components:', error);
    return Promise.reject(error);
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

// Email management
function checkUserEmail() {
  const email = localStorage.getItem('userEmail');
  if (!email) {
    promptForEmail();
  }
}

function promptForEmail() {
  const email = prompt('Welcome to AISearch-n-Score!\n\nPlease enter your email address for export functionality:');
  if (email && validateEmail(email)) {
    localStorage.setItem('userEmail', email);
  } else if (email) {
    alert('Please enter a valid email address.');
    promptForEmail();
  }
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function getUserEmail() {
  return localStorage.getItem('userEmail') || '';
}

function updateUserEmail() {
  const currentEmail = getUserEmail();
  const newEmail = prompt('Enter your email address:', currentEmail);
  if (newEmail && validateEmail(newEmail)) {
    localStorage.setItem('userEmail', newEmail);
    alert('Email updated successfully!');
  } else if (newEmail) {
    alert('Please enter a valid email address.');
  }
}

function showUserInfo() {
  const email = getUserEmail();
  if (email) {
    const action = confirm(`Logged in as: ${email}\n\nClick OK to change email, Cancel to close.`);
    if (action) {
      updateUserEmail();
    }
  } else {
    updateUserEmail();
  }
}

function setupLoginIcon() {
  const loginIcon = document.querySelector('.login-icon');
  if (loginIcon) {
    loginIcon.addEventListener('click', showUserInfo);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  loadTheme();
  loadSharedComponents().then(() => {
    setupLoginIcon();
  });
  checkUserEmail();
});