import { SubscriptionManager } from '../lib/auth/subscriptionManager.mjs';

const subscriptionManager = new SubscriptionManager();

export async function requireFeature(featureName) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasAccess = await subscriptionManager.checkFeatureAccess(featureName, req.user.userRole);
    
    if (!hasAccess) {
      const tier = await subscriptionManager.getSubscriptionTier();
      const tierName = subscriptionManager.getTierName(tier);
      return res.status(403).json({ 
        error: 'Feature not available in current subscription tier',
        currentTier: tierName,
        feature: featureName
      });
    }

    next();
  };
}

export async function getSubscriptionInfo(req, res, next) {
  try {
    const tier = await subscriptionManager.getSubscriptionTier();
    const features = subscriptionManager.getTierFeatures(tier);
    
    req.subscription = {
      tier,
      tierName: subscriptionManager.getTierName(tier),
      features
    };
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to load subscription information' });
  }
}