import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.mjs';
import { getSubscriptionInfo } from '../middleware/subscriptionMiddleware.mjs';
import { SubscriptionManager } from '../lib/auth/subscriptionManager.mjs';

const router = express.Router();
const subscriptionManager = new SubscriptionManager();

// Get current subscription information
router.get('/info', requireAuth, getSubscriptionInfo, (req, res) => {
  res.json({
    subscription: req.subscription,
    user: {
      email: req.user.email,
      userRole: req.user.userRole,
      subscriptionTier: req.user.subscriptionTier
    }
  });
});

// Check feature access
router.get('/feature/:featureName', requireAuth, async (req, res) => {
  try {
    const { featureName } = req.params;
    const hasAccess = await subscriptionManager.checkFeatureAccess(featureName, req.user.userRole);
    
    res.json({
      feature: featureName,
      hasAccess,
      userRole: req.user.userRole,
      subscriptionTier: req.user.subscriptionTier
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check feature access' });
  }
});

export default router;