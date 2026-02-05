# How to Update AIPrivateSearch

When you release a new version on GitHub, users have several options to update.

## 📦 What Gets Preserved During Updates

✅ **Always Preserved:**
- Configuration file: `/Users/Shared/AIPrivateSearch/.env-aips`
- User data: `/Users/Shared/AIPrivateSearch/data/`
- Documents: `/Users/Shared/AIPrivateSearch/sources/`
- Config files: `/Users/Shared/AIPrivateSearch/config/`

✅ **What Gets Updated:**
- Application code: `/Users/Shared/AIPrivateSearch/repo/aiprivatesearch/`

✅ **Automatic Backup Created:**
- Previous version backed up to: `/Users/Shared/AIPrivateSearch/backups/`

---

## 🔄 Update Methods

### Method 1: Built-in Update Script (Easiest)

**Step 1:** Stop AIPrivateSearch (if running)
- Close the Terminal window, OR
- Press Ctrl+C in Terminal

**Step 2:** Run the updater

**Option A - From Finder:**
1. Go to Applications folder
2. Right-click `AIPrivateSearch.app`
3. Select "Show Package Contents"
4. Navigate to `Contents → Resources → scripts`
5. Double-click `Update-AIPrivateSearch.sh`

**Option B - From Terminal:**
```bash
/Applications/AIPrivateSearch.app/Contents/Resources/scripts/Update-AIPrivateSearch.sh
```

**Step 3:** Follow the prompts
- Dialog will confirm you want to update
- Wait 1-2 minutes for download and installation
- See "Update Complete" dialog

**Step 4:** Launch AIPrivateSearch normally
- Double-click AIPrivateSearch.app
- Everything is ready to go!

---

### Method 2: Reinstall (Simple but slower)

**Step 1:** Stop AIPrivateSearch (if running)

**Step 2:** Delete the app
```bash
# Your data is safe in /Users/Shared/AIPrivateSearch
rm -rf /Applications/AIPrivateSearch.app
```

**Step 3:** Download new version
- Download new `.pkg` or `.dmg`
- Install normally

**Step 4:** Launch AIPrivateSearch
- First launch will be fast (prerequisites already installed)
- All your data and configuration are preserved

---

### Method 3: Terminal Update (Advanced)

**For users comfortable with Terminal:**

```bash
#!/bin/bash

# Stop AIPrivateSearch if running
pkill -f "node server.mjs"

# Backup current version
BACKUP="/Users/Shared/AIPrivateSearch/backups/backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p /Users/Shared/AIPrivateSearch/backups
cp -R /Users/Shared/AIPrivateSearch/repo/aiprivatesearch "$BACKUP"

# Download latest version
cd /Users/Shared/AIPrivateSearch/repo
curl -L -o update.zip "https://github.com/brucetroutman-gmail/AIPrivateSearch-master/archive/refs/heads/main.zip"

# Extract and install
rm -rf aiprivatesearch-temp
unzip -q update.zip -d aiprivatesearch-temp

# Move new version into place
rm -rf aiprivatesearch
mv aiprivatesearch-temp/AIPrivateSearch-master* aiprivatesearch
rm -rf aiprivatesearch-temp update.zip

echo "✅ Update complete! Launch AIPrivateSearch normally."
```

---

## 📝 User Instructions to Include in Release Notes

When you release a new version on GitHub, include this in your release notes:

```markdown
## 🆕 What's New in v1.1.0
- [List your changes here]

## 📥 Download
- [AIPrivateSearch-1.1.0.pkg](link)
- [AIPrivateSearch-1.1.0.dmg](link)

## 🔄 Updating from Previous Version

### Option 1: Use Built-in Updater (Recommended)
1. Stop AIPrivateSearch if running (close Terminal window)
2. In Applications folder, right-click AIPrivateSearch.app
3. Select "Show Package Contents"
4. Navigate to Contents → Resources → scripts
5. Double-click "Update-AIPrivateSearch.sh"
6. Follow prompts - takes 1-2 minutes
7. Your data and settings are automatically preserved!

### Option 2: Reinstall
1. Stop AIPrivateSearch if running
2. Delete AIPrivateSearch.app from Applications folder
3. Download and install this new version
4. Your data in /Users/Shared/AIPrivateSearch is preserved

**Note:** Your configuration, user data, and documents are always preserved during updates!
```

---

## 🎯 What Happens During Update

### Using Built-in Updater:

**User sees:**
```
┌─────────────────────────────────────────┐
│  Update AIPrivateSearch                 │
├─────────────────────────────────────────┤
│                                         │
│  Update to the latest version from     │
│  GitHub?                                │
│                                         │
│  This will:                             │
│  • Backup your current version          │
│  • Download the latest code             │
│  • Preserve your configuration          │
│  • Preserve your data                   │
│                                         │
│  Continue?                              │
│                                         │
│         [ Cancel ]  [ Update ]          │
└─────────────────────────────────────────┘
```

Click "Update"...

**Terminal shows:**
```
=== AIPrivateSearch Update Starting ===

✅ No running processes detected

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Creating backup...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Backing up to: /Users/Shared/AIPrivateSearch/backups/aiprivatesearch-20260130_123456
✅ Backup created

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Downloading latest version...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Downloading from GitHub...
✅ Download successful

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Extracting new version...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Extraction successful

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Installing new version...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Removing old version...
Installing new version...
✅ New version installed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Preserving your data...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Configuration preserved at: /Users/Shared/AIPrivateSearch/.env-aips
✅ User data preserved at: /Users/Shared/AIPrivateSearch/data/
✅ Documents preserved at: /Users/Shared/AIPrivateSearch/sources/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Update Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ AIPrivateSearch has been updated to the latest version!
```

**Final dialog:**
```
┌─────────────────────────────────────────┐
│  Update Complete                        │
├─────────────────────────────────────────┤
│                                         │
│  AIPrivateSearch has been updated       │
│  successfully!                          │
│                                         │
│  Your configuration and data have been  │
│  preserved.                             │
│                                         │
│  Backup of previous version:            │
│  /Users/Shared/AIPrivateSearch/...      │
│                                         │
│  You can now launch AIPrivateSearch.    │
│                                         │
│               [ OK ]                    │
└─────────────────────────────────────────┘
```

---

## 🔍 Troubleshooting Updates

### "AIPrivateSearch is Running" Error
**Problem:** App is still running
**Solution:** Close Terminal window or press Ctrl+C, then try again

### "Download Failed" Error
**Problem:** No internet connection or GitHub is down
**Solution:** 
- Check internet connection
- Try again later
- Use Method 2 (reinstall) instead

### "Not Installed" Error
**Problem:** AIPrivateSearch was never run
**Solution:** Launch AIPrivateSearch first, then update

### Lost Data After Update
**Problem:** Shouldn't happen, but just in case
**Solution:** Restore from backup:
```bash
# Find your backup
ls /Users/Shared/AIPrivateSearch/backups/

# Restore (replace TIMESTAMP with your backup folder name)
rm -rf /Users/Shared/AIPrivateSearch/repo/aiprivatesearch
cp -R /Users/Shared/AIPrivateSearch/backups/aiprivatesearch-TIMESTAMP \
      /Users/Shared/AIPrivateSearch/repo/aiprivatesearch
```

---

## 💡 Best Practices for You (Developer)

### When Releasing New Version:

1. **Tag the release on GitHub**
   ```bash
   git tag -a v1.1.0 -m "Version 1.1.0"
   git push origin v1.1.0
   ```

2. **Build new installers**
   ```bash
   ./build-auto-install.sh
   ```

3. **Upload to GitHub Releases**
   - Upload new .pkg and .dmg
   - Include update instructions in release notes

4. **Test the update process**
   - Install old version
   - Run updater
   - Verify it updates correctly

### Version Numbering:
- Use semantic versioning: MAJOR.MINOR.PATCH
- Example: 1.0.0 → 1.1.0 → 1.1.1 → 2.0.0

---

## ⏱️ Update Timeline

| Action | Time |
|--------|------|
| Stop AIPrivateSearch | 5 sec |
| Run updater | 5 sec |
| Download from GitHub | 10-30 sec |
| Extract and install | 5-10 sec |
| **Total** | **~1 minute** |

Much faster than reinstalling! (No Node.js/Ollama downloads)

---

## 🎉 Summary

**For Users:**
- Updates are easy (3 clicks)
- Takes ~1 minute
- All data preserved
- Automatic backups

**For You:**
- Release on GitHub
- Users run built-in updater
- No support burden
- Users stay current

The built-in updater makes it super easy for users to get your latest updates! 🚀
