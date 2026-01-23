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
        this.cachedDeviceName = null;
        this.cachedPcCode = null;
    }

    async initialize(custmgrConfig) {
        const protocol = custmgrConfig?.protocol || 'https';
        const host = custmgrConfig?.host || 'custmgr.aiprivatesearch.com';
        this.custmgrUrl = `${protocol}://${host}`;
        console.log('🔐 DEVICE LICENSE: Using custmgr URL:', this.custmgrUrl);
        
        // Generate or load device UUID
        this.deviceUuid = this.getDeviceUuid();
        console.log('🔐 DEVICE LICENSE: Device UUID:', this.deviceUuid);
        
        // Load stored customer email if exists
        await this.loadStoredEmail();
    }

    getDeviceUuid() {
        // Use cached UUID if available
        if (this.deviceUuid) return this.deviceUuid;
        
        try {
            // Get hardware identifiers using ioreg (instant)
            const ioregOutput = execSync('ioreg -rd1 -c IOPlatformExpertDevice', { encoding: 'utf8' });
            
            // Extract UUID and Serial Number
            const uuidMatch = ioregOutput.match(/"IOPlatformUUID"\s*=\s*"([A-F0-9-]+)"/i);
            const serialMatch = ioregOutput.match(/"IOPlatformSerialNumber"\s*=\s*"([^"]+)"/i);
            
            if (uuidMatch && serialMatch) {
                // Create consistent device UUID from platform UUID + serial number
                const deviceId = uuidMatch[1] + serialMatch[1];
                this.deviceUuid = crypto.createHash('md5').update(deviceId).digest('hex');
                console.log('🔐 DEVICE LICENSE: Using platform UUID + serial for device ID');
                return this.deviceUuid;
            }
        } catch (error) {
            console.error('🔐 DEVICE LICENSE: Failed to get platform identifiers:', error.message);
        }
        
        // Fallback to machine ID
        const machineId = os.hostname() + os.platform() + os.arch();
        this.deviceUuid = crypto.createHash('md5').update(machineId).digest('hex');
        return this.deviceUuid;
    }

    async validateDevice(email) {
        const startTime = Date.now();
        console.log('🔐 TIMING: validateDevice START');
        
        if (!email || !this.deviceUuid) {
            console.log('🔐 DEVICE LICENSE: Missing email or device UUID');
            return { valid: false, reason: 'Missing email or device UUID' };
        }

        try {
            console.log('🔐 TIMING: About to call getDeviceName');
            const deviceNameStart = Date.now();
            const deviceName = await this.getDeviceName();
            console.log(`🔐 TIMING: getDeviceName took ${Date.now() - deviceNameStart}ms`);
            
            console.log('🔐 DEVICE LICENSE: Validating device:', { email, deviceUuid: this.deviceUuid });
            
            console.log('🔐 TIMING: About to make axios POST request');
            const axiosStart = Date.now();
            
            const response = await axios.post(`${this.custmgrUrl}/api/licensing/validate-device`, {
                email: email,
                deviceUuid: this.deviceUuid,
                deviceName: deviceName
            }, {
                timeout: 1000,
                headers: {
                    'Content-Type': 'application/json',
                    'Connection': 'close'
                }
            });
            
            console.log(`🔐 TIMING: axios POST took ${Date.now() - axiosStart}ms`);
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
                console.log(`🔐 TIMING: validateDevice TOTAL took ${Date.now() - startTime}ms`);
                return this.licenseStatus;
            } else {
                console.log(`🔐 TIMING: validateDevice TOTAL took ${Date.now() - startTime}ms`);
                return { valid: false, reason: response.data.reason || 'Device not registered' };
            }
        } catch (error) {
            console.error('🔐 DEVICE LICENSE: Device validation failed:', error.message);
            console.log(`🔐 TIMING: validateDevice TOTAL (ERROR) took ${Date.now() - startTime}ms`);
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
                    timeout: 5000,
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
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('🔐 DEVICE LICENSE: Device registration response:', response.data);
            
            if (response.data.success) {
                this.customerEmail = email;
                await this.saveEmail(email); // Persist email to disk
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
        // Use cached device name if available
        if (this.cachedDeviceName) {
            return this.cachedDeviceName;
        }
        
        try {
            // Get device info using fast sysctl and system commands
            const computerName = execSync('scutil --get ComputerName', { encoding: 'utf8' }).trim();
            const hwModel = execSync('sysctl -n hw.model', { encoding: 'utf8' }).trim();
            const cpuBrand = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8' }).trim();
            const memBytes = parseInt(execSync('sysctl -n hw.memsize', { encoding: 'utf8' }).trim());
            const memGB = Math.round(memBytes / (1024 * 1024 * 1024));
            const osVersion = execSync('sw_vers -productVersion', { encoding: 'utf8' }).trim();
            
            // Get serial number using ioreg (instant)
            let serialNumber = 'Unknown';
            try {
                const serialOutput = execSync('ioreg -l | grep IOPlatformSerialNumber', { encoding: 'utf8' }).trim();
                // Match the actual serial number: "IOPlatformSerialNumber" = "C02G6912MD6R"
                const serialMatch = serialOutput.match(/"IOPlatformSerialNumber"\s*=\s*"([^"]+)"/i);
                if (serialMatch) {
                    serialNumber = serialMatch[1];
                }
            } catch (serialError) {
                console.warn('🔐 DEVICE LICENSE: Could not get serial number:', serialError.message);
            }
            
            // Format: SerialNumber-ComputerName-HWModel-CPU-Memory-macOS Version
            this.cachedDeviceName = `${serialNumber}-${computerName}-${hwModel}-${cpuBrand}-${memGB} GB-macOS ${osVersion}`;
            console.log('🔐 DEVICE LICENSE: Generated device name:', this.cachedDeviceName);
            return this.cachedDeviceName;
        } catch (error) {
            console.error('🔐 DEVICE LICENSE: Failed to get device info:', error.message);
            // Fallback to basic info
            this.cachedDeviceName = `${os.hostname()}-${os.platform()}-${os.arch()}`;
            return this.cachedDeviceName;
        }
    }

    async checkLicenseStatus(email = null, forceRefresh = false) {
        const now = Date.now();
        
        // Use cached status if recent and not forced
        if (this.licenseStatus && !forceRefresh && (now - this.lastCheck) < this.cacheTimeout) {
            console.log('🔐 DEVICE LICENSE: Using cached license status');
            return this.licenseStatus;
        }

        // Use provided email or stored customer email
        const checkEmail = email || this.customerEmail;
        if (!checkEmail) {
            console.log('🔐 DEVICE LICENSE: No customer email available - device requires activation');
            return { valid: false, reason: 'Device not activated', requiresActivation: true };
        }

        console.log('🔐 DEVICE LICENSE: Checking license status for:', checkEmail);
        return await this.validateDevice(checkEmail);
    }

    getSystemHardwareId() {
        return this.deviceUuid;
    }

    getPcCode() {
        // Use cached PC code if available
        if (this.cachedPcCode) {
            return this.cachedPcCode;
        }
        
        try {
            // Get serial number using ioreg (instant)
            const serialOutput = execSync('ioreg -l | grep IOPlatformSerialNumber', { encoding: 'utf8' }).trim();
            // Match the actual serial number: "IOPlatformSerialNumber" = "C02G6912MD6R"
            const serialMatch = serialOutput.match(/"IOPlatformSerialNumber"\s*=\s*"([^"]+)"/i);
            
            if (serialMatch && serialMatch[1]) {
                const serialNumber = serialMatch[1];
                // Create PC code: first 3 digits + last 3 digits of serial number (all caps)
                if (serialNumber.length >= 6) {
                    this.cachedPcCode = (serialNumber.substring(0, 3) + serialNumber.substring(serialNumber.length - 3)).toUpperCase();
                } else {
                    // If serial is too short, use the whole serial
                    this.cachedPcCode = serialNumber.toUpperCase();
                }
                console.log('🔐 DEVICE LICENSE: Serial number:', serialNumber);
                console.log('🔐 DEVICE LICENSE: Generated PC code:', this.cachedPcCode);
                return this.cachedPcCode;
            }
        } catch (error) {
            console.error('🔐 DEVICE LICENSE: Failed to get serial number for PC code:', error.message);
        }
        
        // Fallback to hostname-based code
        const hostname = os.hostname();
        this.cachedPcCode = hostname.substring(0, Math.min(6, hostname.length)).toUpperCase();
        return this.cachedPcCode;
    }

    async getSystemInfo() {
        try {
            let chip = 'Unknown';
            let graphics = 'Unknown';
            let ram = 'Unknown';
            let osInfo = 'Unknown';
            
            if (process.platform === 'darwin') {
                try {
                    chip = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8' }).trim();
                    const memBytes = execSync('sysctl -n hw.memsize', { encoding: 'utf8' }).trim();
                    ram = `${Math.round(parseInt(memBytes) / (1024 ** 3))} GB`;
                    osInfo = `macOS ${execSync('sw_vers -productVersion', { encoding: 'utf8' }).trim()}`;
                } catch (e) {
                    chip = os.cpus()[0]?.model || 'Unknown';
                    ram = `${Math.round(os.totalmem() / (1024 ** 3))} GB`;
                    osInfo = `${os.type()} ${os.release()}`;
                }
            } else {
                chip = os.cpus()[0]?.model || 'Unknown';
                ram = `${Math.round(os.totalmem() / (1024 ** 3))} GB`;
                osInfo = `${os.type()} ${os.release()}`;
            }
            
            return {
                systemInfo: { chip, graphics, ram, os: osInfo },
                pcCode: this.getPcCode()
            };
        } catch (error) {
            return {
                systemInfo: { chip: 'Unknown', graphics: 'Unknown', ram: 'Unknown', os: 'Unknown' },
                pcCode: 'Unknown'
            };
        }
    }

    async loadStoredEmail() {
        try {
            const fs = await import('fs/promises');
            const configFile = '/Users/Shared/AIPrivateSearch/config/app.json';
            const config = JSON.parse(await fs.readFile(configFile, 'utf8'));
            if (config.customerEmail) {
                this.customerEmail = config.customerEmail;
                console.log('🔐 DEVICE LICENSE: Loaded stored email from config:', this.customerEmail);
            }
        } catch (error) {
            console.log('🔐 DEVICE LICENSE: No stored email found in config');
        }
    }

    async saveEmail(email) {
        try {
            const fs = await import('fs/promises');
            const configFile = '/Users/Shared/AIPrivateSearch/config/app.json';
            const config = JSON.parse(await fs.readFile(configFile, 'utf8'));
            config.customerEmail = email;
            await fs.writeFile(configFile, JSON.stringify(config, null, 2), 'utf8');
            this.customerEmail = email;
            console.log('🔐 DEVICE LICENSE: Saved email to config:', email);
        } catch (error) {
            console.error('🔐 DEVICE LICENSE: Failed to save email to config:', error.message);
        }
    }
}

export { DeviceLicenseClient };