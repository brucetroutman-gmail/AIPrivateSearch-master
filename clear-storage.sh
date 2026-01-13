#!/bin/bash

# AIPS localStorage Cleaner
# Clears AIPS-related localStorage for clean testing

echo "🧹 Clearing AIPS localStorage..."

osascript -e '
tell application "Google Chrome"
    if (count of windows) = 0 then
        make new window
    end if
    
    tell front window
        if (count of tabs) = 0 then
            make new tab
        end if
        
        set URL of active tab to "http://localhost:56305"
        delay 1
        
        execute active tab javascript "
            const keys = [\"licenseEmail\",\"licenseToken\",\"refreshToken\",\"licenseStatus\",\"sessionId\",\"userEmail\",\"userRole\",\"userUserRole\",\"selectedCollection\",\"selectedScoreModel\"];
            let cleared = 0;
            keys.forEach(k => {
                if (localStorage.getItem(k)) {
                    localStorage.removeItem(k);
                    cleared++;
                }
            });
            console.log(\"✅ AIPS localStorage cleared:\", cleared, \"items\");
            alert(\"✅ AIPS localStorage cleared (\" + cleared + \" items)\");
        "
    end tell
end tell'

echo "✅ Done! AIPS localStorage cleared"
echo "💡 Refresh browser to test clean state"