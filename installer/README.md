# AIPrivateSearch macOS Distribution System

Complete solution for distributing AIPrivateSearch as a professional macOS application.

## Overview

This package includes everything needed to create professional macOS installers:

- **.app Bundle** - Standard macOS application
- **.pkg Installer** - Professional installer package  
- **.dmg Disk Image** - Drag-to-install disk image
- **Code Signing & Notarization** - Scripts and guides for Apple distribution

## Quick Start

### Prerequisites

1. **macOS** (10.15 or later)
2. **Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```

### Build Everything

```bash
# Make scripts executable
chmod +x *.sh

# Build all formats
./build-all.sh
```

Or build individually:
```bash
./build-app.sh    # Creates .app bundle
./build-pkg.sh    # Creates .pkg installer
./build-dmg.sh    # Creates .dmg disk image
```

## File Structure

```
aiprivatesearch-installer/
├── build-app.sh              # Creates .app bundle
├── build-pkg.sh              # Creates .pkg installer
├── build-dmg.sh              # Creates .dmg disk image
├── build-all.sh              # Builds everything
├── CODE-SIGNING-GUIDE.md     # Complete signing/notarization guide
├── README.md                 # This file
└── integrate-source.sh       # Helper to integrate your source code
```

After building:
```
aiprivatesearch-installer/
├── build/
│   └── AIPrivateSearch.app   # Application bundle
├── build-pkg/                # PKG build artifacts
├── build-dmg/                # DMG build artifacts
├── AIPrivateSearch-1.0.0.pkg # Final installer
└── AIPrivateSearch-1.0.0.dmg # Final disk image
```

## Integration with Your Source Code

### Method 1: Manual Integration

1. Build the app structure:
   ```bash
   ./build-app.sh
   ```

2. Copy your application files:
   ```bash
   # Copy your server and client code
   cp -R /path/to/your/aiprivatesearch/* \
     ./build/AIPrivateSearch.app/Contents/Resources/app/
   ```

3. Copy sample documents:
   ```bash
   cp -R /path/to/your/sources/local-documents \
     ./build/AIPrivateSearch.app/Contents/Resources/samples/
   ```

### Method 2: Automated Integration

Create `integrate-source.sh`:

```bash
#!/bin/bash

SOURCE_DIR="/path/to/your/aiprivatesearch/repo"
APP_RESOURCES="./build/AIPrivateSearch.app/Contents/Resources"

# Build app structure first
./build-app.sh

# Copy application files
echo "Copying application files..."
cp -R "$SOURCE_DIR"/* "$APP_RESOURCES/app/"

# Copy samples
if [ -d "$SOURCE_DIR/sources/local-documents" ]; then
    mkdir -p "$APP_RESOURCES/samples"
    cp -R "$SOURCE_DIR/sources/local-documents" "$APP_RESOURCES/samples/"
fi

# Copy config templates
if [ -d "$SOURCE_DIR/client/c01_client-first-app/config" ]; then
    cp -R "$SOURCE_DIR/client/c01_client-first-app/config" "$APP_RESOURCES/config-templates/"
fi

echo "✅ Integration complete!"
```

## Distribution Formats Explained

### .app Bundle (Recommended for GitHub)

**Best for:**
- Open source projects
- Developer distribution
- Advanced users
- GitHub releases

**Installation:**
1. Download AIPrivateSearch.app.zip
2. Unzip
3. Drag to Applications folder
4. Launch

**Pros:**
- Familiar to Mac users
- No installer needed
- Easy to update

**Cons:**
- No automated prerequisite checking
- User must manually check Node.js/Ollama

### .pkg Installer (Recommended for General Users)

**Best for:**
- General public
- Enterprise deployment
- Automated installation
- First-time users

**Installation:**
1. Download AIPrivateSearch-1.0.0.pkg
2. Double-click
3. Follow installer wizard
4. Launch from Applications

**Pros:**
- Professional appearance
- Checks prerequisites
- Guided installation
- Can run scripts (setup, permissions)

**Cons:**
- Requires Apple Developer ID to sign
- More complex to build

### .dmg Disk Image (Recommended for Website Distribution)

**Best for:**
- Website downloads
- Professional distribution
- Traditional Mac software
- Users expecting drag-to-install

**Installation:**
1. Download AIPrivateSearch-1.0.0.dmg
2. Double-click to mount
3. Drag app to Applications folder
4. Eject disk image
5. Launch from Applications

**Pros:**
- Professional, polished experience
- Visual drag-to-install interface
- Can include README and extras
- Smaller download (compressed)

**Cons:**
- Requires macOS to create
- Extra step (mounting) for users

## What Gets Installed

### User Locations

```
~/Library/Application Support/AIPrivateSearch/
├── app/                      # Application files (server, client)
├── logs/                     # Application logs
│   └── app.log
├── data/                     # User data
│   ├── users.json
│   └── sessions.json
├── sources/                  # User documents
│   └── local-documents/
└── config/                   # Configuration backups

~/.config/aiprivatesearch/
├── .env                      # Environment configuration
└── setup-complete            # First-run flag
```

### System Locations

```
/Applications/
└── AIPrivateSearch.app       # The application
```

## Testing Your Build

### 1. Test the .app Bundle

```bash
# Open the app
open ./build/AIPrivateSearch.app

# Check if it launches properly
# Verify prerequisite checking works
# Test configuration wizard
```

### 2. Test the .pkg Installer

```bash
# Install the package
open ./AIPrivateSearch-1.0.0.pkg

# Verify installation
ls -la /Applications/AIPrivateSearch.app
ls -la ~/Library/Application\ Support/AIPrivateSearch/
```

### 3. Test the .dmg

```bash
# Mount the DMG
open ./AIPrivateSearch-1.0.0.dmg

# Verify the interface
# Drag app to Applications
# Test the installed app
```

### 4. Test Uninstallation

```bash
# Run uninstall script
bash /Applications/AIPrivateSearch.app/Contents/Resources/Uninstall.sh

# Verify cleanup
ls ~/Library/Application\ Support/ | grep AIPrivateSearch
ls ~/.config/ | grep aiprivatesearch
```

## Code Signing and Notarization

### Why Sign and Notarize?

Without signing and notarization, users will see:
> "AIPrivateSearch.app can't be opened because it is from an unidentified developer"

### Requirements

1. **Apple Developer Account** ($99/year)
   - Enroll at: https://developer.apple.com/programs/

2. **Developer Certificates**
   - Developer ID Application (for .app and .dmg)
   - Developer ID Installer (for .pkg)

### Complete Guide

See [CODE-SIGNING-GUIDE.md](CODE-SIGNING-GUIDE.md) for detailed instructions.

### Quick Signing Commands

```bash
# Sign .app
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name" \
  --options runtime \
  --timestamp \
  AIPrivateSearch.app

# Sign .pkg
productsign \
  --sign "Developer ID Installer: Your Name" \
  AIPrivateSearch-1.0.0.pkg \
  AIPrivateSearch-1.0.0-signed.pkg

# Notarize and staple
xcrun notarytool submit AIPrivateSearch-1.0.0.dmg \
  --keychain-profile "YourProfile" \
  --wait

xcrun stapler staple AIPrivateSearch-1.0.0.dmg
```

## Distribution Strategies

### 1. GitHub Releases (Recommended for Open Source)

**Setup:**
1. Create a new release on GitHub
2. Upload both .dmg and .pkg
3. Include SHA256 checksums
4. Write clear release notes

**Release Assets:**
```
AIPrivateSearch-1.0.0.dmg          (for most users)
AIPrivateSearch-1.0.0.dmg.sha256   (checksum)
AIPrivateSearch-1.0.0.pkg          (alternative)
AIPrivateSearch-1.0.0.pkg.sha256   (checksum)
```

**Release Notes Template:**
```markdown
## AIPrivateSearch v1.0.0

### Installation

**Easy Install (DMG):**
1. Download `AIPrivateSearch-1.0.0.dmg`
2. Open the DMG
3. Drag AIPrivateSearch to Applications
4. Launch and follow setup wizard

**Installer Package (PKG):**
1. Download `AIPrivateSearch-1.0.0.pkg`
2. Double-click and follow installer
3. Launch from Applications

### Prerequisites
- Node.js 16+ (https://nodejs.org/)
- Ollama (https://ollama.com/)

### Checksums
```
SHA256 (AIPrivateSearch-1.0.0.dmg) = abc123...
SHA256 (AIPrivateSearch-1.0.0.pkg) = def456...
```

### What's New
- Initial release
- Local AI search
- Document indexing
- Private processing
```

### 2. Self-Hosted Website

**Setup:**
1. Upload to your web server
2. Create a download page
3. Include installation instructions

**Example Download Page:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Download AIPrivateSearch</title>
</head>
<body>
    <h1>Download AIPrivateSearch for Mac</h1>
    
    <h2>Choose Your Download:</h2>
    
    <div class="download-option">
        <h3>Disk Image (.dmg) - Recommended</h3>
        <a href="AIPrivateSearch-1.0.0.dmg">
            Download AIPrivateSearch-1.0.0.dmg
        </a>
        <p>Size: 45 MB | macOS 10.15+</p>
    </div>
    
    <div class="download-option">
        <h3>Installer Package (.pkg)</h3>
        <a href="AIPrivateSearch-1.0.0.pkg">
            Download AIPrivateSearch-1.0.0.pkg
        </a>
        <p>Size: 42 MB | macOS 10.15+</p>
    </div>
    
    <h2>Installation Instructions</h2>
    <!-- Instructions here -->
    
    <h2>System Requirements</h2>
    <ul>
        <li>macOS 10.15 (Catalina) or later</li>
        <li>Node.js 16 or later</li>
        <li>Ollama for AI models</li>
        <li>4GB RAM minimum, 8GB recommended</li>
    </ul>
</body>
</html>
```

### 3. Homebrew Cask (For Advanced Users)

Create a cask definition:

```ruby
cask "aiprivatesearch" do
  version "1.0.0"
  sha256 "abc123..."

  url "https://github.com/username/aiprivatesearch/releases/download/v#{version}/AIPrivateSearch-#{version}.dmg"
  name "AIPrivateSearch"
  desc "Private AI-powered search"
  homepage "https://github.com/username/aiprivatesearch"

  depends_on formula: "node"
  depends_on cask: "ollama"

  app "AIPrivateSearch.app"

  uninstall script: {
    executable: "#{appdir}/AIPrivateSearch.app/Contents/Resources/Uninstall.sh",
    sudo: false
  }

  zap trash: [
    "~/Library/Application Support/AIPrivateSearch",
    "~/.config/aiprivatesearch"
  ]
end
```

Users install with:
```bash
brew install --cask aiprivatesearch
```

## Troubleshooting

### Build Issues

**Issue: "command not found: pkgbuild"**
```bash
# Install Xcode Command Line Tools
xcode-select --install
```

**Issue: "operation not permitted"**
```bash
# Grant Full Disk Access to Terminal
# System Preferences > Security & Privacy > Privacy > Full Disk Access
```

### Installation Issues

**Issue: "App is damaged and can't be opened"**
- App is not signed/notarized
- User should right-click > Open (first time only)
- Or sign and notarize properly

**Issue: "Node.js not found after installation"**
- User needs to install Node.js separately
- Provide clear prerequisite instructions

### Runtime Issues

**Issue: Port 3000 already in use**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
```

**Issue: Configuration file not found**
```bash
# Check if .env exists
ls -la ~/.config/aiprivatesearch/.env

# Create if missing
cp /Applications/AIPrivateSearch.app/Contents/Resources/env.template \
   ~/.config/aiprivatesearch/.env
```

## Customization

### Change App Name

Edit in all build scripts:
```bash
APP_NAME="YourAppName"
BUNDLE_ID="com.yourcompany.yourapp"
```

### Change Install Location

Edit in `build-app.sh`:
```bash
# Default location
APP_SUPPORT="$HOME/Library/Application Support/YourApp"

# For system-wide installation
APP_SUPPORT="/Library/Application Support/YourApp"
```

### Add Custom Prerequisites

Edit the launcher script in `build-app.sh`:
```bash
# Add your check
check_custom_tool() {
    if ! command -v yourtool &> /dev/null; then
        show_alert_with_action "Tool Required" \
            "This app requires YourTool..." \
            "Cancel" "Download"
    fi
}
```

### Customize DMG Appearance

1. Create background image (600x400px or 1200x800px for Retina)
2. Save as `.background/background.png`
3. Edit icon positions in `build-dmg.sh`

## Best Practices

### 1. Version Control

```bash
# Use semantic versioning
VERSION="1.0.0"  # Major.Minor.Patch

# Tag releases
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### 2. Checksums

```bash
# Generate checksums
shasum -a 256 AIPrivateSearch-1.0.0.dmg > AIPrivateSearch-1.0.0.dmg.sha256
shasum -a 256 AIPrivateSearch-1.0.0.pkg > AIPrivateSearch-1.0.0.pkg.sha256

# Users verify with:
shasum -a 256 -c AIPrivateSearch-1.0.0.dmg.sha256
```

### 3. Release Notes

Always include:
- What's new/changed
- Known issues
- Installation instructions
- Prerequisites
- Support/contact info

### 4. Testing

Test on:
- Clean macOS installation (VM recommended)
- Different macOS versions (10.15, 11, 12, 13, 14)
- Both Intel and Apple Silicon Macs
- Without prerequisites installed

## Support

### For Build Issues
1. Check macOS version (10.15+)
2. Verify Xcode Command Line Tools installed
3. Check error messages in build logs
4. Ensure proper permissions

### For Distribution Issues
1. Review CODE-SIGNING-GUIDE.md
2. Verify Developer ID certificates
3. Check notarization status
4. Test on clean system

## License

[Your License Here]

## Credits

AIPrivateSearch Distribution System
Created for professional macOS application deployment

---

**Ready to distribute your app professionally! 🚀**
