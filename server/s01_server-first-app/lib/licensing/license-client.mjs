import axios from 'axios';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { getSystemInfo } from './hardware.mjs';
import { LicenseStorage } from './license-storage.mjs';

let CUSTMGR_BASE_URL;

// Load custmgr URL from app.json config
async function loadCustmgrConfig() {
  try {
    const fs = await import('fs/promises');
    const appConfig = JSON.parse(await fs.readFile('../../client/c01_client-first-app/config/app.json', 'utf8'));
    if (appConfig.custmgr) {
      const protocol = appConfig.custmgr.protocol || 'https';
      const host = appConfig.custmgr.host;
      const port = appConfig.custmgr.port;
      
      if (port) {
        CUSTMGR_BASE_URL = `${protocol}://${host}:${port}`;
      } else {
        CUSTMGR_BASE_URL = `${protocol}://${host}`;
      }
      console.log('Using custmgr URL from config:', CUSTMGR_BASE_URL);
    } else {
      throw new Error('No custmgr configuration found in app.json');
    }
  } catch (error) {
    throw new Error(`Failed to load custmgr configuration: ${error.message}`);
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
      console.log('🔐 LICENSE DEBUG: Starting license refresh...');
      
      const systemInfo = getSystemInfo();
      const license = await LicenseStorage.loadLicense(systemInfo.compositeId);
      
      console.log('🔐 LICENSE DEBUG: System HW ID:', systemInfo.compositeId);
      console.log('🔐 LICENSE DEBUG: Existing license found:', !!license);
      
      if (!license || !license.token) {
        console.log('🔐 LICENSE DEBUG: No license found to refresh');
        throw new Error('No license found to refresh');
      }

      console.log('🔐 LICENSE DEBUG: Refreshing token (first 50 chars):', license.token.substring(0, 50) + '...');
      console.log('🔐 LICENSE DEBUG: Making refresh request to:', `${CUSTMGR_BASE_URL}/api/licensing/refresh`);
      
      const response = await axios.post(`${CUSTMGR_BASE_URL}/api/licensing/refresh`, {
        refreshToken: license.token
      }, {
        timeout: 10000
      });

      console.log('🔐 LICENSE DEBUG: Refresh response status:', response.status);
      console.log('🔐 LICENSE DEBUG: Refresh response data:', response.data);
      
      if (response.data.token) {
        // Save refreshed license
        await LicenseStorage.saveLicense(response.data.token, systemInfo.compositeId);
        console.log('🔐 LICENSE DEBUG: New token saved successfully');
        return {
          success: true,
          token: response.data.token
        };
      }

      throw new Error('No token received from refresh');
    } catch (error) {
      console.error('🔐 LICENSE DEBUG: License refresh failed:', error.message);
      console.error('🔐 LICENSE DEBUG: Error response status:', error.response?.status);
      console.error('🔐 LICENSE DEBUG: Error response data:', error.response?.data);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  static async validateLicenseLocal(token) {
    try {
      console.log('🔐 LICENSE DEBUG: Starting local validation...');
      
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (!fs.existsSync(PUBLIC_KEY_FILE)) {
        console.log('🔐 LICENSE DEBUG: No public key file found at:', PUBLIC_KEY_FILE);
        return { valid: false, reason: 'No public key available for local validation' };
      }

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const publicKey = fs.readFileSync(PUBLIC_KEY_FILE, 'utf8');
      console.log('🔐 LICENSE DEBUG: Public key loaded, length:', publicKey.length);
      
      const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
      console.log('🔐 LICENSE DEBUG: JWT verification successful');
      
      // Verify hardware binding
      const systemInfo = getSystemInfo();
      const expectedHw = systemInfo.hwHash;
      
      console.log('🔐 LICENSE DEBUG: Expected HW hash:', expectedHw);
      console.log('🔐 LICENSE DEBUG: Token HW hash:', payload.hw);
      
      if (payload.hw !== expectedHw) {
        console.log('🔐 LICENSE DEBUG: Hardware mismatch!');
        return { valid: false, reason: 'Hardware mismatch' };
      }

      console.log('🔐 LICENSE DEBUG: Local validation successful');
      return { valid: true, payload };
    } catch (error) {
      console.log('🔐 LICENSE DEBUG: Local validation error:', error.message);
      return { valid: false, reason: error.message };
    }
  }

  static async validateLicenseRemote(token) {
    try {
      console.log('🔐 LICENSE DEBUG: Starting remote validation...');
      console.log('🔐 LICENSE DEBUG: Custmgr URL:', CUSTMGR_BASE_URL);
      
      const response = await axios.post(`${CUSTMGR_BASE_URL}/api/licensing/validate`, {
        token
      }, {
        timeout: 5000
      });

      console.log('🔐 LICENSE DEBUG: Remote validation response status:', response.status);
      console.log('🔐 LICENSE DEBUG: Remote validation response:', response.data);
      return response.data;
    } catch (error) {
      console.log('🔐 LICENSE DEBUG: Remote validation error:', error.message);
      console.log('🔐 LICENSE DEBUG: Error response status:', error.response?.status);
      console.log('🔐 LICENSE DEBUG: Error response data:', error.response?.data);
      
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
      
      console.log('🔐 LICENSE DEBUG: Checking license...');
      console.log('🔐 LICENSE DEBUG: System HW ID:', systemInfo.compositeId);
      console.log('🔐 LICENSE DEBUG: License exists:', !!license);
      
      if (!license || !license.token) {
        console.log('🔐 LICENSE DEBUG: No license token found');
        return { valid: false, reason: 'No license found' };
      }

      console.log('🔐 LICENSE DEBUG: Token (first 50 chars):', license.token.substring(0, 50) + '...');
      console.log('🔐 LICENSE DEBUG: Token length:', license.token.length);

      // Try local validation first
      const localResult = await this.validateLicenseLocal(license.token);
      console.log('🔐 LICENSE DEBUG: Local validation result:', localResult);
      
      if (localResult.valid) {
        // Check if token is close to expiry
        const payload = localResult.payload;
        const now = Math.floor(Date.now() / 1000);
        const gracePeriod = 7 * 24 * 3600; // 7 days
        
        console.log('🔐 LICENSE DEBUG: Token payload:', payload);
        console.log('🔐 LICENSE DEBUG: Current time:', now);
        console.log('🔐 LICENSE DEBUG: Token expires:', payload.exp);
        
        if (payload.exp < now) {
          // Token expired, check grace period
          if (now - payload.exp > gracePeriod) {
            console.log('🔐 LICENSE DEBUG: Token expired beyond grace period');
            return { valid: false, reason: 'License expired beyond grace period' };
          }
          console.log('🔐 LICENSE DEBUG: Token expired but within grace period');
          return { valid: true, payload, expired: true, gracePeriod: true };
        }
        
        console.log('🔐 LICENSE DEBUG: Token is valid and not expired');
        return { valid: true, payload };
      }

      // Fallback to remote validation
      console.log('🔐 LICENSE DEBUG: Local validation failed, trying remote...');
      const remoteResult = await this.validateLicenseRemote(license.token);
      console.log('🔐 LICENSE DEBUG: Remote validation result:', remoteResult);
      return remoteResult;
    } catch (error) {
      console.log('🔐 LICENSE DEBUG: Error in checkLicense:', error);
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