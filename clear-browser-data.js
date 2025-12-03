// Clear localStorage for fresh AIPrivateSearch installation
console.log('🧹 Clearing browser localStorage for fresh installation...');

// List of localStorage keys to clear
const keysToRemove = [
    'app_token',
    'theme', 
    'userEmail',
    'userRole',
    'userTier',
    'selectedSearchModel',
    'selectedScoreModel',
    'searchMode',
    'selectedCollection',
    'selectedSourceType',
    'lastSearchQuery',
    'searchHistory',
    'modelConfigs',
    'userPreferences'
];

let clearedCount = 0;
keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        clearedCount++;
        console.log(`   ✅ Removed: ${key}`);
    }
});

if (clearedCount > 0) {
    console.log(`🗑️  Cleared ${clearedCount} localStorage items`);
} else {
    console.log('✨ localStorage already clean');
}

console.log('🔄 Ready for fresh AIPrivateSearch setup');