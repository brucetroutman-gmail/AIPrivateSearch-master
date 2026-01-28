import express from 'express';
import { publicIpv4 } from 'public-ip';
import { DeviceLicenseClient } from '../lib/licensing/device-license-client.mjs';

const router = express.Router();
let deviceLicenseClient;

// Initialize device license client
async function initializeLicenseClient() {
  if (!deviceLicenseClient) {
    try {
      const fs = await import('fs/promises');
      const appConfig = JSON.parse(await fs.readFile('../../client/c01_client-first-app/config/app.json', 'utf8'));
      
      deviceLicenseClient = new DeviceLicenseClient();
      await deviceLicenseClient.initialize(appConfig.custmgr);
      console.log('Device license client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize device license client:', error);
      throw error;
    }
  }
  return deviceLicenseClient;
}

// Get license status
router.get('/status', async (req, res) => {
  try {
    console.log('🔐 DEVICE LICENSE API: Status check requested');
    
    const client = await initializeLicenseClient();
    
    // Device-based licensing - no email needed, uses device UUID
    console.log('🔐 DEVICE LICENSE API: Checking device license status');
    const status = await client.checkLicenseStatus();
    console.log('🔐 DEVICE LICENSE API: Status result:', status);
    
    res.json(status);
  } catch (error) {
    console.error('License status check failed:', error);
    res.json({
      valid: false,
      reason: 'License check failed',
      fallback: true
    });
  }
});

// Register device
router.post('/activate', async (req, res) => {
  try {
    console.log('🔐 DEVICE LICENSE API: Device registration requested');
    
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    const client = await initializeLicenseClient();
    
    // Get public IP address
    let publicIp = 'unknown';
    try {
      publicIp = await publicIpv4();
    } catch (error) {
      // Silent fail for public IP
    }
    
    const result = await client.registerDevice(email, publicIp);
    
    console.log('🔐 DEVICE LICENSE API: Registration result:', result);
    res.json(result);
  } catch (error) {
    console.error('Device registration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Device registration failed'
    });
  }
});

// Get system info
router.get('/system-info', async (req, res) => {
  try {
    const client = await initializeLicenseClient();
    res.json({
      deviceUuid: client.getSystemHardwareId(),
      deviceName: await client.getDeviceName()
    });
  } catch (error) {
    console.error('System info request failed:', error);
    res.status(500).json({
      error: 'Failed to get system info'
    });
  }
});

// Refresh license (for compatibility - not needed in device-based system)
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔐 DEVICE LICENSE API: Refresh requested (no-op in device system)');
    res.json({
      success: true,
      message: 'Device-based licensing does not require refresh'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Refresh failed'
    });
  }
});

export default router;