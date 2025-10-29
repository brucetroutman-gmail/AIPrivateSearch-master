import { secureFs } from '../utils/secureFileOps.mjs';
import path from 'path';
import crypto from 'crypto';
import { USER_DEFAULTS } from './userDefaults.mjs';

export class UserManager {
  constructor() {
    this.usersFile = '/Users/Shared/AIPrivateSearch/repo/aiprivatesearch/data/users.json';
    this.sessionsFile = '/Users/Shared/AIPrivateSearch/repo/aiprivatesearch/data/sessions.json';
    this.ensureDataDirectory();
  }

  async ensureDataDirectory() {
    const dataDir = path.dirname(this.usersFile);
    try {
      await secureFs.mkdir(dataDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  async loadUsers() {
    try {
      const data = await secureFs.readFile(this.usersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  async saveUsers(users) {
    await this.ensureDataDirectory();
    await secureFs.writeFile(this.usersFile, JSON.stringify(users, null, 2));
  }

  async loadSessions() {
    try {
      const data = await secureFs.readFile(this.sessionsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  async saveSessions(sessions) {
    await this.ensureDataDirectory();
    await secureFs.writeFile(this.sessionsFile, JSON.stringify(sessions, null, 2));
  }

  generateId() {
    return crypto.randomUUID();
  }

  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  async createUser(email, password, subscriptionTier = USER_DEFAULTS.SUBSCRIPTION_TIER, userRole = USER_DEFAULTS.USER_ROLE) {
    const users = await this.loadUsers();
    
    if (users.find(u => u.email === email)) {
      throw new Error('User already exists');
    }

    const user = {
      id: this.generateId(),
      email,
      passwordHash: this.hashPassword(password),
      subscriptionTier, // standard, premium, professional
      userRole, // admin, searcher
      createdAt: new Date().toISOString(),
      lastLogin: null,
      active: true
    };

    users.push(user);
    await this.saveUsers(users);
    
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async authenticateUser(email, password) {
    const users = await this.loadUsers();
    const user = users.find(u => u.email === email && u.active);
    
    if (!user || user.passwordHash !== this.hashPassword(password)) {
      throw new Error('Invalid credentials');
    }

    user.lastLogin = new Date().toISOString();
    await this.saveUsers(users);

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async createSession(userId) {
    const sessions = await this.loadSessions();
    const sessionId = this.generateId();
    
    sessions[sessionId] = {
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    await this.saveSessions(sessions);
    return sessionId;
  }

  async validateSession(sessionId) {
    const sessions = await this.loadSessions();
    const session = sessions[sessionId];
    
    if (!session || new Date(session.expiresAt) < new Date()) {
      return null;
    }

    const users = await this.loadUsers();
    const user = users.find(u => u.id === session.userId && u.active);
    
    if (!user) {
      return null;
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async deleteSession(sessionId) {
    const sessions = await this.loadSessions();
    delete sessions[sessionId];
    await this.saveSessions(sessions);
  }

  async getAllUsers() {
    const users = await this.loadUsers();
    return users.map(({ passwordHash, ...user }) => user);
  }

  async updateUser(userId, updates) {
    const users = await this.loadUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (updates.subscriptionTier) user.subscriptionTier = updates.subscriptionTier;
    if (updates.userRole) user.userRole = updates.userRole;
    
    await this.saveUsers(users);
    
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}