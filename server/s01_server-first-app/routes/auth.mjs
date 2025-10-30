import express from 'express';
import { UserManager } from '../lib/auth/userManager.mjs';
import { requireAuth, requireRole } from '../middleware/authMiddleware.mjs';
import { USER_DEFAULTS, VALID_SUBSCRIPTION_TIERS, VALID_USER_ROLES } from '../lib/auth/userDefaults.mjs';

const router = express.Router();
const userManager = new UserManager();

// Register new user
router.post('/register', requireAuth, async (req, res) => {
  try {
    // Only admins can register new users
    if (req.user.userRole !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const { email, password, userRole = USER_DEFAULTS.USER_ROLE } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // New users get the same subscription tier as the admin creating them
    const user = await userManager.createUser(email, password, req.user.subscriptionTier, userRole);
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

// Get all users (admin only, filtered by subscription tier)
router.get('/users', requireAuth, async (req, res) => {
  if (req.user.userRole !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  try {
    const allUsers = await userManager.getAllUsers();
    // Filter users to only show those with the same subscription tier as the admin
    const users = allUsers.filter(user => user.subscriptionTier === req.user.subscriptionTier);
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
    const { subscriptionTier, userRole, isActive, password, email } = req.body;
    
    const updates = {};
    
    // Only admins can update user role, active status, email, and any user's password
    if (req.user.userRole === 'admin') {
      if (userRole && VALID_USER_ROLES.includes(userRole)) {
        updates.userRole = userRole;
      }
      if (typeof isActive === 'boolean') {
        updates.isActive = isActive;
      }
      if (email) {
        updates.email = email;
      }
      if (password) {
        updates.password = password;
      }
    } else {
      // Non-admins can only update their own password
      if (password && req.user.id === userId) {
        updates.password = password;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }
    
    const user = await userManager.updateUser(userId, updates);
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:userId', requireAuth, async (req, res) => {
  try {
    if (req.user.userRole !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { userId } = req.params;
    await userManager.deleteUser(userId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;