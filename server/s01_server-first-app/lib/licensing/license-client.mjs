import axios from 'axios';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { getSystemInfo } from './hardware.mjs';
import { LicenseStorage } from './license-storage.mjs';

let CUSTMGR_BASE_URL = process.env.CUSTMGR_URL || 'http://localhost:56304';

// Load custmgr URL from app.json config
async function loadCustmgrConfig() {
  try {
    const fs = await import('fs/promises');
    const appConfig = JSON.parse(await fs.readFile('../../client/c01_client-first-app/config/app.json', 'utf8'));
    if (appConfig.licensing && appConfig.licensing['custmgr-url']) {
      CUSTMGR_BASE_URL = appConfig.licensing['custmgr-url'];
      console.log('Using custmgr URL from config:', CUSTMGR_BASE_URL);
    }
  } catch (error) {
    console.warn('Could not load custmgr URL from config, using default:', CUSTMGR_BASE_URL);
  }
}

// Load config on module initialization
await loadCustmgrConfig();
const PUBLIC_KEY_FILE = path.join(process.cwd(), 'lib/licensing/public-key.pem');

export class LicenseClient {
  
  static async initialize() {
    try {
      // Download public key from custmgr
      await this.downloadPublicKey();
      return true;
    } catch (error) {
      console.error('Failed to initialize license client:', error);
      return false;
    }
  }

  static async downloadPublicKey() {
    try {
      const response = await axios.get(`${CUSTMGR_BASE_URL}/api/licensing/public-key`, {
        timeout: 5000
      });
      
      if (response.data.publicKey) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.writeFileSync(PUBLIC_KEY_FILE, response.data.publicKey);
        console.log('Public key downloaded successfully');
      }
    } catch (error) {
      console.warn('Failed to download public key:', error.message);
      // Continue without public key - will require online validation
    }
  }

  static async activateLicense(email) {
    try {
      const systemInfo = getSystemInfo();
      if (!systemInfo) {
        throw new Error('Unable to get system information');
      }

      console.log('Attempting to connect to custmgr at:', CUSTMGR_BASE_URL);
      const response = await axios.post(`${CUSTMGR_BASE_URL}/api/licensing/activate`, {
        email,
        hwId: systemInfo.compositeId,
        appVersion: '19.61',
        appId: 'aiprivatesearch'
      }, {
        timeout: 10000
      });

      if (response.data.token) {
        // Save license locally
        await LicenseStorage.saveLicense(response.data.token, systemInfo.compositeId);
        console.log('License activated and saved successfully');
        return {
          success: true,
          token: response.data.token,
          existing: response.data.existing
        };
      }

      throw new Error('No token received from activation');
    } catch (error) {
      console.error('License activation failed:', error.message);
      console.error('Full error:', error.code, error.response?.status);
      
      return {
        success: false,
        error: `License activation failed: ${error.message}. Please ensure the licensing server is available and try again.`
      };
    }
  }

  static async refreshLicense() {
    try {
      const systemInfo = getSystemInfo();
      const license = await LicenseStorage.loadLicense(systemInfo.compositeId);
      
      if (!license || !license.token) {
        throw new Error('No license found to refresh');
      }

      const response = await axios.post(`${CUSTMGR_BASE_URL}/api/licensing/refresh`, {
        token: license.token
      }, {
        timeout: 10000
      });

      if (response.data.token) {
        // Save refreshed license
        await LicenseStorage.saveLicense(response.data.token, systemInfo.compositeId);
        console.log('License refreshed successfully');
        return {
          success: true,
          token: response.data.token
        };
      }

      throw new Error('No token received from refresh');
    } catch (error) {
      console.error('License refresh failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  static async validateLicenseLocal(token) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (!fs.existsSync(PUBLIC_KEY_FILE)) {
        return { valid: false, reason: 'No public key available for local validation' };
      }

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const publicKey = fs.readFileSync(PUBLIC_KEY_FILE, 'utf8');
      const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
      
      // Verify hardware binding
      const systemInfo = getSystemInfo();
      const expectedHw = systemInfo.hwHash;
      
      if (payload.hw !== expectedHw) {
        return { valid: false, reason: 'Hardware mismatch' };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }

  static async validateLicenseRemote(token) {
    try {
      const response = await axios.post(`${CUSTMGR_BASE_URL}/api/licensing/validate`, {
        token
      }, {
        timeout: 5000
      });

      return response.data;
    } catch (error) {
      return {
        valid: false,
        reason: error.response?.data?.error || error.message
      };
    }
  }

  static async checkLicense() {
    try {
      const systemInfo = getSystemInfo();
      const license = await LicenseStorage.loadLicense(systemInfo.compositeId);
      
      if (!license || !license.token) {
        return { valid: false, reason: 'No license found' };
      }

      // Try local validation first
      const localResult = await this.validateLicenseLocal(license.token);
      if (localResult.valid) {
        // Check if token is close to expiry
        const payload = localResult.payload;
        const now = Math.floor(Date.now() / 1000);
        const gracePeriod = 7 * 24 * 3600; // 7 days
        
        if (payload.exp < now) {
          // Token expired, check grace period
          if (now - payload.exp > gracePeriod) {
            return { valid: false, reason: 'License expired beyond grace period' };
          }
          return { valid: true, payload, expired: true, gracePeriod: true };
        }
        
        return { valid: true, payload };
      }

      // Fallback to remote validation
      return await this.validateLicenseRemote(license.token);
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }

  static async startBackgroundRefresh() {
    // Refresh token every 24 hours
    setInterval(async () => {
      try {
        const result = await this.checkLicense();
        if (result.valid && result.payload) {
          const now = Math.floor(Date.now() / 1000);
          const timeToExpiry = result.payload.exp - now;
          
          // Refresh if less than 7 days remaining
          if (timeToExpiry < 7 * 24 * 3600) {
            console.log('Refreshing license token...');
            await this.refreshLicense();
          }
        }
      } catch (error) {
        console.error('Background license refresh failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }
}