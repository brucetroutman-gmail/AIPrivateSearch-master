#!/bin/bash

# Script to reset a repository subfolder to match remote repository exactly
# WARNING: This will permanently delete all local changes!

set -e  # Exit on any error

echo "🔄 Repository Reset Tool"
echo "⚠️  WARNING: This will permanently delete all local changes!"
echo ""

# Function to list available git repositories
list_repos() {
    echo "📁 Available git repositories in current directory:"
    local count=0
    for dir in */; do
        if [ -d "\$dir.git" ]; then
            echo "   - \$dir"
            ((count++))
        fi
    done
    
    if [ \$count -eq 0 ]; then
        echo "   No git repositories found in current directory."
        return 1
    fi
    return 0
}

# Show current directory
echo "📍 Current directory: \$(pwd)"
echo ""

# List available repositories
if ! list_repos; then
    echo "❌ No git repositories found. Please run this from a directory containing git repos."
    exit 1
fi

echo ""

# Ask for subfolder name
while true; do
    read -p "📂 Enter the subfolder name (e.g., myApp): " SUBFOLDER
    
    if [ -z "\$SUBFOLDER" ]; then
        echo "❌ Please enter a subfolder name."
        continue
    fi
    
    # Remove trailing slash if present
    SUBFOLDER=\${SUBFOLDER%/}
    
    if [ ! -d "\$SUBFOLDER" ]; then
        echo "❌ Directory '\$SUBFOLDER' does not exist."
        continue
    fi
    
    if [ ! -d "\$SUBFOLDER/.git" ]; then
        echo "❌ '\$SUBFOLDER' is not a git repository."
        continue
    fi
    
    break
done

echo ""
echo "📁 Selected repository: \$SUBFOLDER"
echo "📍 Full path: $(pwd)/$SUBFOLDER"

# Change to the repository directory
cd "\$SUBFOLDER"

# Show current status
echo ""
echo "📊 Current repository status:"
git status --short
echo ""

# Ask for confirmation
read -p "❓ Are you sure you want to reset '\$SUBFOLDER' to match remote? This cannot be undone! (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operation cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting reset process for '\$SUBFOLDER'..."

# Get the current branch name
CURRENT_BRANCH=\$(git branch --show-current)
echo "📋 Current branch: \$CURRENT_BRANCH"

# Fetch latest changes from remote
echo "📥 Fetching latest changes from remote..."
if ! git fetch origin; then
    echo "❌ Failed to fetch from remote. Check your internet connection and remote repository."
    exit 1
fi

# Clean all untracked files and directories
echo "🧹 Cleaning untracked files..."
git clean -fd

# Reset to match remote branch exactly
echo "🔄 Resetting to match origin/\$CURRENT_BRANCH..."
if ! git reset --hard origin/\$CURRENT_BRANCH; then
    echo "❌ Failed to reset. The remote branch might not exist."
    exit 1
fi

echo ""
echo "✅ Repository '\$SUBFOLDER' successfully reset to match remote!"
echo "📊 Final status:"
git status

echo ""
echo "🏠 Returning to parent directory: \$(dirname \$(pwd))"
cd ..
