 
 
import express from 'express';
import { SubscriptionManager } from '../lib/auth/subscriptionManager.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';

const router = express.Router();
const subscriptionManager = new SubscriptionManager();

// Get tier access configuration
router.get('/config', async (req, res) => {
  try {
    const config = await subscriptionManager.loadTierAccessConfig();
    res.json({ success: true, config });
  } catch (error) {
    console.error('Error loading tier access config:', error);
    res.status(500).json({ success: false, error: 'Failed to load configuration' });
  }
});

// Check feature access for current user
router.post('/check-access', requireAuth, async (req, res) => {
  try {
    const { featureName } = req.body;
    const user = req.user;
    
    if (!featureName) {
      return res.status(400).json({ success: false, error: 'Feature name required' });
    }

    const hasAccess = await subscriptionManager.checkFeatureAccess(featureName, user.userRole);
    
    res.json({ 
      success: true, 
      hasAccess,
      user: {
        tier: user.subscriptionTier,
        role: user.userRole
      }
    });
  } catch (error) {
    console.error('Error checking feature access:', error);
    res.status(500).json({ success: false, error: 'Failed to check access' });
  }
});

// Get access matrix for current user
router.get('/access-matrix', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const tierMap = { 'standard': 1, 'premium': 2, 'professional': 3 };
    const tier = tierMap[user.subscriptionTier] || 1;
    
    const accessMatrix = await subscriptionManager.getAccessMatrix(tier, user.userRole);
    const cssClasses = await subscriptionManager.getCSSClassMapping(tier, user.userRole);
    
    res.json({ 
      success: true, 
      accessMatrix,
      cssClasses,
      user: {
        tier: user.subscriptionTier,
        role: user.userRole
      }
    });
  } catch (error) {
    console.error('Error getting access matrix:', error);
    res.status(500).json({ success: false, error: 'Failed to get access matrix' });
  }
});

export default router;