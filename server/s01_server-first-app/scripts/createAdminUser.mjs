#!/usr/bin/env node

import { UserManager } from '../lib/auth/userManager.mjs';
import readline from 'readline';

const PROMPTS = {
  EMAIL: 'Enter admin email: ',
  PASSWORD: 'Enter admin password: ',
  TIER: 'Enter subscription tier (standard/premium/professional) [professional]: '
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAdminUser() {
  console.log('=== AIPrivateSearch Admin User Setup ===\n');
  
  const userManager = new UserManager();
  
  try {
    const email = await question(PROMPTS.EMAIL);
    const password = await question(PROMPTS.PASSWORD);
    const subscriptionTier = await question(PROMPTS.TIER) || 'professional';
    
    if (!['standard', 'premium', 'professional'].includes(subscriptionTier)) {
      console.error('Invalid subscription tier. Must be: standard, premium, or professional');
      process.exit(1);
    }
    
    const user = await userManager.createUser(email, password, subscriptionTier, 'admin');
    
    console.log('\n✅ Admin user created successfully!');
    console.log(`Email: ${user.email}`);
    console.log(`Subscription: ${user.subscriptionTier}`);
    console.log(`Role: ${user.userRole}`);
    console.log(`ID: ${user.id}`);
    
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createAdminUser();