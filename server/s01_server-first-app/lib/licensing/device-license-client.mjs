import crypto from 'crypto';
import os from 'os';
import { execSync } from 'child_process';
import axios from 'axios';

class DeviceLicenseClient {
    constructor() {
        this.custmgrUrl = null;
        this.deviceUuid = null;
        this.customerEmail = null;
        this.licenseStatus = null;
        this.lastCheck = 0;
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    }

    async initialize(custmgrConfig) {
        const protocol = custmgrConfig?.protocol || 'https';
        const host = custmgrConfig?.host || 'custmgr.aiprivatesearch.com';
        this.custmgrUrl = `${protocol}://${host}`;
        console.log('🔐 DEVICE LICENSE: Using custmgr URL:', this.custmgrUrl);
        
        // Generate or load device UUID
        this.deviceUuid = this.getDeviceUuid();
        console.log('🔐 DEVICE LICENSE: Device UUID:', this.deviceUuid);
    }

    getDeviceUuid() {
        try {
            // Try to get Mac serial number + hardware UUID for unique device ID
            const serialNumber = execSync('system_profiler SPHardwareDataType | grep "Serial Number" | awk \'{print $4}\'', { encoding: 'utf8' }).trim();
            const hardwareUuid = execSync('system_profiler SPHardwareDataType | grep "Hardware UUID" | awk \'{print $3}\'', { encoding: 'utf8' }).trim();
            
            if (serialNumber && hardwareUuid) {
                // Create consistent device UUID from hardware info
                const deviceString = `${serialNumber}-${hardwareUuid}`;
                return crypto.createHash('sha256').update(deviceString).digest('hex').substring(0, 32);
            }
        } catch (error) {
            console.warn('🔐 DEVICE LICENSE: Could not get hardware info:', error.message);
        }
        
        // Fallback: generate and store UUID
        const stored = process.env.DEVICE_UUID;
        if (stored) return stored;
        
        const newUuid = crypto.randomUUID();
        console.log('🔐 DEVICE LICENSE: Generated new device UUID:', newUuid);
        return newUuid;
    }

    async validateDevice(email) {
        if (!email || !this.deviceUuid) {
            console.log('🔐 DEVICE LICENSE: Missing email or device UUID');
            return { valid: false, reason: 'Missing email or device UUID' };
        }

        try {
            console.log('🔐 DEVICE LICENSE: Validating device:', { email, deviceUuid: this.deviceUuid });
            
            const response = await axios.post(`${this.custmgrUrl}/api/licensing/validate-device`, {
                email: email,
                deviceUuid: this.deviceUuid,
                deviceName: await this.getDeviceName()
            }, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('🔐 DEVICE LICENSE: Device validation response:', response.data);
            
            if (response.data.valid) {
                this.customerEmail = email;
                this.licenseStatus = {
                    valid: true,
                    email: email,
                    tier: response.data.customer?.tier || 1,
                    deviceUuid: this.deviceUuid,
                    lastValidated: Date.now()
                };
                this.lastCheck = Date.now();
                return this.licenseStatus;
            } else {
                return { valid: false, reason: response.data.reason || 'Device not registered' };
            }
        } catch (error) {
            console.error('🔐 DEVICE LICENSE: Device validation failed:', error.message);
            return { valid: false, reason: `Validation failed: ${error.message}` };
        }
    }

    async registerDevice(email) {
        if (!email || !this.deviceUuid) {
            return { success: false, error: 'Missing email or device UUID' };
        }

        try {
            console.log('🔐 DEVICE LICENSE: Registering device:', { email, deviceUuid: this.deviceUuid });
            
            // Step 1: Try to create license if it doesn't exist
            try {
                console.log('🔐 DEVICE LICENSE: Attempting to create license for:', email);
                const createResponse = await axios.post(`${this.custmgrUrl}/api/licensing/create-license`, {
                    email: email
                }, {
                    timeout: 15000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('🔐 DEVICE LICENSE: License creation response:', createResponse.data);
            } catch (createError) {
                // License might already exist, continue with device registration
                console.log('🔐 DEVICE LICENSE: License creation failed (may already exist):', createError.response?.data || createError.message);
            }
            
            // Step 2: Register device
            const response = await axios.post(`${this.custmgrUrl}/api/licensing/register-device`, {
                email: email,
                deviceUuid: this.deviceUuid,
                deviceName: await this.getDeviceName()
            }, {
                timeout: 15000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('🔐 DEVICE LICENSE: Device registration response:', response.data);
            
            if (response.data.success) {
                this.customerEmail = email;
                this.licenseStatus = {
                    valid: true,
                    email: email,
                    tier: response.data.customer?.tier || 1,
                    deviceUuid: this.deviceUuid,
                    lastValidated: Date.now()
                };
                this.lastCheck = Date.now();
                return { success: true, license: this.licenseStatus };
            } else {
                return { success: false, error: response.data.error || 'Registration failed' };
            }
        } catch (error) {
            console.error('🔐 DEVICE LICENSE: Device registration failed:', error.message);
            return { success: false, error: `Registration failed: ${error.message}` };
        }
    }

    async getDeviceName() {
        try {
            // Import systemInfo to get PC details
            const { getSystemInfo } = await import('../utils/systemInfo.mjs');
            const systemInfo = await getSystemInfo();
            
            // Create device name from PC info: PcCode-PcCPU-PcGraphics-PcRAM-PcOS
            const deviceName = [
                systemInfo.pcCode,
                systemInfo.systemInfo.chip,
                systemInfo.systemInfo.graphics,
                systemInfo.systemInfo.ram,
                systemInfo.systemInfo.os
            ].filter(Boolean).join('-');
            
            return deviceName || (os.hostname() + '-Unknown');
        } catch (error) {
            console.warn('🔐 DEVICE LICENSE: Could not create device name:', error.message);
            return os.hostname() || 'Unknown Mac';
        }
    }

    async checkLicenseStatus(email = null, forceRefresh = false) {
        const now = Date.now();
        
        // Use cached status if recent and not forced
        if (this.licenseStatus && !forceRefresh && (now - this.lastCheck) < this.cacheTimeout) {
            console.log('🔐 DEVICE LICENSE: Using cached license status');
            return this.licenseStatus;
        }

        // Use stored email if not provided
        const checkEmail = email || this.customerEmail;
        if (!checkEmail) {
            console.log('🔐 DEVICE LICENSE: No email available for license check');
            return { valid: false, reason: 'No email provided', requiresActivation: true };
        }

        console.log('🔐 DEVICE LICENSE: Checking license status for:', checkEmail);
        return await this.validateDevice(checkEmail);
    }

    getSystemHardwareId() {
        return this.deviceUuid;
    }
}

export { DeviceLicenseClient };