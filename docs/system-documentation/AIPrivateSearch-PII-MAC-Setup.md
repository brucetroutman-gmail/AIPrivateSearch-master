# **MAC-ONLY PII THEFT-PROOF SETUP**  
*(No HIPAA jargon, no MDM, no third-party apps — 100 % Apple-native, 10-minute config)*

---

## ONE-TIME 10-MINUTE HARDENING (Copy-Paste Checklist)

```bash
# 1. Firmware Password (blocks USB boot & recovery)
sudo firmwarepasswd -setpasswd && sudo firmwarepasswd -setmode command

# 2. FileVault (256-bit full-disk)
sudo fdesetup enable -user $(whoami)

# 3. Find My + Activation Lock
# → System Settings → Apple ID → iCloud → Find My Mac → ON
# → Enable “Find My network”

# 4. Auto-lock 60 sec
defaults write com.apple.screensaver askForPassword -int 1
defaults write com.apple.screensaver askForPasswordDelay -int 0
sudo defaults write /Library/Preferences/com.apple.screensaver idleTime 60

# 5. Firewall ON
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
```

---

## STEP-BY-STEP (macOS 15 Sequoia or later)

| # | Action | Screenshot Path (for your notes) |
|---|--------|----------------------------------|
| **1** | **Firmware Password** → Restart → hold **Command-R** → Utilities → **Firmware Password Utility** → Set 8+ char password | `Recovery → Utilities` |
| **2** | **FileVault** → **System Settings → Privacy & Security → FileVault → Turn On** → **Save 24-char recovery key in physical safe** | `Privacy & Security` |
| **3** | **Find My** → **System Settings → Apple ID → iCloud → Find My Mac → ON** → Turn on **“Find My network”** | `Apple ID → iCloud` |
| **4** | **Lock Screen** → **System Settings → Lock Screen** → “Require password” → **Immediately** | `Lock Screen` |
| **5** | **Touch ID + Passphrase** → Enroll 2 fingers → Set **14-char alphanumeric passphrase** | `Touch ID & Passcode` |
| **6** | **Firewall** → **System Settings → Network → Firewall → ON** | `Network` |

---

## PII STORAGE RULES (Zero Local Exposure)

| Rule | How |
|------|-----|
| **Never store PII in Downloads/Desktop** | Use **Encrypted Disk Image** instead |
| **Encrypted Container** | `Disk Utility → File → New Image → 256-bit AES, sparsebundle` → Mount only when needed |
| **Auto-unmount** | `defaults write com.apple.finder FK_DontAutoUnmountDiskImagesAfterDelay -int 300` (5 min) |

---

## IF STOLEN — 60-SECOND RESPONSE

1. Open **iCloud.com/find** on any device  
2. Select Mac → **Play Sound** (locates in bag/room)  
3. → **Mark As Lost** → Enter phone + message  
4. → **Erase Mac** (wipes FileVault key — data gone forever)  

> **Result**: Thief gets a $2,000 paperweight locked to your Apple ID.

---

## MONTHLY TEST (5 min)

1. Boot from **external macOS USB** (thief’s attack vector)  
2. Try to access disk → **“Encrypted — No Key”**  
3. Try Internet Recovery → **Firmware password prompt**  

---

**You’re done.**  
A stolen Mac is now **impossible to unlock, boot, or sell** — and **all PII stays encrypted**.