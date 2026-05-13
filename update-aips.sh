#!/bin/bash
# Quick update script for remote Mac - deletes repo and re-clones from GitHub

REPO_DIR="/Users/Shared/repos/AIPrivateSearch/repo/aiprivatesearch"
PARENT_DIR="/Users/Shared/repos/AIPrivateSearch/repo"
AIPS_DIR="/Users/Shared/AIPrivateSearch"

echo "=== AIPrivateSearch Remote Update ==="

# Clone repo
rm -rf "$REPO_DIR"
cd "$PARENT_DIR"
git clone https://github.com/brucetroutman-gmail/AIPrivateSearch-master.git aiprivatesearch

# Sync config, sources, and data from repo to parent folder
mkdir -p "$AIPS_DIR/config"
mkdir -p "$AIPS_DIR/sources"
mkdir -p "$AIPS_DIR/data"

cp -r "$REPO_DIR/client/c01_client-first-app/config/" "$AIPS_DIR/config/"
cp -r "$REPO_DIR/sources/" "$AIPS_DIR/sources/"
cp -r "$REPO_DIR/data/" "$AIPS_DIR/data/"

echo "✅ Done"
