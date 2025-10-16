#!/bin/bash

# AIPrivateSearch Load Script v19.06
# Enhanced installer with user confirmations and better error handling

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
LOG_FILE="/tmp/aiprivatesearch-install.log"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

echo -e "${BLUE}=== AIPrivateSearch Installation Started ===${NC}"
echo "Date: $(date)"
echo "User: $(whoami)"
echo "Log file: $LOG_FILE"

# Function to prompt user for confirmation
confirm() {
    while true; do
        read -p "$1 (y/n): " yn
        case $yn in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please answer yes or no.";;
        esac
    done
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Xcode Command Line Tools
install_xcode_tools() {
    if ! command_exists git || ! command_exists make; then
        echo -e "${YELLOW}Xcode Command Line Tools are required for installation.${NC}"
        if confirm "Install Xcode Command Line Tools? This may take several minutes"; then
            echo "Installing Xcode Command Line Tools..."
            xcode-select --install 2>/dev/null || true
            echo "Please complete the Xcode Command Line Tools installation dialog and press Enter when finished."
            read -p "Press Enter to continue..."
            
            # Verify installation
            if ! command_exists git; then
                echo -e "${RED}Xcode Command Line Tools installation failed or incomplete.${NC}"
                exit 1
            fi
        else
            echo -e "${RED}Xcode Command Line Tools are required. Installation cancelled.${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✓ Xcode Command Line Tools already installed${NC}"
    fi
}

# Function to install Node.js
install_nodejs() {
    if ! command_exists node; then
        echo -e "${YELLOW}Node.js is required for AIPrivateSearch.${NC}"
        if confirm "Install Node.js?"; then
            echo "Downloading and installing Node.js..."
            curl -o node-installer.pkg "https://nodejs.org/dist/v20.11.0/node-v20.11.0.pkg"
            sudo installer -pkg node-installer.pkg -target /
            rm node-installer.pkg
            
            # Add Node.js to PATH
            export PATH="/usr/local/bin:$PATH"
            
            if ! command_exists node; then
                echo -e "${RED}Node.js installation failed.${NC}"
                exit 1
            fi
        else
            echo -e "${RED}Node.js is required. Installation cancelled.${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✓ Node.js already installed ($(node --version))${NC}"
    fi
}

# Function to install Ollama
install_ollama() {
    if ! command_exists ollama; then
        echo -e "${YELLOW}Ollama AI platform is required for AIPrivateSearch.${NC}"
        if confirm "Install Ollama?"; then
            echo "Downloading and installing Ollama..."
            curl -fsSL https://ollama.ai/install.sh | sh
            
            if ! command_exists ollama; then
                echo -e "${RED}Ollama installation failed.${NC}"
                exit 1
            fi
        else
            echo -e "${RED}Ollama is required. Installation cancelled.${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✓ Ollama already installed${NC}"
    fi
}

# Function to install Chrome
install_chrome() {
    if ! ls /Applications/Google\ Chrome.app >/dev/null 2>&1; then
        echo -e "${YELLOW}Google Chrome is recommended for the best experience.${NC}"
        if confirm "Install Google Chrome?"; then
            echo "Downloading and installing Google Chrome..."
            curl -L -o chrome.dmg "https://dl.google.com/chrome/mac/stable/GGRO/googlechrome.dmg"
            hdiutil attach chrome.dmg -quiet
            cp -R "/Volumes/Google Chrome/Google Chrome.app" /Applications/
            hdiutil detach "/Volumes/Google Chrome" -quiet
            rm chrome.dmg
        fi
    else
        echo -e "${GREEN}✓ Google Chrome already installed${NC}"
    fi
}

# Function to start Ollama service
start_ollama() {
    echo "Starting Ollama service..."
    if confirm "Start Ollama service?"; then
        ollama serve &
        OLLAMA_PID=$!
        sleep 3
        
        if ! pgrep -f "ollama serve" > /dev/null; then
            echo -e "${RED}Failed to start Ollama service${NC}"
            exit 1
        fi
        echo -e "${GREEN}✓ Ollama service started${NC}"
    fi
}

# Function to clone repository
clone_repository() {
    cd /Users/Shared
    
    # Create main project structure
    mkdir -p AIPrivateSearch/repos
    mkdir -p AIPrivateSearch/sources
    
    if [ -d "AIPrivateSearch/repos/aiprivatesearch" ]; then
        echo -e "${YELLOW}AIPrivateSearch directory already exists.${NC}"
        if confirm "Update existing installation?"; then
            cd AIPrivateSearch/repos/aiprivatesearch
            git pull origin main
            echo -e "${GREEN}✓ Repository updated${NC}"
        fi
    else
        echo "Cloning AIPrivateSearch repository..."
        cd AIPrivateSearch/repos
        git clone https://github.com/drbh/aiprivatesearch.git
        echo -e "${GREEN}✓ Repository cloned${NC}"
    fi
    
    # Check and setup sources folder
    setup_sources_folder
}

# Function to setup sources folder
setup_sources_folder() {
    echo "Checking sources folder..."
    
    if [ -z "$(ls -A /Users/Shared/AIPrivateSearch/sources 2>/dev/null)" ]; then
        echo "Sources folder is empty, copying default files..."
        if [ -d "/Users/Shared/AIPrivateSearch/repos/aiprivatesearch/sources" ]; then
            cp -R /Users/Shared/AIPrivateSearch/repos/aiprivatesearch/sources/* /Users/Shared/AIPrivateSearch/sources/
            echo -e "${GREEN}✓ Default sources copied${NC}"
        else
            echo -e "${YELLOW}No default sources found in repository${NC}"
        fi
    else
        echo -e "${GREEN}✓ Sources folder already contains files${NC}"
    fi
}

# Function to install dependencies and start services
setup_application() {
    cd /Users/Shared/AIPrivateSearch/repos/aiprivatesearch
    
    echo "Installing server dependencies..."
    cd server/s01_server-first-app
    npm install
    
    echo "Installing client dependencies..."
    cd ../../client/c01_client-first-app
    npm install
    
    cd ../..
    
    echo "Pulling required AI models..."
    ollama pull qwen2:1.5b
    ollama pull llama3.2:1b
    
    echo -e "${GREEN}✓ Application setup complete${NC}"
}

# Function to start the application
start_application() {
    cd /Users/Shared/AIPrivateSearch/repos/aiprivatesearch
    
    echo "Starting AIPrivateSearch servers..."
    
    # Start backend server
    cd server/s01_server-first-app
    npm start &
    SERVER_PID=$!
    
    # Start frontend server
    cd ../../client/c01_client-first-app
    npm start &
    CLIENT_PID=$!
    
    sleep 5
    
    # Open browser
    if command_exists open; then
        open http://localhost:3000
    fi
    
    echo -e "${GREEN}=== AIPrivateSearch Installation Complete ===${NC}"
    echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
    echo -e "${GREEN}Backend: http://localhost:3001${NC}"
    echo ""
    echo "Press Ctrl+C to stop the servers"
    
    # Wait for user to stop
    wait
}

# Main installation flow
main() {
    echo -e "${BLUE}AIPrivateSearch Installer v19.06${NC}"
    echo "This will install AIPrivateSearch and all required dependencies."
    echo ""
    
    if ! confirm "Continue with installation?"; then
        echo "Installation cancelled."
        exit 0
    fi
    
    install_xcode_tools
    install_nodejs
    install_ollama
    install_chrome
    start_ollama
    clone_repository
    setup_application
    start_application
}

# Run main function
main "$@"