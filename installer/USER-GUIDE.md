# AIPrivateSearch User Guide

## 🚀 First-Time Installation

1. Download `AIPrivateSearch-1.0.0.pkg` or `.dmg`
2. Install (drag to Applications or run installer)
3. Launch AIPrivateSearch from Applications folder
4. Wait 5-15 minutes for automatic setup
5. Browser opens automatically - you're ready!

**Login Credentials:**
- Email: `adm-std@a.com`
- Password: `123`

---

## 🔄 Updating to New Versions

### Easy Method (3 Steps):

**1. Download the updater**
   - [Download Update-AIPrivateSearch.command](link to updater)
   - Save to your Downloads folder

**2. Run the updater**
   - Double-click `Update-AIPrivateSearch.command`
   - Click "Open" if warned (first time only)

**3. Follow prompts**
   - Click "Update" when asked
   - Wait 1 minute
   - See "Update Complete" - done!

### Alternative: Built-in Updater

**1. Stop AIPrivateSearch** (if running)
   - Close the Terminal window

**2. Access updater**
   - In Applications, right-click `AIPrivateSearch.app`
   - Select "Show Package Contents"
   - Go to: `Contents → Resources → scripts`
   - Double-click `Update-AIPrivateSearch.sh`

**3. Follow prompts**
   - Click "Update"
   - Wait 1 minute
   - Done!

### Reinstall Method (if updater doesn't work)

**1. Stop AIPrivateSearch** (if running)

**2. Delete the app**
   - Drag AIPrivateSearch.app to Trash
   - (Your data is safe - it's stored separately)

**3. Install new version**
   - Download new `.pkg` or `.dmg`
   - Install normally

**4. Launch**
   - All your data and settings are preserved!
   - Much faster than first install (prerequisites already there)

---

## 📂 Where Your Data Is Stored

Everything is in: `/Users/Shared/AIPrivateSearch/`

```
/Users/Shared/AIPrivateSearch/
├── .env-aips               ← Your configuration (login, database)
├── data/                   ← User data, sessions
├── sources/                ← Your documents
├── config/                 ← App configuration
├── repo/aiprivatesearch/   ← Application code (gets updated)
└── backups/                ← Automatic backups when updating
```

**Your data is safe during updates!**

---

## 🛑 Stopping AIPrivateSearch

Choose any method:

**Method 1: Close Terminal Window**
- Just close the Terminal window that's running AIPrivateSearch

**Method 2: Press Ctrl+C**
- In the Terminal window, press `Ctrl+C`

**Method 3: Activity Monitor**
- Open Activity Monitor
- Find "node" or "AIPrivateSearch"
- Click Stop

---

## 🔧 Changing Configuration

**1. Stop AIPrivateSearch**

**2. Edit configuration file:**
```bash
# Option A: Use TextEdit
open -a TextEdit /Users/Shared/AIPrivateSearch/.env-aips

# Option B: Use nano in Terminal
nano /Users/Shared/AIPrivateSearch/.env-aips
```

**3. Make your changes**
   - Change admin email/password
   - Update database settings
   - Modify API keys

**4. Save and close**

**5. Launch AIPrivateSearch**
   - New settings take effect

---

## 📊 Checking Logs

If something goes wrong:

**Installation log:**
```bash
cat /Users/Shared/AIPrivateSearch/logs/install.log
```

**Update log:**
```bash
cat /Users/Shared/AIPrivateSearch/logs/update.log
```

**Or open in TextEdit:**
```bash
open -a TextEdit /Users/Shared/AIPrivateSearch/logs/install.log
```

---

## ❓ Troubleshooting

### "App is from an unidentified developer"
**Solution:** Right-click → Open (first time only)

### App won't launch
**Check:**
1. Is Node.js installed? Run: `node --version`
2. Is Ollama installed? Run: `ollama --version`
3. Check logs: `/Users/Shared/AIPrivateSearch/logs/install.log`

### Port 3000 already in use
**Solution:** Something else is using port 3000
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
```

### Update fails
**Solution:** Reinstall
1. Delete AIPrivateSearch.app
2. Download and install new version
3. Your data is preserved

### Lost my password
**Solution:** Edit configuration file
```bash
open -a TextEdit /Users/Shared/AIPrivateSearch/.env-aips
```
Change `DEFAULT_ADMIN_PASSWORD=123` to your new password

### Want to start fresh
**Solution:** Delete everything and reinstall
```bash
# Delete all data (be careful!)
rm -rf /Users/Shared/AIPrivateSearch
rm -rf /Applications/AIPrivateSearch.app

# Then reinstall
```

---

## 🎯 Quick Reference

| Action | Command/Location |
|--------|------------------|
| **Launch** | Double-click AIPrivateSearch in Applications |
| **Stop** | Close Terminal window or press Ctrl+C |
| **Update** | Double-click Update-AIPrivateSearch.command |
| **Config** | `/Users/Shared/AIPrivateSearch/.env-aips` |
| **Logs** | `/Users/Shared/AIPrivateSearch/logs/` |
| **Data** | `/Users/Shared/AIPrivateSearch/data/` |
| **Documents** | `/Users/Shared/AIPrivateSearch/sources/` |
| **Backups** | `/Users/Shared/AIPrivateSearch/backups/` |

---

## 💡 Tips

**Add to Dock:**
- Drag AIPrivateSearch from Applications to Dock
- Click to launch anytime

**Bookmark in Browser:**
- Bookmark http://localhost:3000
- Quick access when running

**Auto-start (Advanced):**
- System Settings → Users & Groups → Login Items
- Add AIPrivateSearch.app
- Starts automatically when you log in

**Keep Updated:**
- Check GitHub for new releases
- Run updater occasionally
- Updates take ~1 minute

---

## 📞 Support

**Documentation:** README files in the app bundle

**GitHub:** https://github.com/yourusername/aiprivatesearch

**Logs:** Check `/Users/Shared/AIPrivateSearch/logs/` for errors

---

## 🎉 That's It!

AIPrivateSearch is designed to be simple:
- Install once
- Update easily
- Your data is always safe

Enjoy your private AI search! 🚀
