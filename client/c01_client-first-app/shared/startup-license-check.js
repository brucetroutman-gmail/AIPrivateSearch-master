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
            console.log('🚀 STARTUP LICENSE: Step 6a - License requires activation');
            // Show activation message and redirect
            const licenseStatusEl = document.getElementById('licenseStatus');
            if (licenseStatusEl) {
                console.log('🚀 STARTUP LICENSE: Step 6b - Showing activation message');
                 
                licenseStatusEl.innerHTML = `
                    <div style="display: inline-block; background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #856404; margin-bottom: 15px;">License Activation Required</h3>
                        <p style="color: #856404; margin-bottom: 20px;">
                            To use AI Private Search, please activate your license with your email address.
                        </p>
                        <a href="license-activation.html" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                            Activate License
                        </a>
                    </div>
                `;
            }
            
            // Redirect after 3 seconds if not manually clicked
            setTimeout(() => {
                if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
                    window.location.href = 'license-activation.html';
                }
            }, 3000);
            
        } else if (status.valid) {
            console.log('🚀 STARTUP LICENSE: Step 6a - License is valid');
            
            // Check authentication after license validation
            const sessionId = localStorage.getItem('sessionId');
            if (!sessionId) {
                console.log('🚀 STARTUP LICENSE: Step 6b - No session found, redirecting to login');
                window.location.href = './user-management.html';
                return;
            }
            
            // Verify session is still valid
            try {
                const authResponse = await fetch(`${window.API_BASE_URL}/api/auth/me`, {
                    headers: { 'Authorization': `Bearer ${sessionId}` }
                });
                
                if (!authResponse.ok) {
                    console.log('🚀 STARTUP LICENSE: Step 6c - Session expired, redirecting to login');
                    localStorage.removeItem('sessionId');
                    localStorage.removeItem('userEmail');
                    window.location.href = './user-management.html';
                    return;
                }
            } catch (error) {
                console.log('🚀 STARTUP LICENSE: Step 6c - Auth check failed, redirecting to login');
                localStorage.removeItem('sessionId');
                localStorage.removeItem('userEmail');
                window.location.href = './user-management.html';
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