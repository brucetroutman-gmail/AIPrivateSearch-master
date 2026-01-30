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
echo "  • Node.js"
echo "  • Ollama"
echo "  • Chrome"
echo "  • Downloads latest code from GitHub"
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

if [ -f "AIPrivateSearch-1.0.0.pkg" ]; then
    SIZE=$(du -sh "AIPrivateSearch-1.0.0.pkg" | awk '{print $1}')
    echo -e "${GREEN}✓${NC} AIPrivateSearch-1.0.0.pkg ($SIZE)"
fi

if [ -f "AIPrivateSearch-1.0.0.dmg" ]; then
    SIZE=$(du -sh "AIPrivateSearch-1.0.0.dmg" | awk '{print $1}')
    echo -e "${GREEN}✓${NC} AIPrivateSearch-1.0.0.dmg ($SIZE)"
fi

echo ""
echo "📖 User Experience:"
echo "────────────────────────────────"
echo "1. User downloads .pkg or .dmg"
echo "2. User installs/drags to Applications"
echo "3. User launches AIPrivateSearch"
echo "4. App automatically:"
echo "   → Installs Node.js (if needed)"
echo "   → Installs Ollama (if needed)"
echo "   → Installs Chrome (if needed)"
echo "   → Downloads latest code"
echo "   → Configures everything"
echo "   → Opens in browser"
echo ""
echo "⏱️  First launch: 5-15 minutes (automatic)"
echo "⏱️  Subsequent launches: ~5 seconds"
echo ""
echo -e "${GREEN}Ready to distribute!${NC}"
echo ""
