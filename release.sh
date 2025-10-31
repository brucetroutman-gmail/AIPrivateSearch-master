#!/bin/bash

# AIPrivateSearch Release Script
# Usage: ./release.sh [major_version]
# Examples: ./release.sh (minor bump) or ./release.sh 19 (major bump to 19.00)

set -e

# Get current version from README
CURRENT_VERSION=$(grep "Version\*\*:" README.md | sed 's/.*Version\*\*: \([0-9.]*\).*/\1/')

if [ -z "$CURRENT_VERSION" ]; then
    echo "❌ Could not find current version in README.md"
    exit 1
fi

echo "📋 Current version: $CURRENT_VERSION"

# Calculate new version
if [ -n "$1" ]; then
    # Major version bump
    NEW_VERSION="$1.00"
    echo "🔢 Major version bump to: $NEW_VERSION"
else
    # Minor version bump
    MAJOR=$(echo $CURRENT_VERSION | cut -d. -f1)
    MINOR=$(echo $CURRENT_VERSION | cut -d. -f2)
    # Remove leading zeros to avoid octal interpretation
    MINOR_NUM=$((10#$MINOR))
    NEW_MINOR=$(printf "%02d" $((MINOR_NUM + 1)))
    NEW_VERSION="$MAJOR.$NEW_MINOR"
    echo "🔢 Minor version bump to: $NEW_VERSION"
fi

# Update README.md
echo "📝 Updating README.md version..."
sed -i '' "s/Version.*: $CURRENT_VERSION/Version**: $NEW_VERSION/" README.md

# Update package.json files
echo "📝 Updating package.json files..."
if [ -f "package.json" ]; then
    sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
fi

if [ -f "client/c01_client-first-app/package.json" ]; then
    sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" client/c01_client-first-app/package.json
fi

if [ -f "server/s01_server-first-app/package.json" ]; then
    sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" server/s01_server-first-app/package.json
fi

# Copy sources to repo
echo "📁 Copying sources to repo..."
if [ -d "/Users/Shared/AIPrivateSearch/sources" ]; then
    # Remove existing sources in repo
    if [ -d "sources" ]; then
        rm -rf sources
    fi
    
    # Copy from shared location to repo
    cp -r "/Users/Shared/AIPrivateSearch/sources" .
    echo "   ✅ Sources copied from /Users/Shared/AIPrivateSearch/sources/"
else
    echo "   ⚠️  Sources directory not found at /Users/Shared/AIPrivateSearch/sources/"
fi

# Copy data to repo
echo "📁 Copying data to repo..."
if [ -d "/Users/Shared/AIPrivateSearch/data" ]; then
    # Remove existing data in repo (except .gitignore)
    if [ -d "data" ]; then
        find data -type f ! -name '.gitignore' -delete 2>/dev/null || true
    else
        mkdir -p data
    fi
    
    # Copy data files from shared location to repo
    cp "/Users/Shared/AIPrivateSearch/data/"*.json data/ 2>/dev/null || true
    echo "   ✅ Data files copied from /Users/Shared/AIPrivateSearch/data/"
else
    echo "   ⚠️  Data directory not found at /Users/Shared/AIPrivateSearch/data/"
fi

# Generate commit message
echo ""
echo "🎯 Release $NEW_VERSION prepared!"
echo ""
echo "📋 Suggested commit message:"
echo "v$NEW_VERSION: [Add description of changes here]"
echo ""
echo "💡 Next steps:"
echo "1. Review the changes with: git diff"
echo "2. Add your changes: git add ."
echo "3. Commit with message: git commit -m 'v$NEW_VERSION: [description]'"
echo "4. Push to repository: git push"