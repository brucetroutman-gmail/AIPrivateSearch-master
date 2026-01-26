# User-Tier-Menu Access Test Plan

## Test Setup
1. **Login to custmgr**: https://custmgr.aiprivatesearch.com
2. **Change customer tier** for test user
3. **Login to AIPrivateSearch** with test credentials
4. **Verify menu visibility** matches tier level

## Test Users
- **Admin**: `adm@a.com` / `hello`
- **Searcher**: `srch@a.com` / `hello`

## Test Cases

### Tier 1 (Standard)
1. Set customer tier = 1 in custmgr
2. Login as admin → Check basic admin menus visible
3. Login as searcher → Check basic search menus visible

### Tier 2 (Premium)  
1. Set customer tier = 2 in custmgr
2. Login as admin → Check enhanced admin menus visible
3. Login as searcher → Check advanced search menus visible

### Tier 3 (Professional)
1. Set customer tier = 3 in custmgr  
2. Login as admin → Check full admin menus visible
3. Login as searcher → Check complete search menus visible

## Expected Results
- **License system returns correct tier** (not always tier 1)
- **Menu visibility matches tier level** per tier-access.json
- **User role + tier combination** shows appropriate menus

## Key Files
- `/Users/Shared/AIPrivateSearch/config/tier-access.json`
- License system: device-license-client.mjs
- Menu manager: tierAccessManager.js