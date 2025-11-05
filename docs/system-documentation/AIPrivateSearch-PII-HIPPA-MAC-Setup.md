Below is a **battle-tested, HIPAA-ready Mac setup** that makes a stolen Mac **useless to a thief** while keeping you fully compliant with PII/ePHI protection.  
It uses **only Apple-native or HIPAA-vetted tools** (no third-party “tracking” apps that could leak data).

---

### QUICK-START CHECKLIST (Copy-Paste into Notes)

```
[ ] macOS 15 Sequoia (or latest) – auto-updates ON
[ ] FileVault 2 – ON (256-bit AES-XTS)
[ ] Find My Mac – ON (Activation Lock)
[ ] iCloud Private Relay + Lockdown Mode (optional but recommended)
[ ] Screen lock – 1 min inactivity, require password
[ ] Touch ID + strong 14-char passphrase
[ ] Firmware password (blocks boot from USB/recovery)
[ ] MDM profile (Jamf/Intune) – remote wipe + compliance checks
[ ] Encrypted Time Machine to external APFS (Encrypted) drive
[ ] No local ePHI outside encrypted containers
[ ] Annual HIPAA training + incident response plan
```

---

## STEP-BY-STEP CONFIGURATION

### 1. **Physical & Pre-Boot Hardening**
| Step | Action | Why |
|------|--------|-----|
| **Firmware password** | `sudo firmwarepasswd -setpasswd` (restart → Recovery → Utilities → Firmware Password) | Blocks boot from USB, Target Disk Mode, or Internet Recovery without password. |
| **Disable boot from external media** | In Recovery, use `csrutil` if needed; firmware password already prevents this. | Thief can’t boot Linux live USB to read disk. |

### 2. **Full-Disk Encryption (FileVault 2)**
1. **System Settings → Privacy & Security → FileVault → Turn On**  
2. **Choose “iCloud recovery” OR write down 24-character recovery key → store in physical safe + 1Password (BAA).**  
3. Reboot to confirm encryption starts.  
   → **256-bit AES-XTS**; data unreadable without login or recovery key.

### 3. **Activation Lock via Find My**
1. **System Settings → Apple ID → iCloud → Find My Mac → ON**  
2. **Enable “Find My network”** (offline tracking via Bluetooth mesh).  
   → If stolen, **Activation Lock** ties the Mac to your Apple ID; thief can’t erase or reactivate without your credentials.

### 4. **Auto-Lock & Strong Auth**
| Setting | Value |
|---------|-------|
| **Lock Screen** | System Settings → Lock Screen → “Require password” → **Immediately** after sleep/screen saver |
| **Screen Saver** | Start after **1 minute** |
| **Touch ID** | Enroll 2 fingers + **14-char alphanumeric passphrase** (not the same as Apple ID) |

### 5. **Network & Privacy Lockdown**
| Feature | Enable |
|---------|--------|
| **Firewall** | System Settings → Network → Firewall → ON |
| **iCloud Private Relay** | Apple ID → iCloud → Private Relay (hides IP) |
| **Lockdown Mode** *(optional for ultra-high risk)* | Privacy & Security → Lockdown Mode (blocks most attack vectors) |

### 6. **Remote Wipe & Tracking (MDM – REQUIRED for HIPAA)**
Use **Jamf Pro**, **Microsoft Intune**, or **Mosyle** (all have HIPAA BAAs).

| MDM Policy | Setting |
|------------|---------|
| **Remote Lock/Wipe** | Immediate wipe on “Lost Mode” |
| **Require FileVault** | Enforced |
| **Audit Logs** | 6-year retention |
| **Lost Mode Message** | “Property of [Org]. Call 1-800-XXX-XXXX” |

> **Free alternative for solo practitioners**: Use **iCloud.com/find** → Mark as Lost → Remote Erase.  
> **BUT** document this in your risk assessment; MDM is preferred for audit trails.

### 7. **Encrypted Backups**
1. External drive → **Disk Utility → Erase as APFS (Encrypted)**  
2. Time Machine → select encrypted drive  
3. Store offsite in locked cabinet or Iron Mountain (HIPAA-compliant).

### 8. **Data Compartmentalization**
- **Never store PII in iCloud Drive/Dropbox** unless encrypted first.  
- Use **Encrypted Disk Images** (`Disk Utility → New Image → 256-bit AES`) for any local ePHI.  
- Delete with **Secure Empty Trash** or `srm` in Terminal.

---

## THEFT SCENARIO PLAYBOOK (Print & Keep in Safe)

| Time | Action |
|------|--------|
| **0–1 hr** | User reports missing → IT marks as **Lost** in MDM/iCloud |
| **1–2 hr** | Remote **Lock** with custom message + passcode |
| **>2 hr** | If no recovery → **Remote Erase** (wipes FileVault key) |
| **Post-Erase** | File breach report to HHS within 60 days **only if ePHI was unencrypted** (it won’t be). |

---

## TOOLS SUMMARY (All HIPAA-Compliant)

| Layer | Tool | Cost |
|-------|------|------|
| OS | macOS + FileVault | Free |
| Tracking | Find My + Activation Lock | Free |
| MDM | Jamf/Intune/Mosyle | $6–12/user/month |
| Backup | APFS Encrypted External | $120 (2 TB) |
| Password Mgr | 1Password Teams (BAA) | $5/user/month |

---

### Final Pro Tip
**Test the wipe monthly**:  
1. Clone your Mac to an external bootable drive.  
2. Trigger remote erase.  
3. Confirm data is **gone** (try `diskutil apfs list` on another Mac).

You now have a **theft-proof, HIPAA-compliant Mac** that a thief can sell for parts—but **never access your PII**.