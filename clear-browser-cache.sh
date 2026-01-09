#!/bin/bash

echo "🧹 Clearing Browser Cache and localStorage..."

# Function to clear Chrome data
clear_chrome_data() {
    echo "   Clearing Chrome data for localhost:3000..."
    
    # AppleScript to clear Chrome data
    osascript << 'EOF'
    tell application "Google Chrome"
        if it is running then
            -- Close any localhost:3000 tabs
            repeat with w in windows
                repeat with t in tabs of w
                    if URL of t contains "localhost:3000" then
                        close t
                    end if
                end repeat
            end repeat
        end if
        
        -- Open new tab to localhost:3000
        if not (exists window 1) then
            make new window
        end if
        
        set URL of active tab of window 1 to "http://localhost:3000"
        delay 2
        
        -- Execute JavaScript to clear only AIPS-related storage
        tell active tab of window 1
            execute javascript "
                // Clear only AIPS-related localStorage items
                const aipsKeys = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.includes('aips') || key.includes('AIPrivateSearch') || 
                               key.includes('sessionId') || key.includes('userEmail') || 
                               key.includes('userRole') || key.includes('theme') || 
                               key.includes('lastUsed') || key.includes('selected') ||
                               key.includes('generateScores') || key.includes('developerMode'))) {
                        aipsKeys.push(key);
                    }
                }
                
                // Remove AIPS-specific keys
                aipsKeys.forEach(key => {
                    localStorage.removeItem(key);
                    console.log('🗑️ Removed localStorage key:', key);
                });
                
                // Clear only AIPS-related sessionStorage items
                const aipsSessionKeys = [];
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    if (key && (key.includes('aips') || key.includes('AIPrivateSearch') || 
                               key.includes('license') || key.includes('auth'))) {
                        aipsSessionKeys.push(key);
                    }
                }
                
                aipsSessionKeys.forEach(key => {
                    sessionStorage.removeItem(key);
                    console.log('🗑️ Removed sessionStorage key:', key);
                });
                
                // Clear only localhost cookies (not other sites)
                document.cookie.split(';').forEach(function(c) {
                    const cookieName = c.replace(/^ +/, '').replace(/=.*/, '');
                    if (cookieName.includes('aips') || cookieName.includes('session') || cookieName.includes('auth')) {
                        document.cookie = cookieName + '=;expires=' + new Date().toUTCString() + ';path=/;domain=localhost';
                        console.log('🗑️ Removed cookie:', cookieName);
                    }
                });
                
                // Clear only AIPS-related IndexedDB
                if (window.indexedDB) {
                    indexedDB.databases().then(databases => {
                        databases.forEach(db => {
                            if (db.name.toLowerCase().includes('aips') || 
                                db.name.toLowerCase().includes('private') ||
                                db.name.toLowerCase().includes('search')) {
                                indexedDB.deleteDatabase(db.name);
                                console.log('🗑️ Removed IndexedDB:', db.name);
                            }
                        });
                    }).catch(() => {});
                }
                
                console.log('🧹 AIPS-specific browser storage cleared by script');
                console.log('✅ Only AIPrivateSearch data removed, other sites preserved');
            "
        end tell
    end tell
EOF
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Chrome data cleared successfully"
        return 0
    else
        echo "   ⚠️  Chrome clearing failed, trying alternative method..."
        return 1
    fi
}

# Function to clear Safari data (fallback)
clear_safari_data() {
    echo "   Clearing Safari data for localhost:3000..."
    
    osascript << 'EOF'
    tell application "Safari"
        if it is running then
            -- Close any localhost:3000 tabs
            repeat with w in windows
                repeat with t in tabs of w
                    if URL of t contains "localhost:3000" then
                        close t
                    end if
                end repeat
            end repeat
        end if
        
        -- Open new tab to localhost:3000
        if not (exists window 1) then
            make new window
        end if
        
        set URL of current tab of window 1 to "http://localhost:3000"
        delay 2
        
        -- Execute JavaScript to clear only AIPS-related storage
        do JavaScript "
            // Clear only AIPS-related localStorage items
            const aipsKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('aips') || key.includes('AIPrivateSearch') || 
                           key.includes('sessionId') || key.includes('userEmail') || 
                           key.includes('userRole') || key.includes('theme') || 
                           key.includes('lastUsed') || key.includes('selected') ||
                           key.includes('generateScores') || key.includes('developerMode'))) {
                    aipsKeys.push(key);
                }
            }
            
            // Remove AIPS-specific keys
            aipsKeys.forEach(key => {
                localStorage.removeItem(key);
                console.log('🗑️ Removed localStorage key:', key);
            });
            
            // Clear only AIPS-related sessionStorage items
            const aipsSessionKeys = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.includes('aips') || key.includes('AIPrivateSearch') || 
                           key.includes('license') || key.includes('auth'))) {
                    aipsSessionKeys.push(key);
                }
            }
            
            aipsSessionKeys.forEach(key => {
                sessionStorage.removeItem(key);
                console.log('🗑️ Removed sessionStorage key:', key);
            });
            
            console.log('🧹 AIPS-specific Safari storage cleared by script');
            console.log('✅ Only AIPrivateSearch data removed, other sites preserved');
        " in current tab of window 1
    end tell
EOF
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Safari data cleared successfully"
        return 0
    else
        echo "   ❌ Safari clearing failed"
        return 1
    fi
}

# Function to clear Chrome user data directory (nuclear option)
clear_chrome_profile_data() {
    echo "   Clearing Chrome profile data (nuclear option)..."
    
    # Close Chrome first
    pkill -f "Google Chrome" 2>/dev/null
    sleep 2
    
    # Clear Chrome's AIPS-specific data from profile
    CHROME_PROFILE="$HOME/Library/Application Support/Google/Chrome/Default"
    
    if [ -d "$CHROME_PROFILE" ]; then
        # Clear only localhost-related Local Storage
        if [ -d "$CHROME_PROFILE/Local Storage" ]; then
            find "$CHROME_PROFILE/Local Storage" -name "*localhost*" -delete 2>/dev/null
            find "$CHROME_PROFILE/Local Storage" -name "*127.0.0.1*" -delete 2>/dev/null
            echo "     ✅ Chrome Local Storage (localhost only) cleared"
        fi
        
        # Clear only localhost-related Session Storage
        if [ -d "$CHROME_PROFILE/Session Storage" ]; then
            find "$CHROME_PROFILE/Session Storage" -name "*localhost*" -delete 2>/dev/null
            find "$CHROME_PROFILE/Session Storage" -name "*127.0.0.1*" -delete 2>/dev/null
            echo "     ✅ Chrome Session Storage (localhost only) cleared"
        fi
        
        # Clear only localhost-related IndexedDB
        if [ -d "$CHROME_PROFILE/IndexedDB" ]; then
            find "$CHROME_PROFILE/IndexedDB" -name "*localhost*" -type d -exec rm -rf {} + 2>/dev/null
            find "$CHROME_PROFILE/IndexedDB" -name "*127.0.0.1*" -type d -exec rm -rf {} + 2>/dev/null
            echo "     ✅ Chrome IndexedDB (localhost only) cleared"
        fi
        
        echo "   ✅ Chrome profile data (localhost only) cleared"
        return 0
    else
        echo "   ❌ Chrome profile not found"
        return 1
    fi
}

# Main clearing logic
echo "🌐 Attempting to clear browser data..."

# Try Chrome first (most common)
if command -v "Google Chrome" &> /dev/null || [ -d "/Applications/Google Chrome.app" ]; then
    if clear_chrome_data; then
        echo "✅ Chrome data cleared via JavaScript"
    else
        echo "⚠️  JavaScript method failed, trying profile clearing..."
        if clear_chrome_profile_data; then
            echo "✅ Chrome data cleared via profile manipulation"
        else
            echo "❌ Chrome clearing failed completely"
        fi
    fi
elif command -v "Safari" &> /dev/null || [ -d "/Applications/Safari.app" ]; then
    if clear_safari_data; then
        echo "✅ Safari data cleared"
    else
        echo "❌ Safari clearing failed"
    fi
else
    echo "❌ No supported browser found (Chrome or Safari)"
    echo "   Please manually clear browser cache:"
    echo "   - Open DevTools (F12)"
    echo "   - Application → Storage → Clear site data"
    echo "   - Or console: localStorage.clear()"
fi

echo ""
echo "🧹 Browser cache clearing complete!"
echo "   ✅ Only AIPrivateSearch data cleared (localhost:3000)"
echo "   ✅ Other websites and data preserved"
echo "   If automatic clearing failed, please manually:"
echo "   1. Open http://localhost:3000"
echo "   2. Press F12 (DevTools)"
echo "   3. Console tab: Run selective clearing script"
echo "   4. Application tab: Storage → Clear only localhost data"