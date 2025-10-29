import express from 'express';
import { UserManager } from '../lib/auth/userManager.mjs';
import { requireAuth, requireRole } from '../middleware/authMiddleware.mjs';
import { USER_DEFAULTS, VALID_SUBSCRIPTION_TIERS, VALID_USER_ROLES } from '../lib/auth/userDefaults.mjs';

const router = express.Router();
const userManager = new UserManager();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, subscriptionTier = USER_DEFAULTS.SUBSCRIPTION_TIER, userRole = USER_DEFAULTS.USER_ROLE } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await userManager.createUser(email, password, subscriptionTier, userRole);
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await userManager.authenticateUser(email, password);
    const sessionId = await userManager.createSession(user.id);
    
    res.json({ success: true, user, sessionId });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Logout
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const sessionId = req.headers.authorization?.replace('Bearer ', '') || 
                     req.cookies?.sessionId;
    
    if (sessionId) {
      await userManager.deleteSession(sessionId);
    }
    
    res.clearCookie('sessionId');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Get all users (admin only)
router.get('/users', requireAuth, async (req, res) => {
  if (req.user.userRole !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  try {
    const users = await userManager.getAllUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user (admin only)
router.put('/users/:userId', requireAuth, async (req, res) => {
  try {
    // Only admins can update others
    if (req.user.userRole !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { userId } = req.params;
    const { subscriptionTier, userRole } = req.body;
    
    const updates = {};
    if (subscriptionTier && VALID_SUBSCRIPTION_TIERS.includes(subscriptionTier)) {
      updates.subscriptionTier = subscriptionTier;
    }
    if (userRole && VALID_USER_ROLES.includes(userRole)) {
      updates.userRole = userRole;
    }

    const user = await userManager.updateUser(userId, updates);
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;