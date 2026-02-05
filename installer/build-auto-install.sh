#!/bin/bash

# Quick Build Script - Auto-Install Version
# Builds everything with automatic prerequisite installation

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 AIPrivateSearch Auto-Install Builder${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}This version automatically installs:${NC}"
echo "  • Node.js (if needed)"
echo "  • Downloads latest code from GitHub"
echo "  • Configures and starts application"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

echo ""
echo -e "${BLUE}Step 1/3: Building .app bundle...${NC}"
chmod +x build-app-auto-install.sh
./build-app-auto-install.sh

echo ""
echo -e "${BLUE}Step 2/3: Building .pkg installer...${NC}"
chmod +x build-pkg-auto-install.sh
./build-pkg-auto-install.sh

echo ""
echo -e "${BLUE}Step 3/3: Building .dmg disk image...${NC}"
chmod +x build-dmg.sh
./build-dmg.sh

echo ""
echo -e "${GREEN}✅ Build Complete!${NC}"
echo ""
echo "Your distribution files:"
echo "────────────────────────────────"

if [ -f "aiprivatesearch-installer.pkg" ]; then
    SIZE=$(du -sh "aiprivatesearch-installer.pkg" | awk '{print $1}')
    echo -e "${GREEN}✓${NC} aiprivatesearch-installer.pkg ($SIZE)"
fi

if [ -f "aiprivatesearch-installer.dmg" ]; then
    SIZE=$(du -sh "aiprivatesearch-installer.dmg" | awk '{print $1}')
    echo -e "${GREEN}✓${NC} aiprivatesearch-installer.dmg ($SIZE)"
    
    # Copy DMG to marketing website downloads
    MARKETING_DOWNLOADS="/Users/Shared/AIPrivateSearch/repo/aiprivatesearchweb/client/c01_client-marketing/downloads"
    if [ -d "$MARKETING_DOWNLOADS" ]; then
        echo ""
        echo "📋 Copying DMG to marketing website..."
        cp "aiprivatesearch-installer.dmg" "$MARKETING_DOWNLOADS/"
        echo -e "${GREEN}✓${NC} DMG copied to: $MARKETING_DOWNLOADS"
    else
        echo ""
        echo -e "${YELLOW}⚠️  Marketing downloads directory not found:${NC}"
        echo "   $MARKETING_DOWNLOADS"
        echo "   DMG not copied to marketing site"
    fi
fi

echo ""
echo "📖 User Experience:"
echo "────────────────────────────────"
echo "1. User downloads .pkg or .dmg"
echo "2. User installs/drags to Applications"
echo "3. User launches AIPrivateSearch"
echo "4. App automatically:"
echo "   → Installs Node.js (if needed)"
echo "   → Downloads latest code"
echo "   → Configures everything"
echo "   → Opens in browser"
echo ""
echo "⏱️  First launch: 2-5 minutes (automatic)"
echo "⏱️  Subsequent launches: ~5 seconds"
echo ""
echo -e "${GREEN}Ready to distribute!${NC}"
echo ""
