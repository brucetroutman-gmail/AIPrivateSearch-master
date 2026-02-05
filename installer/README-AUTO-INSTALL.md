# AIPrivateSearch - Auto-Install Version

## 🎯 What This Does

This version creates installers that **automatically install everything** for your users:

- ✅ Node.js (v20.11.0)
- ✅ Ollama (latest version)
- ✅ Chrome browser (latest version)
- ✅ Rosetta (on Apple Silicon Macs)
- ✅ Downloads latest AIPrivateSearch from GitHub
- ✅ Configures everything automatically

**Users don't need to install anything manually!**

## 🚀 Quick Start

```bash
# Make executable
chmod +x build-auto-install.sh

# Build everything
./build-auto-install.sh
```

That's it! You'll get:
- `AIPrivateSearch-1.0.0.pkg` - Installer package
- `AIPrivateSearch-1.0.0.dmg` - Disk image

## 📦 What Your Users Experience

### Installation
1. Download `AIPrivateSearch-1.0.0.pkg` or `.dmg`
2. Install (drag to Applications or run installer)
3. Done!

### First Launch
1. Double-click AIPrivateSearch in Applications
2. Wait 5-15 minutes while it automatically:
   - Installs Node.js
   - Installs Ollama
   - Installs Chrome
   - Downloads code from GitHub
   - Configures everything
3. Browser opens automatically with AIPrivateSearch running

### Subsequent Launches
1. Double-click AIPrivateSearch
2. Opens in ~5 seconds
3. Ready to use!

## 📁 Where Everything Goes

```
/Applications/
└── AIPrivateSearch.app

/Users/Shared/AIPrivateSearch/
├── repo/
│   └── aiprivatesearch/        # Downloaded from GitHub
├── sources/
│   └── local-documents/         # Sample documents
├── data/
│   ├── users.json
│   └── sessions.json
├── config/
│   └── app.json
├── logs/
│   └── install.log             # Installation log
└── .env-aips                    # Configuration with DB credentials
```

## 🔐 Default Configuration

The installer creates `/Users/Shared/AIPrivateSearch/.env-aips` with:

```bash
# API Keys
API_KEY=dev-key
ADMIN_KEY=admin-key
NODE_ENV=development

# Default Admin Account
DEFAULT_ADMIN_EMAIL=adm-std@a.com
DEFAULT_ADMIN_PASSWORD=123

# Member Database Configuration
DB_HOST=92.112.184.206
DB_PORT=3306
DB_DATABASE=iodd2
DB_USERNAME=iodd-api
DB_PASSWORD=IODD@Api
```

**These are the same credentials from your original script!**

## 🛠️ Build Scripts

### Main Scripts

- **`build-auto-install.sh`** - Builds everything (recommended)
- **`build-app-auto-install.sh`** - Builds just the .app
- **`build-pkg-auto-install.sh`** - Builds just the .pkg
- **`build-dmg.sh`** - Builds the .dmg (same as before)

### Individual Builds

```bash
# Build .app only
./build-app-auto-install.sh

# Build .pkg only (requires .app to exist)
./build-pkg-auto-install.sh

# Build .dmg only (requires .app to exist)
./build-dmg.sh
```

## 📊 Comparison: Manual vs Auto-Install

### Original Manual Version
❌ User must install Node.js manually
❌ User must install Ollama manually
❌ User must install Chrome manually
❌ User must configure manually
⏱️ User time: 30-60 minutes

### New Auto-Install Version
✅ Installs Node.js automatically
✅ Installs Ollama automatically
✅ Installs Chrome automatically
✅ Configures automatically
⏱️ User time: Click and wait 5-15 minutes

## 🔄 How Auto-Installation Works

The launcher script does this automatically:

```bash
1. Check if AIPrivateSearch is already running → Exit if yes
2. Check for Node.js → Install if missing
3. Check for Ollama → Install if missing
4. Check for Chrome → Install if missing
5. Check for Rosetta (Apple Silicon) → Install if missing
6. Download latest code from GitHub
7. Create configuration with your DB credentials
8. Copy sample documents
9. Start the application
10. Open browser to http://localhost:3000
```

All automatic - user just waits!

## 📝 Installation Log

Everything is logged to:
```
/Users/Shared/AIPrivateSearch/logs/install.log
```

Users can check this if something goes wrong.

## ⚠️ Important Notes

### Internet Required
First launch requires internet to:
- Download Node.js installer (~50 MB)
- Download Ollama installer (~400 MB)
- Download Chrome installer (~200 MB)
- Download AIPrivateSearch from GitHub (~10 MB)

**Total first-time download: ~650 MB**

### Admin Password
User may be prompted for admin password when installing:
- Node.js (system-wide installation)
- Ollama (moving to /Applications)
- Chrome (moving to /Applications)

### Shared Directory
Uses `/Users/Shared/AIPrivateSearch` so it works for all users on the Mac.

## 🧪 Testing

### Test the .app directly:
```bash
open ./build/AIPrivateSearch.app
```

Watch the installation log:
```bash
tail -f /Users/Shared/AIPrivateSearch/logs/install.log
```

### Test the .pkg:
```bash
open AIPrivateSearch-1.0.0.pkg
```

Follow the installer wizard.

### Test the .dmg:
```bash
open AIPrivateSearch-1.0.0.dmg
```

Drag app to Applications and launch.

## 🎯 Distribution

### For General Users
**Recommended:** `AIPrivateSearch-1.0.0.pkg`
- Professional installer experience
- Shows progress and status
- Easier for non-technical users

### For Traditional Mac Users
**Alternative:** `AIPrivateSearch-1.0.0.dmg`
- Familiar drag-to-install
- Looks more "Mac-like"
- Smaller download (compressed)

### GitHub Release Example
```markdown
## AIPrivateSearch v1.0.0

### 🚀 Easy Installation
Download and install - everything else is automatic!

**Installer Package (Recommended)**
[AIPrivateSearch-1.0.0.pkg](link) - 50 MB
- Professional installer
- Click through wizard
- Everything installs automatically

**Disk Image**
[AIPrivateSearch-1.0.0.dmg](link) - 42 MB
- Traditional Mac installation
- Drag to Applications folder
- Auto-installs prerequisites on first launch

### ⏱️ First Launch
The first time you launch, AIPrivateSearch will automatically:
- Install Node.js, Ollama, and Chrome (if needed)
- Download the latest code
- Configure everything
- Open in your browser

This takes 5-15 minutes. Subsequent launches take ~5 seconds.

### 📋 System Requirements
- macOS 10.15 (Catalina) or later
- Internet connection (for first-time setup)
- 4GB RAM minimum
- 5GB free disk space

No manual installation required!
```

## 🔐 Code Signing (Optional)

To avoid "unidentified developer" warnings:

```bash
# Sign the .app
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name" \
  --options runtime \
  --timestamp \
  ./build/AIPrivateSearch.app

# Sign the .pkg
productsign \
  --sign "Developer ID Installer: Your Name" \
  AIPrivateSearch-1.0.0.pkg \
  AIPrivateSearch-1.0.0-signed.pkg

# Notarize and staple
xcrun notarytool submit AIPrivateSearch-1.0.0-signed.pkg --wait
xcrun stapler staple AIPrivateSearch-1.0.0-signed.pkg
```

See `CODE-SIGNING-GUIDE.md` for details.

## ❓ FAQ

**Q: What if Node.js is already installed?**
A: The installer detects it and skips that step.

**Q: What if user doesn't have internet?**
A: Installation will fail with clear error message.

**Q: Can I customize what gets installed?**
A: Yes! Edit `build-app-auto-install.sh` and modify the launcher script.

**Q: Where does it download code from?**
A: https://github.com/brucetroutman-gmail/AIPrivateSearch-master/archive/refs/heads/main.zip

**Q: Can I change the database credentials?**
A: Yes! Edit the .env-aips section in `build-app-auto-install.sh`.

**Q: What if installation fails?**
A: Check `/Users/Shared/AIPrivateSearch/logs/install.log` for details.

## 🎉 That's It!

You now have a one-click installer that does everything automatically!

**Build Command:**
```bash
./build-auto-install.sh
```

**Distribute:**
- Upload to GitHub Releases
- Share on your website
- Email to users

Users just download, install, and launch. Everything else is automatic! 🚀
