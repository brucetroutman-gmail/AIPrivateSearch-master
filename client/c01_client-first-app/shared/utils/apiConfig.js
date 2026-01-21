// API Configuration - reads backend port from app.json
(function() {
  // Load API configuration from app.json synchronously
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', './config/app.json', false); // synchronous
    xhr.send();
    if (xhr.status === 200) {
      const config = JSON.parse(xhr.responseText);
      console.log('Loaded config:', config);
      if (config.ports && config.ports.backend) {
        window.API_BASE_URL = `http://localhost:${config.ports.backend}`;
        console.log('Set API_BASE_URL to:', window.API_BASE_URL);
      } else {
        throw new Error('Backend port not found in configuration');
      }
    } else {
      throw new Error(`Failed to load config: HTTP ${xhr.status}`);
    }
  } catch (error) {
    console.error('CRITICAL: Cannot load app.json configuration:', error);
    // Redirect to error page instead of using defaults
    window.location.href = `./config-error.html?error=${encodeURIComponent(error.message)}`;
    return;
  }
})();