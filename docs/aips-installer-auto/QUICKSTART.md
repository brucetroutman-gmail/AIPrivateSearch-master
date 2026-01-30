# AIPrivateSearch - Quick Start Guide

## 🚀 From Source Code to Distributable App in 5 Steps

### Step 1: Prepare Your Mac
```bash
# Install Xcode Command Line Tools (if not already installed)
xcode-select --install

# Verify installation
pkgbuild --version
```

### Step 2: Get the Build System
```bash
# Download or clone this repository
cd aiprivatesearch-installer

# Make all scripts executable
chmod +x *.sh
```

### Step 3: Build the App Structure
```bash
# Create the .app bundle structure
./build-app.sh
```

This creates: `./build/AIPrivateSearch.app`

### Step 4: Integrate Your Source Code
```bash
# Run the integration script
./integrate-source.sh

# Choose option:
# 1 - Clone from GitHub (enter your repo URL)
# 2 - Use local directory (enter path to your code)
# 3 - Download from URL (enter zip file URL)
```

This copies your application files into the .app bundle.

### Step 5: Create Distributables
```bash
# Build everything (PKG + DMG)
./build-all.sh

# Or build individually:
./build-pkg.sh    # Creates installer package
./build-dmg.sh    # Creates disk image
```

**You're done!** You now have:
- `AIPrivateSearch-1.0.0.pkg` - Installer package
- `AIPrivateSearch-1.0.0.dmg` - Disk image for distribution

---

## 📦 What You Get

### For End Users (via DMG)
1. Download `AIPrivateSearch-1.0.0.dmg`
2. Double-click to mount
3. Drag app to Applications folder
4. Launch AIPrivateSearch
5. Follow setup wizard

### For End Users (via PKG)
1. Download `AIPrivateSearch-1.0.0.pkg`
2. Double-click
3. Follow installer
4. Launch from Applications

---

## ⚙️ Customization

### Change App Name & Info
Edit at the top of each build script:
```bash
APP_NAME="YourAppName"
VERSION="1.0.0"
BUNDLE_ID="com.yourcompany.yourapp"
```

### Change Default Admin Credentials
Edit in `build-app.sh` or `integrate-source.sh`:
```bash
DEFAULT_ADMIN_EMAIL=your@email.com
DEFAULT_ADMIN_PASSWORD=secure-password
```

### Remove Database Configuration
If you don't need remote database:
1. Edit the environment template in build scripts
2. Remove DB_* variables
3. Update your app to work without them

---

## 🔐 Distribution (Optional but Recommended)

### Without Signing (Testing Only)
Users will see "unidentified developer" warning.
They can bypass by: Right-click > Open (first time only)

### With Signing (Professional Distribution)
1. **Join Apple Developer Program** ($99/year)
   - https://developer.apple.com/programs/

2. **Get Certificates**
   - Developer ID Application
   - Developer ID Installer

3. **Sign and Notarize**
   ```bash
   # See CODE-SIGNING-GUIDE.md for complete instructions
   
   # Quick commands:
   codesign --sign "Developer ID Application: Your Name" AIPrivateSearch.app
   xcrun notarytool submit AIPrivateSearch-1.0.0.dmg --wait
   xcrun stapler staple AIPrivateSearch-1.0.0.dmg
   ```

---

## 🧪 Testing Checklist

Before distributing, test on a clean Mac:

- [ ] Install from .pkg works
- [ ] Install from .dmg works
- [ ] App launches without errors
- [ ] Prerequisite checking works (Node.js, Ollama)
- [ ] Configuration wizard appears on first run
- [ ] Application functions correctly
- [ ] No permission errors
- [ ] Uninstall script works

---

## 📤 Distribution Options

### GitHub Releases (Recommended for Open Source)
```bash
# 1. Create release on GitHub
# 2. Upload files:
#    - AIPrivateSearch-1.0.0.dmg
#    - AIPrivateSearch-1.0.0.pkg
#    - Checksums
```

### Your Own Website
```bash
# Upload to your web server
scp AIPrivateSearch-1.0.0.dmg user@server:/var/www/downloads/
scp AIPrivateSearch-1.0.0.pkg user@server:/var/www/downloads/
```

### Direct Link
Share the direct download link:
```
https://yoursite.com/downloads/AIPrivateSearch-1.0.0.dmg
https://yoursite.com/downloads/AIPrivateSearch-1.0.0.pkg
```

---

## 🐛 Troubleshooting

### "App is damaged and can't be opened"
**Cause:** App is not signed
**Fix:** Either sign the app, or tell users to right-click > Open

### "command not found: pkgbuild"
**Cause:** Xcode Command Line Tools not installed
**Fix:** `xcode-select --install`

### "Operation not permitted"
**Cause:** macOS security restrictions
**Fix:** Grant Full Disk Access to Terminal in System Preferences

### Port 3000 already in use
**Cause:** Another process using the port
**Fix:** 
```bash
lsof -ti:3000 | xargs kill -9
```

### Configuration file not found
**Cause:** .env not created properly
**Fix:** Check `~/.config/aiprivatesearch/.env` exists

---

## 📚 Additional Resources

- **Complete Documentation:** See README.md
- **Code Signing Guide:** See CODE-SIGNING-GUIDE.md
- **Build Scripts:** Review individual .sh files for details

---

## 💡 Pro Tips

1. **Version Everything**
   - Update VERSION in all scripts
   - Tag releases in git
   - Keep changelog

2. **Test on Clean System**
   - Use a VM or different Mac
   - Test without prerequisites installed
   - Verify user experience

3. **Generate Checksums**
   ```bash
   shasum -a 256 *.dmg > checksums.txt
   shasum -a 256 *.pkg >> checksums.txt
   ```

4. **Keep Builds Reproducible**
   - Document exact versions used
   - Use same macOS version for building
   - Keep build scripts in version control

5. **Provide Good Support**
   - Create detailed README
   - Include troubleshooting section
   - Provide support channel (GitHub issues, email, etc.)

---

## ✅ Success!

You now have a professional macOS installer system!

**Need help?** Check the detailed guides:
- README.md - Complete documentation
- CODE-SIGNING-GUIDE.md - Signing and notarization

**Ready to distribute?** Your files are:
- `AIPrivateSearch-1.0.0.dmg` - For website/GitHub
- `AIPrivateSearch-1.0.0.pkg` - For automated installation

Good luck with your app! 🎉
