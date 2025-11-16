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
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
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
            // License is valid, show CTA buttons
            const ctaButtons = document.getElementById('ctaButtons');
            if (ctaButtons) {
                console.log('🚀 STARTUP LICENSE: Step 6b - Showing CTA buttons');
                ctaButtons.style.display = 'flex';
            } else {
                console.log('🚀 STARTUP LICENSE: Step 6b - CTA buttons element not found');
            }
            
            // Show license status
            const licenseStatusEl = document.getElementById('licenseStatus');
            if (licenseStatusEl) {
                const tierName = status.tier === 1 ? 'Standard' : 
                               status.tier === 2 ? 'Premium' : 'Professional';
                
                // eslint-disable-next-line no-unsanitized/property
                licenseStatusEl.innerHTML = `
                    <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; text-align: center;">
                        <strong style="color: #155724;">License Active</strong><br>
                        <span style="color: #155724;">Tier: ${tierName} | Email: ${status.email}</span>
                        ${status.gracePeriod ? '<br><em style="color: #856404;">Grace period active</em>' : ''}
                    </div>
                `;
            }
            
        } else {
            // License invalid but not requiring activation (e.g., network error)
            const licenseStatusEl = document.getElementById('licenseStatus');
            if (licenseStatusEl) {
                // eslint-disable-next-line no-unsanitized/property
                licenseStatusEl.innerHTML = `
                    <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; text-align: center;">
                        <strong style="color: #721c24;">License Validation Failed</strong><br>
                        <span style="color: #721c24;">${status.reason || 'Unable to validate license'}</span><br>
                        <a href="license-activation.html" style="color: #007bff; text-decoration: none;">Try Activation</a>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        console.error('🚀 STARTUP LICENSE: Step ERROR - Startup license check failed:', error);
        
        // Show error message
        const licenseStatusEl = document.getElementById('licenseStatus');
        if (licenseStatusEl) {
             
            licenseStatusEl.innerHTML = `
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; text-align: center;">
                    <strong style="color: #721c24;">License System Error</strong><br>
                    <span style="color: #721c24;">Unable to connect to licensing system</span><br>
                    <a href="license-activation.html" style="color: #007bff; text-decoration: none;">Try Activation</a>
                </div>
            `;
        }
    }
})();