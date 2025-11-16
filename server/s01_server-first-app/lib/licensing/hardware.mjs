import { execSync } from 'child_process';
import crypto from 'crypto';

export function getHardwareUUID() {
  try {
    const output = execSync('ioreg -rd1 -c IOPlatformExpertDevice').toString();
    const match = output.match(/IOPlatformUUID"\s+=\s+"([^"]+)"/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Failed to get hardware UUID:', error.message);
    return null;
  }
}

export function getMacSerial() {
  try {
    const output = execSync('system_profiler SPHardwareDataType').toString();
    const match = output.match(/Serial Number \(system\):\s*(.+)/);
    return match ? match[1].trim() : null;
  } catch (error) {
    console.error('Failed to get Mac serial:', error.message);
    return null;
  }
}

export function getSystemInfo() {
  try {
    const uuid = getHardwareUUID();
    const serial = getMacSerial();
    
    // Create a composite hardware ID for better uniqueness
    const compositeId = `${uuid || 'unknown'}-${serial || 'unknown'}`;
    const hwHash = crypto.createHash('sha256').update(compositeId).digest('hex');
    
    return {
      uuid,
      serial,
      compositeId,
      hwHash
    };
  } catch (error) {
    console.error('Failed to get system info:', error.message);
    return null;
  }
}