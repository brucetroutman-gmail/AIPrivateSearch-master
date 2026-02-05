#!/bin/bash

# Step 1: Mac Info Detection Test
# Test architecture detection on target Mac

echo "🔍 AIPrivateSearch - Mac Info Detection Test"
echo "============================================="
echo ""

# Basic system info
echo "📋 System Information:"
echo "   Hostname: $(hostname)"
echo "   User: $(whoami)"
echo "   Date: $(date)"
echo ""

# Architecture detection
echo "🏗️ Architecture Detection:"
ARCH=$(uname -m)
echo "   Raw uname -m: '$ARCH'"

if [ "$ARCH" = "arm64" ]; then
    NODE_ARCH="arm64"
    echo "   ✅ Apple Silicon detected (M1/M2/M3/M4)"
    echo "   📦 Node.js architecture: $NODE_ARCH"
elif [ "$ARCH" = "x86_64" ]; then
    NODE_ARCH="x64"
    echo "   ✅ Intel Mac detected"
    echo "   📦 Node.js architecture: $NODE_ARCH"
else
    echo "   ⚠️ Unknown architecture: $ARCH"
    NODE_ARCH="x64"
    echo "   📦 Node.js architecture: $NODE_ARCH (default)"
fi

echo ""

# macOS version
echo "🍎 macOS Information:"
SW_VERS=$(sw_vers)
echo "   Version: $(sw_vers -productVersion)"
echo "   Build: $(sw_vers -buildVersion)"
echo "   Name: $(sw_vers -productName)"
echo ""

# Hardware info
echo "💻 Hardware Information:"
if command -v system_profiler &> /dev/null; then
    MODEL=$(system_profiler SPHardwareDataType | grep "Model Name" | awk -F': ' '{print $2}')
    CHIP=$(system_profiler SPHardwareDataType | grep "Chip" | awk -F': ' '{print $2}')
    echo "   Model: $MODEL"
    echo "   Chip: $CHIP"
else
    echo "   system_profiler not available"
fi

echo ""

# Node.js URL that would be used
NODE_VERSION="v20.11.0"
NODE_TAR="node-${NODE_VERSION}-darwin-${NODE_ARCH}.tar.gz"
NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/${NODE_TAR}"

echo "🌐 Node.js Download Info:"
echo "   Version: $NODE_VERSION"
echo "   Architecture: $NODE_ARCH"
echo "   Filename: $NODE_TAR"
echo "   URL: $NODE_URL"

echo ""
echo "✅ Mac info detection test complete!"
echo ""
echo "Expected results for M4 Mac Mini:"
echo "   Raw uname -m: 'arm64'"
echo "   Apple Silicon detected"
echo "   Node.js architecture: arm64"
echo ""