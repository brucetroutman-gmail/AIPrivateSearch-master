/* eslint-disable security/detect-non-literal-fs-filename */

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
    
    throw new Error(`Config file not found at ${configPath}. Please ensure AIPrivateSearch is properly installed and config files are copied to the config location.`);
  }

  static getSourcesLocation() {
    const config = this.getConfig();
    return config['sources-location'] || '/Users/Shared/AIPrivateSearch/sources';
  }

  static getConfigLocation() {
    const config = this.getConfig();
    return config['config-location'] || '/Users/Shared/AIPrivateSearch/config';
  }

  static getAppName() {
    const config = this.getConfig();
    return config['app-name'] || 'AI Private Search';
  }

  static getPorts() {
    const config = this.getConfig();
    return config['ports'] || { frontend: 3000, backend: 3001 };
  }

  static getSubscriptionTier() {
    const config = this.getConfig();
    return config['subscription-tier'] || 3;
  }

  static getBearerTokenTimeout() {
    const config = this.getConfig();
    return config['bearer-token-timeout'] || 300;
  }
}