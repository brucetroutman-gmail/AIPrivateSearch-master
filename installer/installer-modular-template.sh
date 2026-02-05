#!/bin/bash

# AIPrivateSearch Modular Installer
# Loads installation steps from separate files for easier testing

APP_SUPPORT="/Users/Shared/AIPrivateSearch"
LOG_FILE="$APP_SUPPORT/logs/install.log"
INSTALLER_VERSION="VERSION_PLACEHOLDER"

# Create directories
mkdir -p "$APP_SUPPORT"/{logs,data,sources,config,repo}

# Redirect output to log
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

echo "=== AIPrivateSearch Modular Installation Starting at $(date) ==="
echo "Installer Version: $INSTALLER_VERSION"
echo ""

# Function to show dialog
show_dialog() {
    local title="$1"
    local message="$2"
    local type="${3:-informational}"
    
    osascript <<-APPLESCRIPT 2>/dev/null || echo "$message"
        tell application "System Events"
            activate
            display dialog "$message" with title "$title" buttons {"OK"} default button "OK" with icon $type
        end tell
APPLESCRIPT
}

# Function to run a step
run_step() {
    local step_name="$1"
    local step_description="$2"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  🔄 $step_description"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # For now, just run the Mac info detection
    if [ "$step_name" = "macinfo" ]; then
        detect_mac_info
    else
        echo "⚠️ Step '$step_name' not implemented yet"
        return 1
    fi
}

# Step 1: Mac Info Detection
detect_mac_info() {
    echo "🔍 Detecting Mac architecture and system info..."
    
    # Architecture detection
    ARCH=$(uname -m)
    echo "🔍 Raw uname -m result: '$ARCH'"
    
    if [ "$ARCH" = "arm64" ]; then
        NODE_ARCH="arm64"
        echo "✅ Apple Silicon detected (M1/M2/M3/M4)"
    elif [ "$ARCH" = "x86_64" ]; then
        NODE_ARCH="x64"
        echo "✅ Intel Mac detected"
    else
        echo "⚠️ Unknown architecture: $ARCH, defaulting to x64"
        NODE_ARCH="x64"
    fi
    
    # macOS version
    MACOS_VERSION=$(sw_vers -productVersion)
    echo "🍎 macOS Version: $MACOS_VERSION"
    
    # Hardware model
    if command -v system_profiler &> /dev/null; then
        MODEL=$(system_profiler SPHardwareDataType | grep "Model Name" | awk -F': ' '{print $2}')
        echo "💻 Model: $MODEL"
    fi
    
    # Node.js URL
    NODE_VERSION="v20.11.0"
    NODE_TAR="node-${NODE_VERSION}-darwin-${NODE_ARCH}.tar.gz"
    NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/${NODE_TAR}"
    
    echo "📦 Node.js target: $NODE_TAR"
    echo "🌐 Download URL: $NODE_URL"
    
    echo "✅ Mac info detection completed successfully"
    return 0
}

# Main execution
main() {
    show_dialog "AIPrivateSearch Installer v$INSTALLER_VERSION" \
        "Welcome to AIPrivateSearch Modular Installer!

Installer Version: $INSTALLER_VERSION

This is a test version that runs step-by-step:
• Step 1: Detect Mac info and architecture
• More steps will be added as each one works

Click OK to continue." \
        "note"
    
    echo "🚀 Starting modular installation process..."
    
    # Run Step 1: Mac Info Detection
    if run_step "macinfo" "Step 1: Mac Info Detection"; then
        echo ""
        echo "✅ Step 1 completed successfully!"
        echo ""
        echo "🎉 Installation test completed!"
        echo "Next: Add Node.js installation step"
        
        show_dialog "Step 1 Complete" \
            "Mac info detection completed successfully!

Check the log for details:
$LOG_FILE

Next step: Add Node.js installation" \
            "note"
    else
        echo ""
        echo "❌ Step 1 failed!"
        
        show_dialog "Step 1 Failed" \
            "Mac info detection failed.

Check the log for details:
$LOG_FILE" \
            "stop"
        exit 1
    fi
}

# Run main function
main