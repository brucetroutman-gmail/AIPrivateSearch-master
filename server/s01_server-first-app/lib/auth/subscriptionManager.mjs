import { secureFs } from '../utils/secureFileOps.mjs';
import path from 'path';

export class SubscriptionManager {
  constructor() {
    this.configPath = path.join(process.cwd(), '../../client/c01_client-first-app/config/app.json');
  }

  async getSubscriptionTier() {
    try {
      const configData = await secureFs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      return config['subscription-tier'] || 1; // Default to tier 1 (standard)
    } catch (error) {
      return 1; // Default to tier 1 if config fails
    }
  }

  getTierName(tier) {
    const tierNames = {
      1: 'standard',
      2: 'premium', 
      3: 'professional'
    };
    return tierNames[tier] || 'standard';
  }

  getTierFeatures(tier) {
    const features = {
      1: { // Standard - Free 4 months then $49/yr, 1 computer, admin/searcher roles only
        name: 'Standard',
        price: '$49/yr after 4 months free',
        computers: 1,
        menuItems: ['search', 'multi-mode', 'manage-collections', 'options'],
        canModifyDocIndex: false,
        canChangeModelParams: false,
        canChangeScoreModel: false,
        canChangeScoreParams: false,
        canAddUsers: true, // admin role only
        canManageModels: false,
        canModifyConfigFiles: false,
        fullMenuAccess: false,
        codeEmailFrequency: '2 weeks'
      },
      2: { // Premium - $199/yr, 5 computers, all Standard features plus manage models, modify config files, modify doc index cards
        name: 'Premium',
        price: '$199/yr',
        computers: 5,
        menuItems: ['search', 'multi-mode', 'manage-collections', 'manage-models', 'modify-config', 'options'],
        canModifyDocIndex: true,
        canChangeModelParams: true,
        canChangeScoreModel: true,
        canChangeScoreParams: true,
        canAddUsers: true,
        canManageModels: true,
        canModifyConfigFiles: true,
        fullMenuAccess: false,
        codeEmailFrequency: 'monthly'
      },
      3: { // Professional - $2999 license, all menu items, no code emails, full access
        name: 'Professional',
        price: '$2999 license',
        computers: 'unlimited',
        menuItems: 'all',
        canModifyDocIndex: true,
        canChangeModelParams: true,
        canChangeScoreModel: true,
        canChangeScoreParams: true,
        canAddUsers: true,
        canManageModels: true,
        canModifyConfigFiles: true,
        fullMenuAccess: true,
        codeEmailFrequency: 'none'
      }
    };
    return features[tier] || features[1];
  }

  async checkFeatureAccess(featureName, userRole = 'searcher') {
    const tier = await this.getSubscriptionTier();
    const features = this.getTierFeatures(tier);
    
    switch (featureName) {
      case 'modify-doc-index':
        return features.canModifyDocIndex;
      case 'change-model-params':
        return features.canChangeModelParams;
      case 'change-score-model':
        return features.canChangeScoreModel;
      case 'change-score-params':
        return features.canChangeScoreParams;
      case 'manage-models':
        return features.canManageModels;
      case 'modify-config-files':
        return features.canModifyConfigFiles;
      case 'full-menu-access':
        return features.fullMenuAccess;
      case 'add-users':
        return features.canAddUsers && userRole === 'admin';
      default:
        return true; // Default allow for basic features
    }
  }
}