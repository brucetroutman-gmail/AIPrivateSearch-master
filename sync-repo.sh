#!/bin/bash
# Sync repo to installed app — deletes removed files, copies newer files
SOURCE="/Users/Shared/repos/AIPrivateSearch/repo/aiprivatesearch"
TARGET="/Users/Shared/AIPrivateSearch/repo/aiprivatesearch"

echo "Syncing $SOURCE → $TARGET"
rsync -av --delete \
  --exclude 'node_modules/' \
  --exclude '.git/' \
  --exclude 'sources/' \
  --exclude 'data/' \
  --exclude 'config/' \
  "$SOURCE/" "$TARGET/"

echo "✅ Sync complete"
