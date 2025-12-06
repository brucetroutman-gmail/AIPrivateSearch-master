import { LicenseClient } from './license-client.mjs';
import { getSystemInfo } from './hardware.mjs';

export class LicenseManager {
  static licenseStatus = null;
  static initialized = false;
  static lastCheck = 0;
  static cacheTimeout = 72 * 60 * 60 * 1000; // 72 hours cache

  static async initialize() {
    if (this.initialized) return true;

    try {
      await LicenseClient.initialize();
      await this.checkLicenseStatus();
      
      // Only start background refresh if not in fallback mode
      if (!this.licenseStatus?.fallback) {
        LicenseClient.startBackgroundRefresh();
      }
      
      this.initialized = true;
      console.log('License manager initialized successfully');
      return true;
    } catch (error) {
      console.warn('License manager using fallback mode:', error.message);
      // Set fallback status
      this.licenseStatus = { 
        valid: true, 
        tier: 1, 
        email: 'local-user@localhost', 
        requiresActivation: false,
        fallback: true 
      };
      this.initialized = true;
      return true;
    }
  }

  static async checkLicenseStatus(forceRefresh = false) {
    const now = Date.now();
    
    // Return cached status unless forced refresh or cache expired
    if (this.licenseStatus && !forceRefresh && (now - this.lastCheck) < this.cacheTimeout) {
      console.log('🔐 LICENSE MANAGER: Using cached license status');
      return this.licenseStatus;
    }
    
    try {
      console.log('🔐 LICENSE MANAGER: Checking license status (cache expired or forced)');
      const result = await LicenseClient.checkLicense();
      this.licenseStatus = result;
      this.lastCheck = now;
      return result;
    } catch (error) {
      console.error('License status check failed:', error);
      this.licenseStatus = { valid: false, reason: error.message };
      this.lastCheck = now;
      return this.licenseStatus;
    }
  }

  static async requiresActivation() {
    // Use cached status if available, otherwise check
    const status = this.licenseStatus || await this.checkLicenseStatus();
    return !status.valid || status.reason === 'No license found';
  }

  static async activateLicense(email) {
    try {
      const result = await LicenseClient.activateLicense(email);
      if (result.success) {
        await this.checkLicenseStatus(true); // Force refresh after activation
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async refreshLicense() {
    try {
      const result = await LicenseClient.refreshLicense();
      if (result.success) {
        await this.checkLicenseStatus(true); // Force refresh after license refresh
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static getLicenseStatus() {
    return this.licenseStatus;
  }

  static getSubscriptionTier() {
    if (this.licenseStatus?.valid && this.licenseStatus.payload) {
      return this.licenseStatus.payload.tier || 1;
    }
    return 1; // Default to Standard tier
  }

  static getUserEmail() {
    if (this.licenseStatus?.valid && this.licenseStatus.payload) {
      return this.licenseStatus.payload.email;
    }
    return null;
  }

  static isFeatureAllowed(feature) {
    const tier = this.getSubscriptionTier();
    
    const tierFeatures = {
      1: ['search', 'multi-mode', 'collections', 'options'], // Standard
      2: ['search', 'multi-mode', 'collections', 'options', 'models', 'config', 'doc-index'], // Premium
      3: ['*'] // Professional - all features
    };

    if (tier === 3) return true; // Professional has all features
    
    return tierFeatures[tier]?.includes(feature) || false;
  }

  static async validateMiddleware(req, res, next) {
    try {
      if (!LicenseManager.initialized) {
        await LicenseManager.initialize();
      }

      const status = await LicenseManager.checkLicenseStatus();
      
      if (!status.valid) {
        return res.status(401).json({
          error: 'Invalid license',
          reason: status.reason,
          requiresActivation: true
        });
      }

      // Add license info to request
      req.license = {
        valid: true,
        tier: LicenseManager.getSubscriptionTier(),
        email: LicenseManager.getUserEmail(),
        payload: status.payload
      };

      next();
    } catch (error) {
      console.error('License validation middleware error:', error);
      res.status(500).json({ error: 'License validation failed' });
    }
  }

  static getSystemInfo() {
    return getSystemInfo();
  }
}