#!/bin/bash

# AIPrivateSearch Master Setup and Build Script
# This is the main entry point for building your macOS installer

set -e

VERSION="1.0.0"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ASCII Art Banner
cat << "EOF"
   ___    ____  ____       _            __       
  / _ |  /  _/ / __ \____(_)  _____ _ / /______ 
 / __ | _/ /  / /_/ / __/ / |/ / _ `// __/ -_) 
/_/ |_|/___/ / .___/_/ /_/|___/\_,_/ \__/\__/  
            /_/                                  
   ____            __       ____         __   __    __       
  / __/__ _____   / /___   / _  \__ __  / /  / /___/ /__ ____
 _\ \ / -_) __/  / __/ /  / // / // / / /  / // _ /  '_// __/
/___/ \__/_/    /_/ /_/  /____/\_,_/ /_/__/_/ \_,_/_/\_\/_/   
                                                               
EOF

echo -e "${CYAN}macOS Installer Builder - Version $VERSION${NC}"
echo "=============================================="
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ Error: This script must be run on macOS${NC}"
    exit 1
fi

# Check for Xcode Command Line Tools
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
if ! command -v pkgbuild &> /dev/null; then
    echo -e "${YELLOW}⚠️  Xcode Command Line Tools not found${NC}"
    echo ""
    read -p "Would you like to install them now? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Installing Xcode Command Line Tools..."
        xcode-select --install
        echo ""
        echo "Please complete the installation and run this script again."
        exit 0
    else
        echo -e "${RED}❌ Xcode Command Line Tools are required${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"
echo ""

# Main Menu
while true; do
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}  AIPrivateSearch Build System${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""
    echo "What would you like to do?"
    echo ""
    echo "  ${GREEN}Build Options:${NC}"
    echo "  1) Quick Start - Build everything"
    echo "  2) Build .app bundle only"
    echo "  3) Build .pkg installer only"
    echo "  4) Build .dmg disk image only"
    echo "  5) Build all formats (.app + .pkg + .dmg)"
    echo ""
    echo "  ${BLUE}Setup Options:${NC}"
    echo "  6) Integrate source code"
    echo "  7) Clean all builds"
    echo ""
    echo "  ${YELLOW}Help & Info:${NC}"
    echo "  8) View documentation"
    echo "  9) View distribution comparison"
    echo "  10) View code signing guide"
    echo ""
    echo "  11) Exit"
    echo ""
    read -p "Enter your choice (1-11): " choice
    echo ""
    
    case $choice in
        1)
            echo -e "${CYAN}🚀 Quick Start - Building Everything${NC}"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            
            # Build .app
            echo -e "${BLUE}Step 1/4: Building .app bundle...${NC}"
            ./build-app.sh
            echo ""
            
            # Integrate source
            echo -e "${BLUE}Step 2/4: Integrating source code...${NC}"
            echo "You'll need to provide your source code location."
            echo ""
            ./integrate-source.sh
            echo ""
            
            # Build .pkg
            echo -e "${BLUE}Step 3/4: Building .pkg installer...${NC}"
            ./build-pkg.sh
            echo ""
            
            # Build .dmg
            echo -e "${BLUE}Step 4/4: Building .dmg disk image...${NC}"
            ./build-dmg.sh
            echo ""
            
            echo -e "${GREEN}✅ Quick Start Complete!${NC}"
            echo ""
            echo "Your distributable files:"
            if [ -f "AIPrivateSearch-$VERSION.pkg" ]; then
                SIZE=$(du -sh "AIPrivateSearch-$VERSION.pkg" | awk '{print $1}')
                echo -e "  ${GREEN}✓${NC} AIPrivateSearch-$VERSION.pkg ($SIZE)"
            fi
            if [ -f "AIPrivateSearch-$VERSION.dmg" ]; then
                SIZE=$(du -sh "AIPrivateSearch-$VERSION.dmg" | awk '{print $1}')
                echo -e "  ${GREEN}✓${NC} AIPrivateSearch-$VERSION.dmg ($SIZE)"
            fi
            echo ""
            read -p "Press Enter to continue..."
            ;;
            
        2)
            ./build-app.sh
            read -p "Press Enter to continue..."
            ;;
            
        3)
            if [ ! -d "./build/AIPrivateSearch.app" ]; then
                echo -e "${RED}❌ Error: .app bundle not found${NC}"
                echo "Please build the .app bundle first (option 2)"
                read -p "Press Enter to continue..."
            else
                ./build-pkg.sh
                read -p "Press Enter to continue..."
            fi
            ;;
            
        4)
            if [ ! -d "./build/AIPrivateSearch.app" ]; then
                echo -e "${RED}❌ Error: .app bundle not found${NC}"
                echo "Please build the .app bundle first (option 2)"
                read -p "Press Enter to continue..."
            else
                ./build-dmg.sh
                read -p "Press Enter to continue..."
            fi
            ;;
            
        5)
            ./build-all.sh
            read -p "Press Enter to continue..."
            ;;
            
        6)
            if [ ! -d "./build/AIPrivateSearch.app" ]; then
                echo -e "${YELLOW}⚠️  .app bundle not found${NC}"
                echo "Building .app bundle first..."
                ./build-app.sh
                echo ""
            fi
            ./integrate-source.sh
            read -p "Press Enter to continue..."
            ;;
            
        7)
            echo -e "${YELLOW}🗑️  Cleaning all builds...${NC}"
            echo ""
            read -p "Are you sure? This will delete all build artifacts. (y/n): " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rm -rf ./build ./build-pkg ./build-dmg
                rm -f AIPrivateSearch-*.pkg AIPrivateSearch-*.dmg
                echo -e "${GREEN}✅ Clean complete${NC}"
            else
                echo "Cancelled."
            fi
            echo ""
            read -p "Press Enter to continue..."
            ;;
            
        8)
            clear
            if command -v less &> /dev/null; then
                less README.md
            else
                cat README.md
            fi
            ;;
            
        9)
            clear
            if command -v less &> /dev/null; then
                less COMPARISON.md
            else
                cat COMPARISON.md
            fi
            ;;
            
        10)
            clear
            if command -v less &> /dev/null; then
                less CODE-SIGNING-GUIDE.md
            else
                cat CODE-SIGNING-GUIDE.md
            fi
            ;;
            
        11)
            echo -e "${CYAN}Thanks for using AIPrivateSearch Build System!${NC}"
            echo ""
            exit 0
            ;;
            
        *)
            echo -e "${RED}❌ Invalid choice${NC}"
            echo ""
            read -p "Press Enter to continue..."
            ;;
    esac
    
    clear
done
