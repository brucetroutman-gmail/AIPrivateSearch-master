 
 
import { secureFs } from '../utils/secureFileOps.mjs';
import path from 'path';

export class SubscriptionManager {
  constructor() {
    this.configPath = path.join(process.cwd(), '../../client/c01_client-first-app/config/app.json');
    this.tierAccessPath = path.join(process.cwd(), '../../client/c01_client-first-app/config/tier-access.json');
    this.tierAccessConfig = null;
  }

  async loadTierAccessConfig() {
    if (this.tierAccessConfig) return this.tierAccessConfig;
    
    const configData = await secureFs.readFile(this.tierAccessPath, 'utf8');
    this.tierAccessConfig = JSON.parse(configData);
    return this.tierAccessConfig;
  }

  getFallbackConfig() {
    throw new Error('tier-access.json configuration file is required but not found');
  }

  async getSubscriptionTier() {
    const configData = await secureFs.readFile(this.configPath, 'utf8');
    const config = JSON.parse(configData);
    if (!config['subscription-tier']) {
      throw new Error('subscription-tier not found in app.json configuration');
    }
    return config['subscription-tier'];
  }

  async getTierName(tier) {
    const config = await this.loadTierAccessConfig();
    if (!config.tiers[tier]) {
      throw new Error(`Tier ${tier} not found in tier-access.json configuration`);
    }
    return config.tiers[tier].name;
  }

  async getTierFeatures(tier) {
    const config = await this.loadTierAccessConfig();
    const tierConfig = config.tiers[tier];
    if (!tierConfig) {
      throw new Error(`Tier ${tier} configuration not found`);
    }
    
    return {
      name: tierConfig.displayName || tierConfig.name,
      price: tierConfig.price,
      computers: tierConfig.computers,
      menuItems: tierConfig.menuItems,
      ...tierConfig.features,
      codeEmailFrequency: tierConfig.codeEmailFrequency
    };
  }

  async checkFeatureAccess(featureName, userRole = 'searcher') {
    const config = await this.loadTierAccessConfig();
    
    if (!config.config.enabled) {
      throw new Error('Tier access configuration is disabled - cannot check feature access');
    }
    
    const tier = await this.getSubscriptionTier();
    const featureGate = config.featureGates[featureName];
    
    if (!featureGate) {
      throw new Error(`Feature '${featureName}' not defined in tier access configuration`);
    }
    
    // Check tier requirement
    if (featureGate.requiredTier && tier < featureGate.requiredTier) {
      return false;
    }
    
    // Check role requirement
    if (featureGate.requiredRole && userRole !== featureGate.requiredRole) {
      return false;
    }
    
    return true;
  }

  async getAccessMatrix(tier, role) {
    const config = await this.loadTierAccessConfig();
    const tierName = await this.getTierName(tier);
    const accessMatrix = config.accessMatrix[tierName]?.[role];
    if (!accessMatrix) {
      throw new Error(`Access matrix not found for tier '${tierName}' and role '${role}'`);
    }
    return accessMatrix;
  }

  async getCSSClassMapping(tier, role) {
    const config = await this.loadTierAccessConfig();
    const tierName = await this.getTierName(tier);
    
    const tierClasses = config.cssClassMapping['tier-based'][tierName];
    const roleClasses = config.cssClassMapping['role-based'][role];
    
    if (!tierClasses) {
      throw new Error(`CSS class mapping not found for tier '${tierName}'`);
    }
    if (!roleClasses) {
      throw new Error(`CSS class mapping not found for role '${role}'`);
    }
    
    return {
      tierClasses,
      roleClasses
    };
  }
}