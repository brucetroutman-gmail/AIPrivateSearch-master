// AIPrivateSearch Selective Storage Cleaner
// Run this in browser console to clear only AIPS-related data

console.log('🧹 AIPrivateSearch Selective Storage Cleaner');
console.log('============================================');

// Clear only AIPS-related localStorage items
console.log('🔍 Scanning localStorage...');
const aipsLocalKeys = [];
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
        key.includes('aips') || 
        key.includes('AIPrivateSearch') || 
        key.includes('sessionId') || 
        key.includes('userEmail') || 
        key.includes('userRole') || 
        key.includes('userUserRole') ||
        key.includes('theme') || 
        key.includes('lastUsed') || 
        key.includes('selected') ||
        key.includes('generateScores') || 
        key.includes('developerMode') ||
        key.includes('lastCollection') ||
        key.includes('lastSourceType') ||
        key.includes('lastSearchType') ||
        key.includes('lastAssistantType') ||
        key.includes('lastPrompt') ||
        key.includes('lastTemperature') ||
        key.includes('lastContext') ||
        key.includes('lastTokens') ||
        key.includes('useWildcards') ||
        key.includes('addMetaPrompt') ||
        key.includes('lastVectorDB') ||
        key.includes('selectedScoreModel') ||
        key.includes('lastScoreTemperature') ||
        key.includes('lastScoreContext') ||
        key.includes('lastScoreTokens')
    )) {
        aipsLocalKeys.push(key);
    }
}

console.log(`📋 Found ${aipsLocalKeys.length} AIPS localStorage items:`);
aipsLocalKeys.forEach(key => {
    console.log(`   - ${key}: ${localStorage.getItem(key)}`);
    localStorage.removeItem(key);
});

// Clear only AIPS-related sessionStorage items
console.log('🔍 Scanning sessionStorage...');
const aipsSessionKeys = [];
for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (
        key.includes('aips') || 
        key.includes('AIPrivateSearch') || 
        key.includes('license') || 
        key.includes('auth') ||
        key.includes('session')
    )) {
        aipsSessionKeys.push(key);
    }
}

console.log(`📋 Found ${aipsSessionKeys.length} AIPS sessionStorage items:`);
aipsSessionKeys.forEach(key => {
    console.log(`   - ${key}: ${sessionStorage.getItem(key)}`);
    sessionStorage.removeItem(key);
});

// Clear only localhost cookies (not other sites)
console.log('🔍 Scanning cookies...');
const cookies = document.cookie.split(';');
let cookiesCleared = 0;
cookies.forEach(function(cookie) {
    const cookieName = cookie.replace(/^ +/, '').replace(/=.*/, '');
    if (cookieName && (
        cookieName.includes('aips') || 
        cookieName.includes('session') || 
        cookieName.includes('auth') ||
        cookieName.includes('user') ||
        cookieName.includes('license')
    )) {
        // Clear for localhost
        document.cookie = cookieName + '=;expires=' + new Date().toUTCString() + ';path=/;domain=localhost';
        document.cookie = cookieName + '=;expires=' + new Date().toUTCString() + ';path=/';
        console.log(`   - Cleared cookie: ${cookieName}`);
        cookiesCleared++;
    }
});

console.log(`📋 Cleared ${cookiesCleared} AIPS-related cookies`);

// Clear only AIPS-related IndexedDB
console.log('🔍 Scanning IndexedDB...');
if (window.indexedDB) {
    indexedDB.databases().then(databases => {
        let dbsCleared = 0;
        databases.forEach(db => {
            if (db.name.toLowerCase().includes('aips') || 
                db.name.toLowerCase().includes('private') ||
                db.name.toLowerCase().includes('search') ||
                db.name.toLowerCase().includes('localhost')) {
                indexedDB.deleteDatabase(db.name);
                console.log(`   - Cleared IndexedDB: ${db.name}`);
                dbsCleared++;
            }
        });
        console.log(`📋 Cleared ${dbsCleared} AIPS-related IndexedDB databases`);
    }).catch(err => {
        console.log('⚠️  IndexedDB scanning failed:', err);
    });
} else {
    console.log('ℹ️  IndexedDB not available');
}

// Summary
console.log('');
console.log('✅ AIPrivateSearch Selective Cleaning Complete!');
console.log('================================================');
console.log(`🗑️  localStorage items cleared: ${aipsLocalKeys.length}`);
console.log(`🗑️  sessionStorage items cleared: ${aipsSessionKeys.length}`);
console.log(`🗑️  Cookies cleared: ${cookiesCleared}`);
console.log('🔒 Other websites and data preserved');
console.log('');
console.log('💡 To verify clearing, run: DebugUtils.logFullState("after manual clear")');

// Return summary for programmatic use
({
    localStorageCleared: aipsLocalKeys.length,
    sessionStorageCleared: aipsSessionKeys.length,
    cookiesCleared: cookiesCleared,
    clearedKeys: {
        localStorage: aipsLocalKeys,
        sessionStorage: aipsSessionKeys
    }
});