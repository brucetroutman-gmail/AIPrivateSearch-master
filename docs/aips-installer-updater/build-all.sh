#!/bin/bash

# AIPrivateSearch Complete Build Script
# Builds everything: .app, .pkg, and .dmg

set -e

echo "🏗️  AIPrivateSearch Complete Build System"
echo "=========================================="
echo ""

# Configuration
APP_NAME="AIPrivateSearch"
VERSION="1.0.0"
BUILD_ALL=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_step() {
    echo ""
    echo "═══════════════════════════════════════"
    echo "  $1"
    echo "═══════════════════════════════════════"
}

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script must be run on macOS"
    exit 1
fi

# Menu
echo "What would you like to build?"
echo "1) .app bundle only"
echo "2) .pkg installer only"
echo "3) .dmg disk image only"
echo "4) Everything (.app + .pkg + .dmg)"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        BUILD_APP=true
        BUILD_PKG=false
        BUILD_DMG=false
        ;;
    2)
        BUILD_APP=false
        BUILD_PKG=true
        BUILD_DMG=false
        ;;
    3)
        BUILD_APP=false
        BUILD_PKG=false
        BUILD_DMG=true
        ;;
    4)
        BUILD_APP=true
        BUILD_PKG=true
        BUILD_DMG=true
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Build .app
if [ "$BUILD_APP" = true ]; then
    print_step "Building .app Bundle"
    
    if [ -f "./build-app.sh" ]; then
        chmod +x ./build-app.sh
        ./build-app.sh
        
        if [ -d "./build/$APP_NAME.app" ]; then
            print_success ".app bundle created"
        else
            print_error ".app bundle creation failed"
            exit 1
        fi
    else
        print_error "build-app.sh not found"
        exit 1
    fi
fi

# Build .pkg
if [ "$BUILD_PKG" = true ]; then
    print_step "Building .pkg Installer"
    
    # Check if .app exists
    if [ ! -d "./build/$APP_NAME.app" ]; then
        print_error ".app bundle not found. Build it first."
        exit 1
    fi
    
    if [ -f "./build-pkg.sh" ]; then
        chmod +x ./build-pkg.sh
        ./build-pkg.sh
        
        if [ -f "./$APP_NAME-$VERSION.pkg" ]; then
            print_success ".pkg installer created"
        else
            print_error ".pkg installer creation failed"
            exit 1
        fi
    else
        print_error "build-pkg.sh not found"
        exit 1
    fi
fi

# Build .dmg
if [ "$BUILD_DMG" = true ]; then
    print_step "Building .dmg Disk Image"
    
    # Check if .app exists
    if [ ! -d "./build/$APP_NAME.app" ]; then
        print_error ".app bundle not found. Build it first."
        exit 1
    fi
    
    if [ -f "./build-dmg.sh" ]; then
        chmod +x ./build-dmg.sh
        ./build-dmg.sh
        
        if [ -f "./$APP_NAME-$VERSION.dmg" ]; then
            print_success ".dmg disk image created"
        else
            print_error ".dmg disk image creation failed"
            exit 1
        fi
    else
        print_error "build-dmg.sh not found"
        exit 1
    fi
fi

# Summary
print_step "Build Summary"

echo ""
echo "Build artifacts:"
echo "───────────────────────────────────────"

if [ -d "./build/$APP_NAME.app" ]; then
    SIZE=$(du -sh "./build/$APP_NAME.app" | awk '{print $1}')
    print_success ".app bundle: ./build/$APP_NAME.app ($SIZE)"
fi

if [ -f "./$APP_NAME-$VERSION.pkg" ]; then
    SIZE=$(du -sh "./$APP_NAME-$VERSION.pkg" | awk '{print $1}')
    print_success ".pkg installer: ./$APP_NAME-$VERSION.pkg ($SIZE)"
fi

if [ -f "./$APP_NAME-$VERSION.dmg" ]; then
    SIZE=$(du -sh "./$APP_NAME-$VERSION.dmg" | awk '{print $1}')
    print_success ".dmg disk image: ./$APP_NAME-$VERSION.dmg ($SIZE)"
fi

echo ""
echo "Next steps:"
echo "───────────────────────────────────────"
echo "1. Add your application files to:"
echo "   ./build/$APP_NAME.app/Contents/Resources/app/"
echo ""
echo "2. Create a proper app icon (AppIcon.icns)"
echo ""
echo "3. Test the application:"
echo "   - Test .app: open ./build/$APP_NAME.app"
echo "   - Test .pkg: open ./$APP_NAME-$VERSION.pkg"
echo "   - Test .dmg: open ./$APP_NAME-$VERSION.dmg"
echo ""
echo "4. For distribution, sign and notarize:"
echo "   See CODE-SIGNING-GUIDE.md for details"
echo ""
echo "5. Distribute to users via:"
echo "   - Direct download (.dmg or .pkg)"
echo "   - GitHub Releases"
echo "   - Your own website"
echo ""

print_success "Build complete!"
