import express from 'express';
import { LicenseManager } from '../lib/licensing/license-manager.mjs';

const router = express.Router();

// GET /status - Get current license status
router.get('/status', async (req, res) => {
  try {
    const status = await LicenseManager.checkLicenseStatus();
    const systemInfo = LicenseManager.getSystemInfo();
    
    res.json({
      valid: status.valid,
      reason: status.reason,
      tier: LicenseManager.getSubscriptionTier(),
      email: LicenseManager.getUserEmail(),
      requiresActivation: await LicenseManager.requiresActivation(),
      systemInfo: {
        uuid: systemInfo?.uuid,
        serial: systemInfo?.serial?.substring(0, 4) + '***' // Partial serial for privacy
      },
      gracePeriod: status.gracePeriod || false,
      expired: status.expired || false
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get license status' });
  }
});

// POST /activate - Activate license with email
router.post('/activate', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address required' });
    }

    const result = await LicenseManager.activateLicense(email);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.existing ? 'License already exists' : 'License activated successfully',
        tier: LicenseManager.getSubscriptionTier(),
        email: LicenseManager.getUserEmail()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Activation failed' });
  }
});

// POST /refresh - Refresh current license
router.post('/refresh', async (req, res) => {
  try {
    // Force clear cache before refresh
    LicenseManager.licenseStatus = null;
    LicenseManager.lastCheck = 0;
    
    const result = await LicenseManager.refreshLicense();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'License refreshed successfully',
        tier: LicenseManager.getSubscriptionTier()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Refresh failed' });
  }
});

// GET /features/:feature - Check if feature is allowed
router.get('/features/:feature', (req, res) => {
  try {
    const { feature } = req.params;
    const allowed = LicenseManager.isFeatureAllowed(feature);
    
    res.json({
      feature,
      allowed,
      tier: LicenseManager.getSubscriptionTier()
    });
  } catch (error) {
    res.status(500).json({ error: 'Feature check failed' });
  }
});

// GET /system-info - Get system information (for debugging)
router.get('/system-info', (req, res) => {
  try {
    const systemInfo = LicenseManager.getSystemInfo();
    
    res.json({
      uuid: systemInfo?.uuid,
      serial: systemInfo?.serial?.substring(0, 4) + '***', // Partial for privacy
      hasHardwareId: !!systemInfo?.compositeId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get system info' });
  }
});

export default router;