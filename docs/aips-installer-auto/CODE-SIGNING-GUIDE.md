# Code Signing and Notarization Guide for AIPrivateSearch

## Overview
To distribute your app outside the Mac App Store, you need to:
1. Join the Apple Developer Program ($99/year)
2. Code sign your application
3. Notarize with Apple
4. Staple the notarization ticket

This prevents "App from unidentified developer" warnings.

## Prerequisites

### 1. Apple Developer Account
- Enroll at: https://developer.apple.com/programs/
- Cost: $99/year
- Processing time: 1-2 days

### 2. Developer Certificates
You need two certificates:
- **Developer ID Application** - for signing .app bundles
- **Developer ID Installer** - for signing .pkg files

Get them from: https://developer.apple.com/account/resources/certificates

## Code Signing Process

### Sign the .app Bundle

```bash
# Sign all frameworks and libraries first
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name (TEAM_ID)" \
  --options runtime \
  --timestamp \
  AIPrivateSearch.app

# Verify the signature
codesign --verify --deep --strict --verbose=2 AIPrivateSearch.app

# Check what's signed
codesign -dvvv AIPrivateSearch.app
```

### Sign the .pkg Installer

```bash
# Sign the package
productsign \
  --sign "Developer ID Installer: Your Name (TEAM_ID)" \
  AIPrivateSearch-1.0.0.pkg \
  AIPrivateSearch-1.0.0-signed.pkg

# Verify
pkgutil --check-signature AIPrivateSearch-1.0.0-signed.pkg
```

### Sign the .dmg

```bash
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name (TEAM_ID)" \
  AIPrivateSearch-1.0.0.dmg

# Verify
codesign --verify --verbose AIPrivateSearch-1.0.0.dmg
```

## Notarization Process

### 1. Create App-Specific Password
1. Go to: https://appleid.apple.com/
2. Sign in with your Apple ID
3. Security > App-Specific Passwords
4. Generate new password
5. Save it securely

### 2. Store Credentials in Keychain

```bash
# Store your Apple ID credentials
xcrun notarytool store-credentials "AIPrivateSearch-Notary" \
  --apple-id "your-apple-id@email.com" \
  --team-id "YOUR_TEAM_ID" \
  --password "app-specific-password"
```

### 3. Submit for Notarization

For .app (zip it first):
```bash
# Create zip
ditto -c -k --keepParent AIPrivateSearch.app AIPrivateSearch.zip

# Submit
xcrun notarytool submit AIPrivateSearch.zip \
  --keychain-profile "AIPrivateSearch-Notary" \
  --wait

# Get submission ID from output for status checking
```

For .pkg:
```bash
xcrun notarytool submit AIPrivateSearch-1.0.0-signed.pkg \
  --keychain-profile "AIPrivateSearch-Notary" \
  --wait
```

For .dmg:
```bash
xcrun notarytool submit AIPrivateSearch-1.0.0.dmg \
  --keychain-profile "AIPrivateSearch-Notary" \
  --wait
```

### 4. Check Notarization Status

```bash
# If you didn't use --wait
xcrun notarytool info SUBMISSION_ID \
  --keychain-profile "AIPrivateSearch-Notary"

# Get detailed log if it failed
xcrun notarytool log SUBMISSION_ID \
  --keychain-profile "AIPrivateSearch-Notary"
```

### 5. Staple the Notarization Ticket

After successful notarization:

For .app:
```bash
xcrun stapler staple AIPrivateSearch.app

# Verify
xcrun stapler validate AIPrivateSearch.app
```

For .pkg:
```bash
xcrun stapler staple AIPrivateSearch-1.0.0-signed.pkg

# Verify
xcrun stapler validate AIPrivateSearch-1.0.0-signed.pkg
```

For .dmg:
```bash
xcrun stapler staple AIPrivateSearch-1.0.0.dmg

# Verify
xcrun stapler validate AIPrivateSearch-1.0.0.dmg
```

## Complete Workflow Script

Create `sign-and-notarize.sh`:

```bash
#!/bin/bash

set -e

APP_NAME="AIPrivateSearch"
VERSION="1.0.0"
DEVELOPER_ID_APP="Developer ID Application: Your Name (TEAM_ID)"
DEVELOPER_ID_INSTALLER="Developer ID Installer: Your Name (TEAM_ID)"
KEYCHAIN_PROFILE="AIPrivateSearch-Notary"

echo "🔐 Signing and Notarizing $APP_NAME"
echo "===================================="

# 1. Sign the .app
echo "📝 Signing .app bundle..."
codesign --deep --force --verify --verbose \
  --sign "$DEVELOPER_ID_APP" \
  --options runtime \
  --timestamp \
  "$APP_NAME.app"

# 2. Create and sign DMG
echo "💿 Creating DMG..."
./build-dmg.sh

echo "📝 Signing DMG..."
codesign --deep --force --verify --verbose \
  --sign "$DEVELOPER_ID_APP" \
  "$APP_NAME-$VERSION.dmg"

# 3. Sign PKG
echo "📦 Signing PKG..."
productsign \
  --sign "$DEVELOPER_ID_INSTALLER" \
  "$APP_NAME-$VERSION.pkg" \
  "$APP_NAME-$VERSION-signed.pkg"

# 4. Notarize DMG
echo "☁️  Submitting DMG for notarization..."
xcrun notarytool submit "$APP_NAME-$VERSION.dmg" \
  --keychain-profile "$KEYCHAIN_PROFILE" \
  --wait

echo "📌 Stapling DMG..."
xcrun stapler staple "$APP_NAME-$VERSION.dmg"

# 5. Notarize PKG
echo "☁️  Submitting PKG for notarization..."
xcrun notarytool submit "$APP_NAME-$VERSION-signed.pkg" \
  --keychain-profile "$KEYCHAIN_PROFILE" \
  --wait

echo "📌 Stapling PKG..."
xcrun stapler staple "$APP_NAME-$VERSION-signed.pkg"

# 6. Verify everything
echo "✅ Verifying signatures..."
codesign --verify --deep --strict --verbose=2 "$APP_NAME.app"
xcrun stapler validate "$APP_NAME-$VERSION.dmg"
xcrun stapler validate "$APP_NAME-$VERSION-signed.pkg"

echo ""
echo "✅ All done! Your app is signed and notarized."
echo "📦 Distribute: $APP_NAME-$VERSION.dmg"
echo "📦 Distribute: $APP_NAME-$VERSION-signed.pkg"
```

## Common Issues and Solutions

### Issue: "resource fork, Finder information, or similar detritus not allowed"
Solution: Clean the app before signing
```bash
xattr -cr AIPrivateSearch.app
```

### Issue: Notarization fails with "The binary is not signed"
Solution: Make sure ALL executables in the bundle are signed
```bash
# Find all executables
find AIPrivateSearch.app -type f -perm +111

# Sign each one individually if needed
```

### Issue: "The signature of the binary is invalid"
Solution: Use hardened runtime
```bash
codesign --options runtime ...
```

### Issue: Notarization pending for too long
- Usually takes 5-15 minutes
- Can take up to 1 hour during peak times
- Check status with `notarytool info`

## Entitlements File (if needed)

Some apps need an entitlements file. Create `entitlements.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.automation.apple-events</key>
    <true/>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.network.server</key>
    <true/>
</dict>
</plist>
```

Sign with entitlements:
```bash
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name" \
  --options runtime \
  --entitlements entitlements.plist \
  --timestamp \
  AIPrivateSearch.app
```

## Testing

### Test on Another Mac
1. Copy signed/notarized DMG to a different Mac
2. Double-click to mount
3. Drag to Applications
4. Right-click and select "Open" (first time only)
5. Should open without warnings

### Test Gatekeeper
```bash
# Check if Gatekeeper will allow it
spctl --assess --verbose --type execute AIPrivateSearch.app

# Should output: "accepted"
```

## Distribution Checklist

- [ ] .app bundle is signed
- [ ] .pkg installer is signed
- [ ] .dmg is signed
- [ ] All files are notarized
- [ ] Notarization tickets are stapled
- [ ] Tested on clean macOS system
- [ ] No Gatekeeper warnings
- [ ] All prerequisites documented
- [ ] README included
- [ ] Support links working

## Resources

- Apple Developer Documentation: https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution
- Code Signing Guide: https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/
- Notarization Tool: `man notarytool`
- Troubleshooting: https://developer.apple.com/forums/tags/notarization
