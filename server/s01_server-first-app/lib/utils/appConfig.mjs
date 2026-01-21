 

import fs from 'fs';

export class AppConfig {
  static getConfig() {
    const configPath = '/Users/Shared/AIPrivateSearch/config/app.json';
    
    try {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return config;
      }
    } catch (error) {
      console.error(`[AppConfig] Failed to load config from ${configPath}:`, error.message);
    }
    
    throw new Error(`CRITICAL: Config file not found at ${configPath}. AIPrivateSearch cannot start without proper configuration.`);
  }

  static getSourcesLocation() {
    const config = this.getConfig();
    if (!config['sources-location']) {
      throw new Error('sources-location not found in configuration');
    }
    return config['sources-location'];
  }

  static getConfigLocation() {
    const config = this.getConfig();
    if (!config['config-location']) {
      throw new Error('config-location not found in configuration');
    }
    return config['config-location'];
  }

  static getAppName() {
    const config = this.getConfig();
    if (!config['app-name']) {
      throw new Error('app-name not found in configuration');
    }
    return config['app-name'];
  }

  static getPorts() {
    const config = this.getConfig();
    if (!config['ports'] || !config['ports'].frontend || !config['ports'].backend) {
      throw new Error('ports configuration not found or incomplete');
    }
    return config['ports'];
  }

  static getSubscriptionTier() {
    const config = this.getConfig();
    if (config['subscription-tier'] === undefined) {
      throw new Error('subscription-tier not found in configuration');
    }
    return config['subscription-tier'];
  }

  static getBearerTokenTimeout() {
    const config = this.getConfig();
    if (!config['bearer-token-timeout']) {
      throw new Error('bearer-token-timeout not found in configuration');
    }
    return config['bearer-token-timeout'];
  }
}