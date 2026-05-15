# AIPrivateSearch Hardcoded Defaults

## Overview
When `app.json` fails to load, AIPrivateSearch falls back to hardcoded defaults to ensure the application continues running. This document lists all hardcoded defaults and their implications.

## Current app.json Configuration
```json
{
  "app-name": "AI Private Search",
  "sources-location": "/Users/Shared/AIPrivateSearch/sources",
  "config-location": "/Users/Shared/AIPrivateSearch/config",
  "bearer-token-timeout": 3600,
  "subscription-tier": 1,
  "ports": {
    "frontend": 56305,
    "backend": 56306
  },
  "custmgr": {
    "host": "custmgr.aiprivatesearch.com",
    "protocol": "https"
  }
}
```

## Hardcoded Defaults (When app.json Fails)

### Frontend Defaults (Client-side)

#### 1. API Base URL
- **Current**: `http://localhost:56306` (from app.json)
- **Fallback**: `http://localhost:3001`
- **Location**: `shared/utils/apiConfig.js`
- **Impact**: ⚠️ **CRITICAL** - Wrong port will cause all API calls to fail
- **Code**: `window.API_BASE_URL || 'http://localhost:3001'`

#### 2. App Name
- **Current**: "AI Private Search" (from app.json)
- **Fallback**: "AI Private Search" (hardcoded in HTML)
- **Location**: `index.html` title and header
- **Impact**: ✅ **LOW** - Same as config, no functional impact
- **Code**: Hardcoded in HTML elements

### Backend Defaults (Server-side)

#### 3. Bearer Token Timeout
- **Current**: `3600` seconds (1 hour)
- **Fallback**: `300` seconds (5 minutes)
- **Location**: `lib/utils/appConfig.mjs`, `lib/auth/userManager.mjs`
- **Impact**: ⚠️ **HIGH** - Users will be logged out every 5 minutes instead of 1 hour
- **Code**: `config['bearer-token-timeout'] || 300`

#### 4. Sources Location
- **Current**: `/Users/Shared/AIPrivateSearch/sources`
- **Fallback**: `/Users/Shared/AIPrivateSearch/sources`
- **Location**: `lib/utils/appConfig.mjs`
- **Impact**: ✅ **LOW** - Same as config
- **Code**: `config['sources-location'] || '/Users/Shared/AIPrivateSearch/sources'`

#### 5. Config Location
- **Current**: `/Users/Shared/AIPrivateSearch/config`
- **Fallback**: `/Users/Shared/AIPrivateSearch/config`
- **Location**: `lib/utils/appConfig.mjs`
- **Impact**: ✅ **LOW** - Same as config
- **Code**: `config['config-location'] || '/Users/Shared/AIPrivateSearch/config'`

#### 6. Ports Configuration
- **Current**: `{ frontend: 56305, backend: 56306 }`
- **Fallback**: `{ frontend: 3000, backend: 3001 }`
- **Location**: `lib/utils/appConfig.mjs`
- **Impact**: ⚠️ **CRITICAL** - Wrong ports will prevent app from working
- **Code**: `config['ports'] || { frontend: 3000, backend: 3001 }`

#### 7. Subscription Tier
- **Current**: `1` (Standard)
- **Fallback**: `3` (Professional)
- **Location**: `lib/utils/appConfig.mjs`
- **Impact**: ⚠️ **MEDIUM** - Users get more features than they should
- **Code**: `config['subscription-tier'] || 3`

## Risk Analysis

### 🔴 Critical Issues (App Breaking)

#### Port Mismatch
- **Problem**: Frontend defaults to port 3001, backend defaults to port 3001, but actual backend runs on 56306
- **Result**: All API calls fail, app becomes unusable
- **Solution**: Update hardcoded defaults to match actual ports

#### Config File Missing
- **Problem**: Server throws error if `/Users/Shared/AIPrivateSearch/config/app.json` doesn't exist
- **Result**: Server won't start
- **Solution**: Create fallback config or handle missing file gracefully

### 🟡 High Impact Issues

#### Session Timeout Mismatch
- **Problem**: Sessions expire in 5 minutes instead of 1 hour
- **Result**: Poor user experience, frequent re-authentication
- **Solution**: Update default to match current config (3600 seconds)

#### Subscription Tier Escalation
- **Problem**: Users get Professional tier (3) instead of Standard (1)
- **Result**: Security issue - users access features they shouldn't
- **Solution**: Update default to Standard tier (1)

### 🟢 Low Impact Issues

#### App Name & Paths
- **Problem**: None - defaults match current config
- **Result**: No functional impact
- **Solution**: No action needed

## Recommended Fixes

### 1. Update API Base URL Default
```javascript
// In shared/utils/apiConfig.js
let API_BASE_URL = 'http://localhost:56306'; // Changed from 3001
```

### 2. Update Port Defaults
```javascript
// In lib/utils/appConfig.mjs
return config['ports'] || { frontend: 56305, backend: 56306 }; // Changed from 3000/3001
```

### 3. Update Bearer Token Timeout Default
```javascript
// In lib/utils/appConfig.mjs
return config['bearer-token-timeout'] || 3600; // Changed from 300
```

### 4. Update Subscription Tier Default
```javascript
// In lib/utils/appConfig.mjs
return config['subscription-tier'] || 1; // Changed from 3
```

### 5. Add Graceful Config Handling
```javascript
// In lib/utils/appConfig.mjs
static getConfig() {
  const configPath = '/Users/Shared/AIPrivateSearch/config/app.json';
  
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config;
    }
  } catch (error) {
    console.warn(`[AppConfig] Failed to load config from ${configPath}:`, error.message);
  }
  
  // Return default config instead of throwing error
  console.warn('[AppConfig] Using default configuration');
  return {
    'app-name': 'AI Private Search',
    'sources-location': '/Users/Shared/AIPrivateSearch/sources',
    'config-location': '/Users/Shared/AIPrivateSearch/config',
    'bearer-token-timeout': 3600,
    'subscription-tier': 1,
    'ports': { frontend: 56305, backend: 56306 }
  };
}
```

## Testing Scenarios

### Test 1: Missing app.json
1. Rename `config/app.json` to `config/app.json.bak`
2. Restart application
3. Verify app still works with defaults
4. Check that ports, timeouts, and tiers are correct

### Test 2: Corrupted app.json
1. Add invalid JSON to `config/app.json`
2. Restart application
3. Verify graceful fallback to defaults

### Test 3: Partial app.json
1. Remove specific fields from `config/app.json`
2. Verify individual defaults are applied correctly

## Monitoring & Alerts

### Log Messages to Watch For
- `"Could not load API config, using default port 3001"` - Port mismatch issue
- `"Config file not found"` - Missing config file
- `"Failed to load config"` - Config parsing error
- `"Using default configuration"` - Fallback mode active

### Health Checks
- Verify API calls succeed (port connectivity)
- Monitor session timeout behavior
- Check feature access matches subscription tier
- Validate file path accessibility

This analysis shows that the current hardcoded defaults have critical mismatches that would break the application if app.json fails to load.