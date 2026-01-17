#!/bin/bash

# AIPS Complete Test Reset
# Clears AIPS localStorage AND device registration for clean testing

echo "🧹 Clearing AIPS localStorage and device registration..."

# Clear localStorage
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
        "
    end tell
end tell'

echo "✅ localStorage cleared"

# Get device UUID and clear device registration
echo "🔧 Clearing device registration..."
curl -s "http://localhost:56306/api/licensing/system-info" | grep -o '"deviceUuid":"[^"]*"' | cut -d'"' -f4 > /tmp/device_uuid.txt
DEVICE_UUID=$(cat /tmp/device_uuid.txt)

if [ -n "$DEVICE_UUID" ]; then
    echo "📱 Device UUID: $DEVICE_UUID"
    echo "⚠️  Manual step required: Delete device $DEVICE_UUID from CustMgr database"
    echo "   SQL: DELETE FROM devices WHERE device_uuid = '$DEVICE_UUID';"
else
    echo "❌ Could not get device UUID"
fi

rm -f /tmp/device_uuid.txt

echo "✅ Done! Complete test reset prepared"
echo "💡 For true new user test, delete device from database first"