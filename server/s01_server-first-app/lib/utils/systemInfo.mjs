import { execSync } from 'child_process';
import os from 'os';

// System information helper
export async function getSystemInfo() {
  try {
    let chip = 'Unknown';
    let graphics = 'Unknown';
    let ram = 'Unknown';
    let osInfo = 'Unknown';
    let pcCode = 'Unknown';
    
    if (process.platform === 'darwin') {
      try {
        chip = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8' }).trim();
        const memBytes = execSync('sysctl -n hw.memsize', { encoding: 'utf8' }).trim();
        ram = `${Math.round(parseInt(memBytes) / (1024 ** 3))} GB`;
        osInfo = `macOS ${os.release()}`;
        const fullSerial = execSync('system_profiler SPHardwareDataType | grep "Serial Number" | awk \'{print $4}\'', { encoding: 'utf8' }).trim();
        if (fullSerial && fullSerial.length >= 6) {
          pcCode = fullSerial.substring(0, 3) + fullSerial.substring(fullSerial.length - 3);
        } else {
          pcCode = fullSerial || 'Unknown';
        }
      } catch (e) {
        // Fallback to basic info
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
      pcCode
    };
  } catch (error) {
    return {
      systemInfo: { chip: 'Unknown', graphics: 'Unknown', ram: 'Unknown', os: 'Unknown' },
      pcCode: 'Unknown'
    };
  }
}