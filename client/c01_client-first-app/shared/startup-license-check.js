// Startup license validation for AIPrivateSearch
// Load secure HTML utility
const script = document.createElement('script');
script.src = 'shared/utils/secure-html.js';
document.head.appendChild(script);

(async function() {
    console.log('🚀 STARTUP LICENSE: Starting startup license check');
    try {
        console.log('🚀 STARTUP LICENSE: Step 5 - Initializing license checker');
        // Initialize license checker
        await window.licenseChecker.initialize();
        
        console.log('🚀 STARTUP LICENSE: Step 5a - Checking license status');
        // Check license status
        const status = await window.licenseChecker.checkLicenseStatus();
        console.log('🚀 STARTUP LICENSE: Step 5b - Status received:', status);
        
        if (status.requiresActivation) {
            console.log('🚀 STARTUP LICENSE: Step 6a - License requires activation - staying on index page');
            // Stay on index page, let user click "Get Started" to go to user-management
            // No automatic redirect for new users
            
        } else if (status.valid) {
            console.log('🚀 STARTUP LICENSE: Step 6a - License is valid');
            
            // Check authentication after license validation
            const sessionId = localStorage.getItem('sessionId');
            if (!sessionId) {
                console.log('🚀 STARTUP LICENSE: Step 6b - No session found, staying on index page');
                // Stay on index page, let user navigate manually
                return;
            }
            
            // Verify session is still valid
            try {
                const authResponse = await fetch(`${window.API_BASE_URL}/api/auth/me`, {
                    headers: { 'Authorization': `Bearer ${sessionId}` }
                });
                
                if (!authResponse.ok) {
                    console.log('🚀 STARTUP LICENSE: Step 6c - Session expired, staying on index page');
                    localStorage.removeItem('sessionId');
                    localStorage.removeItem('userEmail');
                    // Stay on index page
                    return;
                }
            } catch (error) {
                console.log('🚀 STARTUP LICENSE: Step 6c - Auth check failed, staying on index page');
                localStorage.removeItem('sessionId');
                localStorage.removeItem('userEmail');
                // Stay on index page
                return;
            }
            
            // License is valid and user is authenticated, ensure CTA buttons are visible
            const ctaButtons = document.getElementById('ctaButtons');
            if (ctaButtons) {
                console.log('🚀 STARTUP LICENSE: Step 6d - Ensuring CTA buttons are visible');
                ctaButtons.style.display = 'flex';
            } else {
                console.log('🚀 STARTUP LICENSE: Step 6d - CTA buttons element not found');
            }
            
            // License status is now displayed on user-management page
            
        } else {
            // License invalid but not requiring activation (e.g., network error)
            // License status is now displayed on user-management page
        }
        
    } catch (error) {
        console.error('🚀 STARTUP LICENSE: Step ERROR - Startup license check failed:', error);
        
        // License status is now displayed on user-management page
    }
})();