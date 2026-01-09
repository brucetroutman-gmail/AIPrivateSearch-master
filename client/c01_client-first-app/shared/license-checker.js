// License checking utility for frontend
class LicenseChecker {
    constructor() {
        this.licenseStatus = null;
        this.apiBaseUrl = 'http://localhost:3001';
        this.initialized = false;
        this.lastCheck = 0;
        this.cacheTimeout = 72 * 60 * 60 * 1000; // 72 hours cache
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            // Load API configuration
            const response = await fetch('./config/app.json');
            const config = await response.json();
            if (config.ports && config.ports.backend) {
                this.apiBaseUrl = `http://localhost:${config.ports.backend}`;
            }
            console.log('License checker using API URL:', this.apiBaseUrl);
        } catch (error) {
            console.warn('Could not load API config, using default:', this.apiBaseUrl);
        }

        this.initialized = true;
    }

    async checkLicenseStatus(forceRefresh = false) {
        await this.initialize();
        
        const now = Date.now();
        console.log('🔐 LICENSE DEBUG: checkLicenseStatus called', {
            forceRefresh,
            hasCachedStatus: !!this.licenseStatus,
            cacheAge: this.licenseStatus ? now - this.lastCheck : 'no cache',
            cacheTimeout: this.cacheTimeout
        });
        
        // Return cached status unless forced refresh or cache expired
        if (this.licenseStatus && !forceRefresh && (now - this.lastCheck) < this.cacheTimeout) {
            console.log('🔐 LICENSE DEBUG: Using cached status:', this.licenseStatus);
            return this.licenseStatus;
        }
        
        try {
            console.log('🔐 LICENSE DEBUG: Fetching fresh license status from:', `${this.apiBaseUrl}/api/licensing/status`);
            const response = await fetch(`${this.apiBaseUrl}/api/licensing/status`);
            const data = await response.json();
            this.licenseStatus = data;
            this.lastCheck = Date.now();
            console.log('🔐 LICENSE DEBUG: Fresh license status received:', data);
            return data;
        } catch (error) {
            console.warn('🔐 LICENSE DEBUG: License status check failed:', error.message);
            // Fallback: allow app to run in degraded mode
            this.licenseStatus = { 
                valid: true, 
                tier: 1, 
                email: 'local-user@localhost', 
                requiresActivation: false,
                fallback: true 
            };
            console.log('🔐 LICENSE DEBUG: Using fallback status:', this.licenseStatus);
            return this.licenseStatus;
        }
    }

    async isFeatureAllowed(feature) {
        await this.initialize();
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/licensing/features/${feature}`);
            const data = await response.json();
            return data.allowed;
        } catch (error) {
            console.error('Feature check failed:', error);
            return false; // Deny access on error
        }
    }

    getSubscriptionTier() {
        return this.licenseStatus?.tier || 1;
    }

    getUserEmail() {
        return this.licenseStatus?.email || null;
    }

    requiresActivation() {
        return this.licenseStatus?.requiresActivation || false;
    }

    isValid() {
        return this.licenseStatus?.valid || false;
    }

    isInGracePeriod() {
        return this.licenseStatus?.gracePeriod || false;
    }

    isExpired() {
        return this.licenseStatus?.expired || false;
    }

    // Show license status in UI
    displayLicenseStatus(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !this.licenseStatus) return;

        let statusHtml = '';
        
        if (this.licenseStatus.valid) {
            const tierName = this.licenseStatus.tier === 1 ? 'Standard' : 
                           this.licenseStatus.tier === 2 ? 'Premium' : 'Professional';
            
            statusHtml = `
                <div class="license-status license-valid">
                    <strong>License Active</strong><br>
                    Tier: ${tierName}<br>
                    Email: ${this.licenseStatus.email}
                    ${this.licenseStatus.gracePeriod ? '<br><em>Grace period active</em>' : ''}
                </div>
            `;
        } else {
            statusHtml = `
                <div class="license-status license-invalid">
                    <strong>License Required</strong><br>
                    ${this.licenseStatus.reason || 'No valid license found'}<br>
                    <a href="license-activation.html">Activate License</a>
                </div>
            `;
        }
        
        // Show fallback mode indicator
        if (this.licenseStatus.fallback) {
            statusHtml = `
                <div class="license-status license-fallback" style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; text-align: center;">
                    <strong style="color: #856404;">Running in Local Mode</strong><br>
                    <span style="color: #856404;">Licensing server unavailable - using local fallback</span>
                </div>
            `;
        }

        // eslint-disable-next-line no-unsanitized/property
        container.innerHTML = statusHtml;
    }

    // Redirect to activation if required
    async enforceActivation(exemptPages = ['license-activation.html', 'index.html', 'user-management.html', 'videos.html']) {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (exemptPages.includes(currentPage)) return false;

        const status = await this.checkLicenseStatus();
        
        // Only redirect if explicitly requires activation and not in fallback mode
        if (status.requiresActivation && !status.fallback && !status.valid) {
            console.log('License activation required, redirecting...');
            window.location.href = 'license-activation.html';
            return true; // Redirected
        }
        return false; // No redirect needed
    }

    // Hide/show elements based on tier access
    async applyTierRestrictions() {
        const tier = this.getSubscriptionTier();
        
        // Hide premium-only features for standard tier
        if (tier < 2) {
            document.querySelectorAll('.prem-only').forEach(el => {
                el.style.display = 'none';
            });
        }

        // Hide professional-only features for non-professional tiers
        if (tier < 3) {
            document.querySelectorAll('.pro-only').forEach(el => {
                el.style.display = 'none';
            });
        }
    }
}

// Global instance
window.licenseChecker = new LicenseChecker();

// Auto-check license on page load (independent of user auth)
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔐 LICENSE CHECKER: DOMContentLoaded event fired');
    try {
        console.log('🔐 LICENSE CHECKER: Step 2 - Starting license status check');
        // License check is independent of user authentication
        const status = await window.licenseChecker.checkLicenseStatus();
        console.log('🔐 LICENSE CHECKER: Step 2a - License status received:', status);
        
        // Skip license enforcement if in fallback mode, valid license, or on user auth pages
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        console.log('🔐 LICENSE CHECKER: Step 2b - Current page:', currentPage);
        
        const userAuthPages = ['user-management.html', 'login.html', 'register.html', 'videos.html'];
        const skipEnforcement = userAuthPages.includes(currentPage) || 
                               status.fallback || 
                               (status.valid && !status.requiresActivation);
        
        console.log('🔐 LICENSE CHECKER: Step 2c - Skip enforcement decision:', {
            currentPage,
            isUserAuthPage: userAuthPages.includes(currentPage),
            isFallback: status.fallback,
            isValidAndNotRequiringActivation: (status.valid && !status.requiresActivation),
            skipEnforcement
        });
        
        if (!skipEnforcement) {
            console.log('🔐 LICENSE CHECKER: Step 2d - Enforcing activation check');
            const redirected = await window.licenseChecker.enforceActivation();
            if (redirected) {
                console.log('🔐 LICENSE CHECKER: Step 2e - Redirected to activation page');
                return;
            }
        } else {
            console.log('🔐 LICENSE CHECKER: Step 2d - Skipping enforcement');
        }
        
        console.log('🔐 LICENSE CHECKER: Step 3 - Applying tier restrictions');
        await window.licenseChecker.applyTierRestrictions();
        
        // Display license status if container exists
        if (document.getElementById('licenseStatus')) {
            console.log('🔐 LICENSE CHECKER: Step 4 - Displaying license status');
            window.licenseChecker.displayLicenseStatus('licenseStatus');
        } else {
            console.log('🔐 LICENSE CHECKER: Step 4 - No license status container found');
        }
    } catch (error) {
        console.error('License initialization failed:', error);
        // Don't block app if licensing fails - allow degraded mode
    }
});