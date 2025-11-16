import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const LICENSE_DIR = '/Users/Shared/AIPrivateSearch/data';
const LICENSE_FILE = path.join(LICENSE_DIR, 'license.enc');

export class LicenseStorage {
  
  static ensureDirectory() {
    if (!fs.existsSync(LICENSE_DIR)) {
      fs.mkdirSync(LICENSE_DIR, { recursive: true });
    }
  }

  static encrypt(data, key) {
    const iv = crypto.randomBytes(16);
    const keyBuffer = crypto.scryptSync(key, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedData, key) {
    try {
      const parts = encryptedData.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const keyBuffer = crypto.scryptSync(key, 'salt', 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error('Failed to decrypt license data');
    }
  }

  static generateEncryptionKey(hwId) {
    return crypto.createHash('sha256').update(`aips-license-${hwId}`).digest('hex');
  }

  static async saveLicense(token, hwId) {
    try {
      this.ensureDirectory();
      const key = this.generateEncryptionKey(hwId);
      const licenseData = {
        token,
        hwId,
        savedAt: Date.now()
      };
      
      const encrypted = this.encrypt(licenseData, key);
      fs.writeFileSync(LICENSE_FILE, encrypted, 'utf8');
      return true;
    } catch (error) {
      console.error('Failed to save license:', error);
      return false;
    }
  }

  static async loadLicense(hwId) {
    try {
      if (!fs.existsSync(LICENSE_FILE)) {
        return null;
      }

      const encrypted = fs.readFileSync(LICENSE_FILE, 'utf8');
      const key = this.generateEncryptionKey(hwId);
      const licenseData = this.decrypt(encrypted, key);
      
      // Verify hardware ID matches
      if (licenseData.hwId !== hwId) {
        console.warn('Hardware ID mismatch in stored license');
        return null;
      }

      return licenseData;
    } catch (error) {
      console.error('Failed to load license:', error);
      return null;
    }
  }

  static async deleteLicense() {
    try {
      if (fs.existsSync(LICENSE_FILE)) {
        fs.unlinkSync(LICENSE_FILE);
      }
      return true;
    } catch (error) {
      console.error('Failed to delete license:', error);
      return false;
    }
  }

  static async hasValidLicense(hwId) {
    const license = await this.loadLicense(hwId);
    return license && license.token;
  }
}