#!/bin/bash
# Quick update script for remote Mac - deletes repo and re-clones from GitHub

REPO_DIR="/Users/Shared/repos/AIPrivateSearch/repo/aiprivatesearch"
PARENT_DIR="/Users/Shared/repos/AIPrivateSearch/repo"

echo "=== AIPrivateSearch Remote Update ==="

rm -rf "$REPO_DIR"
cd "$PARENT_DIR"
git clone https://github.com/brucetroutman-gmail/AIPrivateSearch-master.git aiprivatesearch

echo "✅ Done"
