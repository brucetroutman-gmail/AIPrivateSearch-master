# User Tier Menu Access Test Plan

## Test Overview
Test menu visibility for different user roles across all tier levels by changing customer tier in custmgr database and verifying menu access for admin and searcher users.

## Menu Items Expected by Tier and Role

### Tier 1 (Standard) - $49/yr after 4 months free - 1 computer

**Admin User (adm-std@a.com):**
- ✅ Search
- ✅ Multi-Mode 
- ✅ Manage Collections
- ✅ Options
- ✅ User Management
- ❌ Manage Models (Premium+)
- ❌ Test (Professional only)
- ❌ Analyze (Professional only)

**Searcher User (srch-std@a.com):**
- ✅ Search
- ✅ Multi-Mode
- ✅ Manage Collections  
- ✅ Options
- ❌ User Management (Admin only)
- ❌ Manage Models (Premium+)
- ❌ Test (Professional only)
- ❌ Analyze (Professional only)

### Tier 2 (Premium) - $199/yr - 5 computers

**Admin User (adm-prem@a.com):**
- ✅ Search
- ✅ Multi-Mode
- ✅ Manage Collections
- ✅ Manage Models
- ✅ Options
- ✅ User Management
- ❌ Test (Professional only)
- ❌ Analyze (Professional only)

**Searcher User (srch-prem@a.com):**
- ✅ Search
- ✅ Multi-Mode
- ✅ Manage Collections
- ✅ Options
- ❌ User Management (Admin only)
- ❌ Manage Models (Admin only at Premium)
- ❌ Test (Professional only)
- ❌ Analyze (Professional only)

### Tier 3 (Professional) - $2999 license - Unlimited computers

**Admin User (adm-pro@a.com):**
- ✅ Search
- ✅ Multi-Mode
- ✅ Manage Collections
- ✅ Manage Models
- ✅ Test
- ✅ Analyze
- ✅ Options
- ✅ User Management

**Searcher User (srch-pro@a.com):**
- ✅ Search
- ✅ Multi-Mode
- ✅ Manage Collections
- ✅ Manage Models
- ✅ Test
- ✅ Analyze
- ✅ Options
- ❌ User Management (Admin only)

## Test Procedure

### Setup
1. **Customer Email**: bruce.troutman@gmail.com
2. **Test Users Available**:
   - adm-std@a.com (Standard Admin)
   - srch-std@a.com (Standard Searcher)  
   - adm-prem@a.com (Premium Admin)
   - srch-prem@a.com (Premium Searcher)
   - adm-pro@a.com (Professional Admin - if exists)
   - srch-pro@a.com (Professional Searcher - if exists)

### Test Steps

#### Test 1: Tier 1 (Standard)
1. Set customer tier to 1 in custmgr database
2. Login as adm-std@a.com → Verify Standard Admin menu items
3. Login as srch-std@a.com → Verify Standard Searcher menu items
4. Document any discrepancies

#### Test 2: Tier 2 (Premium)  
1. Set customer tier to 2 in custmgr database
2. Login as adm-prem@a.com → Verify Premium Admin menu items
3. Login as srch-prem@a.com → Verify Premium Searcher menu items
4. Document any discrepancies

#### Test 3: Tier 3 (Professional)
1. Set customer tier to 3 in custmgr database
2. Login as admin user → Verify Professional Admin menu items
3. Login as searcher user → Verify Professional Searcher menu items
4. Document any discrepancies

## Expected Results Summary

| Menu Item | Std Admin | Std Searcher | Prem Admin | Prem Searcher | Pro Admin | Pro Searcher |
|-----------|-----------|--------------|------------|---------------|-----------|--------------|
| Search | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multi-Mode | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Collections | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Models | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Test | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Analyze | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Options | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| User Management | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |

## Key Testing Notes

- **User Management**: Always admin-only regardless of tier
- **Manage Models**: Premium+ admin only, Professional allows searcher access
- **Test/Analyze**: Professional tier only
- **Search/Multi-Mode/Collections/Options**: Available to all users at all tiers
- **CSS Classes**: Verify proper show/hide of menu elements based on tier and role