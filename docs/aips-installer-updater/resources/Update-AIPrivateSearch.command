#!/bin/bash

# AIPrivateSearch Quick Updater
# Double-click this file to update AIPrivateSearch

# Make it work when double-clicked from Finder
cd "$(dirname "$0")"

# Run the main updater script
if [ -f "/Applications/AIPrivateSearch.app/Contents/Resources/scripts/Update-AIPrivateSearch.sh" ]; then
    /Applications/AIPrivateSearch.app/Contents/Resources/scripts/Update-AIPrivateSearch.sh
else
    osascript <<-APPLESCRIPT
        tell application "System Events"
            activate
            display dialog "AIPrivateSearch.app not found in Applications folder.

Please install AIPrivateSearch first." with title "Not Installed" buttons {"OK"} default button "OK" with icon stop
        end tell
APPLESCRIPT
fi
